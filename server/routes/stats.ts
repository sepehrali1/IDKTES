import { Router } from "express";
import { db } from "../db.ts";
import { authenticate, type AuthRequest } from "../middleware/auth.ts";

const router = Router();

router.get("/", async (_req, res): Promise<void> => {
  const database = await db.load();
  const published = database.scripts.filter((script) => !script.pending);
  const totalViews = published.reduce((sum, script) => sum + script.views_count, 0);
  const totalLikes = published.reduce((sum, script) => sum + script.likes_count, 0);
  const byCategory: Record<string, number> = {};
  for (const script of published) byCategory[script.category] = (byCategory[script.category] || 0) + 1;
  res.json({ users: database.users.length, scripts: published.length, views: totalViews, likes: totalLikes, by_category: byCategory });
});

router.get("/me", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const database = await db.load();
  const ownScripts = database.scripts.filter((script) => script.author_id === req.userId && !script.pending);
  const ownScriptIds = new Set(ownScripts.map((script) => script.id));
  const likes = database.likes.filter((like) => ownScriptIds.has(like.script_id)).length;
  const comments = database.comments.filter((comment) => comment.user_id === req.userId).length;
  res.json({ scripts: ownScripts.length, likes, comments });
});

export default router;
