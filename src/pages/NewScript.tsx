import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertCircle } from "lucide-react";
import { createScript } from "../lib/scriptsApi";
import { categories } from "../data/categories";

export default function NewScript() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "ui");
  const [imageUrl, setImageUrl] = useState("");
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await createScript({
        title,
        description,
        code,
        category,
        image_url: imageUrl || null,
        safety_confirmed: safetyConfirmed,
      });
      navigate("/scripts/" + res.script.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-card">
          <h1>انتشار اسکریپت جدید</h1>
          <p className="form-subtitle">
            نمونه‌کدهای مخصوص ساخت بازی خودت در Roblox Studio را با جامعه به اشتراک بگذار.
          </p>

          {error && (
            <div className="form-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="form-field">
              <span>عنوان</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً سیستم Leaderstats برای بازی خودم"
                required
                minLength={3}
                maxLength={100}
              />
            </label>

            <label className="form-field">
              <span>دسته‌بندی</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field full">
              <span>لینک تصویر (اختیاری)</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                dir="ltr"
              />
            </label>

            <label className="form-field full">
              <span>توضیحات</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="این اسکریپت چه کاری انجام می‌دهد؟"
                rows={4}
                required
                minLength={10}
                maxLength={2000}
              />
            </label>

            <label className="form-field full">
              <span>کد Luau</span>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="-- کد Luau خود را اینجا بنویسید"
                rows={12}
                required
                minLength={10}
                maxLength={100000}
                dir="ltr"
                className="code-textarea"
              />
            </label>

            <label className="safety-confirmation full">
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                required
              />
              <span>تأیید می‌کنم این محتوا برای توسعه‌ی قانونی بازی خودم در Roblox Studio است و شامل اکسپلویت، تقلب، دورزدن امنیت یا کد مخرب نیست.</span>
            </label>

            <div className="form-actions full">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || !safetyConfirmed}
              >
                <Plus size={18} />
                {submitting ? "در حال ارسال..." : "ثبت اسکریپت"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}