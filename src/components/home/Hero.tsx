import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";

const CODE_SAMPLE = [
  "-- SSBLOX • Roblox Studio example",
  'local Players = game:GetService("Players")',
  "",
  "Players.PlayerAdded:Connect(function(player)",
  '    local leaderstats = Instance.new("Folder")',
  '    leaderstats.Name = "leaderstats"',
  "    leaderstats.Parent = player",
  "",
  '    local coins = Instance.new("IntValue")',
  '    coins.Name = "Coins"',
  "    coins.Value = 0",
  "    coins.Parent = leaderstats",
  "end)",
  "",
  'print("SSBLOX Studio snippet loaded")',
].join("\n");

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-blob hero-blob-red" />
        <div className="hero-blob hero-blob-purple" />
        <div className="hero-grid" />
      </div>

      <div className="container hero-inner">
        <div className="hero-content">
          <span className="hero-badge">
            <Sparkles size={14} />
            کتابخانه‌ی کدهای آموزشی و توسعه‌ی Roblox Studio
          </span>

          <h1 className="hero-title">
            دنیای <span className="gradient-text">اسکریپت‌های</span>
            <br />
            Roblox
          </h1>

          <p className="hero-subtitle">
            نمونه‌کدهای Luau را پیدا کن، یاد بگیر و برای ساخت بازی خودت در Roblox Studio توسعه بده. کدها را همیشه قبل از استفاده بررسی کن.
          </p>

          <div className="hero-actions">
            <Link to="/scripts" className="btn btn-primary btn-lg">
              مرور اسکریپت‌ها
              <ArrowLeft size={18} />
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg">
              عضویت رایگان
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="code-card">
            <div className="code-card-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="code-card-title">leaderstats.server.luau</span>
            </div>
            <pre className="code-card-body">{CODE_SAMPLE}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}