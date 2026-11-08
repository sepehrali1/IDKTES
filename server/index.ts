import express, { type ErrorRequestHandler } from "express";
import process from "node:process";
import { existsSync } from "node:fs";
import path from "node:path";

// Load local development settings before importing routes that read secrets.
try {
  process.loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const [
  { default: authRoutes },
  { default: scriptsRoutes },
  { default: commentsRoutes },
  { default: reportsRoutes },
  { default: adminRoutes },
  { default: ownerRoutes },
  { default: statsRoutes },
] = await Promise.all([
  import("./routes/auth.ts"),
  import("./routes/scripts.ts"),
  import("./routes/comments.ts"),
  import("./routes/reports.ts"),
  import("./routes/admin.ts"),
  import("./routes/owner.ts"),
  import("./routes/stats.ts"),
]);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(express.json({ limit: "1mb", strict: true }));

app.use("/api/auth", authRoutes);
app.use("/api/scripts", scriptsRoutes);
app.use("/api", commentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ssblox-api" });
});

// In production, serve the Vite build and API from the same origin.
// During development, Vite serves the frontend and proxies /api to this process.
const buildDirectory = path.resolve(process.cwd(), "dist");
const builtIndex = path.join(buildDirectory, "index.html");
if (existsSync(builtIndex)) {
  app.use(express.static(buildDirectory, { index: false, maxAge: "1h", etag: true }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || (req.path === "/api" || req.path.startsWith("/api/")) || path.extname(req.path)) {
      next();
      return;
    }
    res.sendFile(builtIndex);
  });
}

app.use((req, res) => {
  if (req.path === "/api" || req.path.startsWith("/api/")) {
    res.status(404).json({ error: "مسیر API پیدا نشد" });
    return;
  }
  res.status(404).send("صفحه پیدا نشد");
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "حجم درخواست بیش از حد مجاز است" });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "بدنه‌ی درخواست JSON معتبر نیست" });
    return;
  }
  console.error("[server error]", err);
  res.status(500).json({ error: "خطای داخلی سرور" });
};
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log("[SSBLOX API] listening on port " + PORT);
});
