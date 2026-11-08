import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
};

type Bucket = { count: number; resetAt: number };

/** Small in-memory limiter for a single Node process. Use a shared store when scaling horizontally. */
export function rateLimit({ windowMs, max, message = "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کن." }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const address = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(address);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(address, bucket);
    }

    bucket.count += 1;
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.status(429).json({ error: message });
      return;
    }

    // Opportunistic cleanup keeps the map bounded without a background timer.
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }

    next();
  };
}
