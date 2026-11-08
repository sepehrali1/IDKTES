import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, type Script } from "../db.ts";
import { authenticate, optionalAuthenticate, type AuthRequest } from "../middleware/auth.ts";
import { rateLimit } from "../middleware/rateLimit.ts";

const router = Router();
const uploadLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 8, message: "تعداد ارسال محتوا زیاد است؛ یک ساعت بعد دوباره تلاش کن." });
const likeLimit = rateLimit({ windowMs: 60 * 1000, max: 60 });
const ALLOWED_CATEGORIES = new Set(["ui", "gameplay", "data", "tools", "animation", "effects", "network", "learning"]);

interface AuthorInfo {
  id: string;
  username: string;
  verified: boolean;
}

interface PublicScript {
  id: string;
  title: string;
  description: string;
  code: string;
  category: string;
  image_url: string | null;
  likes_count: number;
  views_count: number;
  pending: boolean;
  created_at: string;
  updated_at: string;
  author: AuthorInfo;
  liked_by_me: boolean;
  is_mine: boolean;
}

async function toPublicScript(script: Script, currentUserId: string | null): Promise<PublicScript> {
  const database = await db.load();
  const author = database.users.find((user) => user.id === script.author_id);
  const likedByMe = currentUserId
    ? database.likes.some((like) => like.user_id === currentUserId && like.script_id === script.id)
    : false;

  return {
    id: script.id,
    title: script.title,
    description: script.description,
    code: script.code,
    category: script.category,
    image_url: script.image_url,
    likes_count: script.likes_count,
    views_count: script.views_count,
    pending: script.pending,
    created_at: script.created_at,
    updated_at: script.updated_at,
    author: {
      id: author?.id ?? "",
      username: author?.username ?? "نامشخص",
      verified: author?.verified ?? false,
    },
    liked_by_me: likedByMe,
    is_mine: currentUserId === script.author_id,
  };
}

router.get("/", optionalAuthenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const search = typeof req.query.search === "string" ? req.query.search.slice(0, 100).trim().toLowerCase() : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const sort = typeof req.query.sort === "string" ? req.query.sort : "new";
  const page = Math.max(1, Math.min(100000, parseInt(String(req.query.page ?? "1"), 10) || 1));
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? "12"), 10) || 12));

  let filtered = database.scripts.filter((script) => !script.pending);
  if (search) {
    filtered = filtered.filter((script) =>
      script.title.toLowerCase().includes(search) || script.description.toLowerCase().includes(search),
    );
  }
  if (category && ALLOWED_CATEGORIES.has(category)) {
    filtered = filtered.filter((script) => script.category === category);
  }
  if (sort === "new") {
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else if (sort === "trending" || sort === "likes") {
    filtered.sort((a, b) => b.likes_count - a.likes_count);
  } else if (sort === "views") {
    filtered.sort((a, b) => b.views_count - a.views_count);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  const publicItems = await Promise.all(items.map((script) => toPublicScript(script, req.userId ?? null)));
  res.json({ items: publicItems, total, page, totalPages });
});

router.get("/mine", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const mine = database.scripts
    .filter((script) => script.author_id === req.userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const items = await Promise.all(mine.map((script) => toPublicScript(script, req.userId ?? null)));
  res.json({ items });
});

router.get("/:id", optionalAuthenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const script = database.scripts.find((entry) => entry.id === req.params.id);
  if (!script) {
    res.status(404).json({ error: "اسکریپت یافت نشد" });
    return;
  }

  if (script.pending) {
    const viewer = database.users.find((user) => user.id === req.userId);
    const canView = Boolean(viewer && (viewer.id === script.author_id || viewer.role === "moderator" || viewer.role === "owner"));
    if (!canView) {
      // Avoid revealing whether a private pending record exists.
      res.status(404).json({ error: "اسکریپت یافت نشد" });
      return;
    }
  } else if (script.author_id !== req.userId) {
    script.views_count += 1;
    await db.save();
  }

  res.json({ script: await toPublicScript(script, req.userId ?? null) });
});

