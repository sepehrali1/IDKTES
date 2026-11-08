import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, type Comment } from "../db.ts";
import { authenticate, optionalAuthenticate, type AuthRequest } from "../middleware/auth.ts";
import { rateLimit } from "../middleware/rateLimit.ts";

const router = Router();
const commentLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: "تعداد کامنت‌ها زیاد است؛ کمی بعد دوباره تلاش کن." });

interface PublicComment {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; username: string; verified: boolean };
  is_mine: boolean;
}

async function toPublicComment(comment: Comment, currentUserId: string | null): Promise<PublicComment> {
  const database = await db.load();
  const author = database.users.find((user) => user.id === comment.user_id);
  return {
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    author: {
      id: author?.id ?? "",
      username: author?.username ?? "نامشخص",
      verified: author?.verified ?? false,
    },
    is_mine: currentUserId === comment.user_id,
  };
}

router.get("/scripts/:id/comments", optionalAuthenticate, async (req: AuthRequest, res): Promise<void> => {
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
      res.status(404).json({ error: "اسکریپت یافت نشد" });
      return;
    }
  }

  const comments = database.comments
    .filter((comment) => comment.script_id === script.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const publicComments = await Promise.all(comments.map((comment) => toPublicComment(comment, req.userId ?? null)));
  res.json({ comments: publicComments });
});

router.post("/scripts/:id/comments", commentLimit, authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const script = database.scripts.find((entry) => entry.id === req.params.id && !entry.pending);
  if (!script) {
    res.status(404).json({ error: "اسکریپت یافت نشد" });
    return;
  }

  const { content } = req.body ?? {};
  if (typeof content !== "string" || content.trim().length < 2 || content.trim().length > 1000) {
    res.status(400).json({ error: "متن کامنت باید بین ۲ تا ۱۰۰۰ نویسه باشد" });
    return;
  }

  const comment: Comment = {
    id: randomUUID(),
    script_id: script.id,
    user_id: req.userId!,
    content: content.trim(),
    created_at: new Date().toISOString(),
  };
  database.comments.push(comment);
  await db.save();
  res.status(201).json({ comment: await toPublicComment(comment, req.userId ?? null) });
});

router.delete("/comments/:id", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const idx = database.comments.findIndex((comment) => comment.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "کامنت یافت نشد" });
    return;
  }

  const comment = database.comments[idx];
  const user = database.users.find((entry) => entry.id === req.userId);
  if (!user) {
    res.status(401).json({ error: "کاربر یافت نشد" });
    return;
  }
  const canDelete = comment.user_id === user.id || user.role === "owner" || user.role === "moderator";
  if (!canDelete) {
    res.status(403).json({ error: "دسترسی ندارید" });
    return;
  }

  database.comments.splice(idx, 1);
  database.reports = database.reports.filter((report) => !(report.target_type === "comment" && report.target_id === comment.id));
  await db.save();
  res.json({ ok: true });
});

export default router;
