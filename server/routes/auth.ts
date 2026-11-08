import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { db, type User } from "../db.ts";
import { authenticate, JWT_SECRET, type AuthRequest } from "../middleware/auth.ts";
import { rateLimit } from "../middleware/rateLimit.ts";

const router = Router();
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: "تلاش‌های ثبت‌نام زیاد است؛ یک ساعت بعد دوباره امتحان کن." });
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "تلاش‌های ورود زیاد است؛ ۱۵ دقیقه بعد دوباره امتحان کن." });

interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: User["role"];
  verified: boolean;
  banned: boolean;
  created_at: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    verified: user.verified,
    banned: user.banned,
    created_at: user.created_at,
  };
}

function issueToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "12h",
    issuer: "ssblox",
    audience: "ssblox-web",
  });
}

function matchesSecret(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

router.post("/register", registerLimit, async (req, res): Promise<void> => {
  const { email, username, password, owner_setup_key } = req.body ?? {};

  if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "همه‌ی فیلدهای ثبت‌نام الزامی هستند" });
    return;
  }

  const emailNorm = email.trim().toLowerCase();
  const usernameNorm = username.trim();
  if (emailNorm.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNorm)) {
    res.status(400).json({ error: "ایمیل معتبر وارد کن" });
    return;
  }
  if (usernameNorm.length < 3 || usernameNorm.length > 24 || !/^[\p{L}\p{N}_.-]+$/u.test(usernameNorm)) {
    res.status(400).json({ error: "نام کاربری باید ۳ تا ۲۴ نویسه و بدون فاصله باشد" });
    return;
  }
  if (Array.from(password).length < 10 || Buffer.byteLength(password, "utf8") > 72 || !password.trim()) {
    res.status(400).json({ error: "رمز عبور باید حداقل ۱۰ نویسه و حداکثر ۷۲ بایت باشد" });
    return;
  }

  const configuredBootstrapKey = process.env.OWNER_BOOTSTRAP_KEY?.trim();
  const suppliedBootstrapKey = typeof owner_setup_key === "string" ? owner_setup_key : "";
  if (suppliedBootstrapKey && (!configuredBootstrapKey || !matchesSecret(suppliedBootstrapKey, configuredBootstrapKey))) {
    res.status(403).json({ error: "کلید راه‌اندازی مالک معتبر نیست" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const database = await db.load();

  if (database.users.some((user) => user.email === emailNorm)) {
    res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است" });
    return;
  }
  if (database.users.some((user) => user.username.toLowerCase() === usernameNorm.toLowerCase())) {
    res.status(409).json({ error: "این نام کاربری قبلاً گرفته شده است" });
    return;
  }

  // The check happens after the async password hash. The owner is inserted synchronously
  // before the next request can pass this check, preventing two first-owner registrations.
  const hasOwner = database.users.some((user) => user.role === "owner");
  const canBootstrapOwner = Boolean(configuredBootstrapKey && suppliedBootstrapKey && !hasOwner);
  if (suppliedBootstrapKey && hasOwner) {
    res.status(409).json({ error: "مالک اولیه قبلاً راه‌اندازی شده است" });
    return;
  }

  const now = new Date().toISOString();
  const user: User = {
    id: randomUUID(),
    email: emailNorm,
    username: usernameNorm,
    password_hash,
    role: canBootstrapOwner ? "owner" : "user",
    verified: canBootstrapOwner,
    banned: false,
    created_at: now,
  };

  database.users.push(user);
  await db.save();
  res.status(201).json({ token: issueToken(user.id), user: toPublicUser(user) });
});

router.post("/login", loginLimit, async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "ایمیل و رمز عبور الزامی هستند" });
    return;
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    res.status(400).json({ error: "رمز عبور واردشده معتبر نیست" });
    return;
  }

  const emailNorm = email.trim().toLowerCase();
  const database = await db.load();
  const user = database.users.find((entry) => entry.email === emailNorm);
  if (!user) {
    res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "حساب شما مسدود شده است" });
    return;
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است" });
    return;
  }

  res.json({ token: issueToken(user.id), user: toPublicUser(user) });
});

router.get("/me", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const user = database.users.find((entry) => entry.id === req.userId);
  if (!user) {
    res.status(401).json({ error: "کاربر یافت نشد" });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

export default router;