router.post("/", uploadLimit, authenticate, async (req: AuthRequest, res): Promise<void> => {
  const { title, description, code, category, image_url, safety_confirmed } = req.body ?? {};
  if (typeof title !== "string" || typeof description !== "string" || typeof code !== "string" || typeof category !== "string") {
    res.status(400).json({ error: "عنوان، توضیحات، دسته‌بندی و کد الزامی هستند" });
    return;
  }
  if (title.trim().length < 3 || title.trim().length > 100) {
    res.status(400).json({ error: "عنوان باید بین ۳ تا ۱۰۰ نویسه باشد" });
    return;
  }
  if (description.trim().length < 10 || description.trim().length > 2000) {
    res.status(400).json({ error: "توضیحات باید بین ۱۰ تا ۲۰۰۰ نویسه باشد" });
    return;
  }
  if (code.trim().length < 10 || code.length > 100000) {
    res.status(400).json({ error: "کد باید بین ۱۰ تا ۱۰۰٬۰۰۰ نویسه باشد" });
    return;
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    res.status(400).json({ error: "دسته‌بندی انتخاب‌شده معتبر نیست" });
    return;
  }
  if (safety_confirmed !== true) {
    res.status(400).json({ error: "تأیید قوانین انتشار الزامی است" });
    return;
  }

  let safeImageUrl: string | null = null;
  if (image_url !== undefined && image_url !== null && image_url !== "") {
    if (typeof image_url !== "string" || image_url.length > 2048) {
      res.status(400).json({ error: "آدرس تصویر معتبر نیست" });
      return;
    }
    try {
      const parsedImageUrl = new URL(image_url);
      if (parsedImageUrl.protocol !== "https:" || parsedImageUrl.username || parsedImageUrl.password) {
        throw new Error("Unsafe image URL");
      }
      safeImageUrl = parsedImageUrl.toString();
    } catch {
      res.status(400).json({ error: "لینک تصویر باید یک آدرس HTTPS معتبر باشد" });
      return;
    }
  }

  const database = await db.load();
  const user = database.users.find((entry) => entry.id === req.userId);
  if (!user) {
    res.status(401).json({ error: "کاربر یافت نشد" });
    return;
  }

  const now = new Date().toISOString();
  const isPrivileged = user.role === "owner" || user.role === "moderator";
  const script: Script = {
    id: randomUUID(),
    title: title.trim(),
    description: description.trim(),
    code,
    category,
    author_id: user.id,
    image_url: safeImageUrl,
    safety_confirmed: true,
    likes_count: 0,
    views_count: 0,
    pending: !isPrivileged,
    created_at: now,
    updated_at: now,
  };

  database.scripts.push(script);
  await db.save();
  res.status(201).json({ script: await toPublicScript(script, user.id) });
});

router.delete("/:id", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const idx = database.scripts.findIndex((script) => script.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "اسکریپت یافت نشد" });
    return;
  }

  const script = database.scripts[idx];
  const user = database.users.find((entry) => entry.id === req.userId);
  if (!user) {
    res.status(401).json({ error: "کاربر یافت نشد" });
    return;
  }
  const isOwner = script.author_id === user.id;
  const isAdmin = user.role === "owner" || user.role === "moderator";
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "دسترسی ندارید" });
    return;
  }

  database.scripts.splice(idx, 1);
  database.likes = database.likes.filter((like) => like.script_id !== script.id);
  database.comments = database.comments.filter((comment) => comment.script_id !== script.id);
  database.reports = database.reports.filter((report) => !(report.target_type === "script" && report.target_id === script.id));
  await db.save();
  res.json({ ok: true });
});

router.post("/:id/like", likeLimit, authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const script = database.scripts.find((entry) => entry.id === req.params.id && !entry.pending);
  if (!script) {
    res.status(404).json({ error: "اسکریپت یافت نشد" });
    return;
  }

  const existing = database.likes.findIndex((like) => like.user_id === req.userId && like.script_id === script.id);
  let liked: boolean;
  if (existing >= 0) {
    database.likes.splice(existing, 1);
    script.likes_count = Math.max(0, script.likes_count - 1);
    liked = false;
  } else {
    database.likes.push({
      id: randomUUID(),
      user_id: req.userId!,
      script_id: script.id,
      created_at: new Date().toISOString(),
    });
    script.likes_count += 1;
    liked = true;
  }

  await db.save();
  res.json({ liked, likes_count: script.likes_count });
});

export default router;
