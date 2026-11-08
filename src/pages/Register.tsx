import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ownerSetupKey, setOwnerSetupKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(email, username, password, ownerSetupKey);
      navigate("/profile");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ثبت‌نام";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <UserPlus size={28} />
            </div>
            <h1>ساخت حساب در SSBLOX</h1>
            <p>رایگان، سریع، و بدون نیاز به کارت بانکی.</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="form-field">
              <span>ایمیل</span>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
            </label>

            <label className="form-field">
              <span>نام کاربری</span>
              <div className="input-wrap">
                <User size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Sskid"
                  required
                  minLength={3}
                  maxLength={24}
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="form-field">
              <span>رمز عبور (حداقل ۱۰ نویسه، حداکثر ۷۲ نویسه)</span>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={10}
                  maxLength={72}
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>
            </label>

            <details className="owner-setup-details">
              <summary>راه‌اندازی اولیه مالک پلتفرم</summary>
              <p>فقط هنگام ساخت اولین حساب مالک، کلید خصوصی تنظیم‌شده در سرور را وارد کن. این فیلد برای ثبت‌نام عادی لازم نیست.</p>
              <input
                type="password"
                value={ownerSetupKey}
                onChange={(e) => setOwnerSetupKey(e.target.value)}
                placeholder="کلید راه‌اندازی مالک"
                autoComplete="off"
                dir="ltr"
              />
            </details>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={submitting}
            >
              {submitting ? "در حال ساخت حساب..." : "ثبت‌نام"}
            </button>
          </form>

          <div className="auth-footer">
            قبلاً حساب داشتی؟{" "}
            <Link to="/login" className="auth-link">
              وارد شو
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}