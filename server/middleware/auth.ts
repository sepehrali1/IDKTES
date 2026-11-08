import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db } from "../db.ts";

const configuredSecret = process.env.JWT_SECRET?.trim();
if (!configuredSecret || configuredSecret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters before the API starts.");
}
export const JWT_SECRET = configuredSecret;

export interface AuthRequest extends Request {
  userId?: string;
}

async function setAuthenticatedUser(
  req: AuthRequest,
  token: string,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let payload: JwtPayload;
  try {
    const verified = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "ssblox",
      audience: "ssblox-web",
    });
    if (typeof verified === "string" || typeof verified.sub !== "string") {
      throw new Error("Invalid token payload");
    }
    payload = verified;
  } catch {
    res.status(401).json({ error: "توکن نامعتبر یا منقضی شده" });
    return;
  }

  const database = await db.load();
  const user = database.users.find((entry) => entry.id === payload.sub);
  if (!user) {
    res.status(401).json({ error: "کاربر یافت نشد" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "حساب شما مسدود شده است" });
    return;
  }

  req.userId = user.id;
  next();
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "نیاز به احراز هویت" });
    return;
  }
  await setAuthenticatedUser(req, header.slice(7), res, next);
}

/** Populates req.userId when a valid bearer token is present, without requiring login. */
export async function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header) {
    next();
    return;
  }
  if (!header.startsWith("Bearer ") || header.length <= 7) {
    res.status(401).json({ error: "توکن نامعتبر است" });
    return;
  }
  await setAuthenticatedUser(req, header.slice(7), res, next);
}
