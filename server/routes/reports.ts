import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, type Report } from "../db.ts";
import { authenticate, type AuthRequest } from "../middleware/auth.ts";
import { requireRole } from "../middleware/requireRole.ts";
import { rateLimit } from "../middleware/rateLimit.ts";

const router = Router();
const reportLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: "تعداد گزارش‌ها زیاد است؛ بعداً دوباره تلاش کن." });

router.post("/", reportLimit, authenticate, async (req: AuthRequest, res): Promise<void> => {
  const { target_type, target_id, reason } = req.body ?? {};
  if (typeof target_type !== "string" || typeof target_id !== "string" || typeof reason !== "string") {
    res.status(400).json({ error: "نوع محتوا، شناسه و دلیل گزارش الزامی است" });
    return;
  }
  if (!(["script", "comment", "user"] as string[]).includes(target_type) || target_id.length > 100) {
    res.status(400).json({ error: "محتوای مورد گزارش معتبر نیست" });
    return;
  }
  if (reason.trim().length < 5 || reason.trim().length > 500) {
    res.status(400).json({ error: "دلیل گزارش باید بین ۵ تا ۵۰۰ نویسه باشد" });
    return;
  }

  const database = await db.load();
  const exists = target_type === "script"
    ? database.scripts.some((script) => script.id === target_id && !script.pending)
    : target_type === "comment"
      ? database.comments.some((comment) => comment.id === target_id)
      : database.users.some((user) => user.id === target_id);
  if (!exists) {
    res.status(404).json({ error: "محتوای مورد گزارش پیدا نشد" });
    return;
  }

  const duplicate = database.reports.some((report) =>
    report.reporter_id === req.userId && report.target_type === target_type && report.target_id === target_id && report.status === "pending",
  );
  if (duplicate) {
    res.status(409).json({ error: "گزارش در حال بررسی برای این محتوا ثبت شده است" });
    return;
  }

  const report: Report = {
    id: randomUUID(),
    target_type: target_type as Report["target_type"],
    target_id,
    reporter_id: req.userId!,
    reason: reason.trim(),
    status: "pending",
    created_at: new Date().toISOString(),
  };
  database.reports.push(report);
  await db.save();
  res.status(201).json({ ok: true, id: report.id });
});

router.get("/", authenticate, requireRole("moderator"), async (_req, res): Promise<void> => {
  const database = await db.load();
  const items = database.reports.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const enriched = items.map((report) => {
    const reporter = database.users.find((user) => user.id === report.reporter_id);
    return { ...report, reporter_username: reporter?.username ?? "نامشخص" };
  });
  res.json({ items: enriched });
});

router.put("/:id", authenticate, requireRole("moderator"), async (req, res): Promise<void> => {
  const { status } = req.body ?? {};
  if (!["pending", "reviewed", "dismissed"].includes(status)) {
    res.status(400).json({ error: "وضعیت نامعتبر است" });
    return;
  }
  const database = await db.load();
  const report = database.reports.find((entry) => entry.id === req.params.id);
  if (!report) {
    res.status(404).json({ error: "گزارش یافت نشد" });
    return;
  }
  report.status = status;
  await db.save();
  res.json({ ok: true });
});

export default router;
