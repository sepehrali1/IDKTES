import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Eye } from "lucide-react";
import { fetchMyScripts, deleteScript } from "../lib/scriptsApi";
import type { ScriptItem } from "../types/script";
import { formatNumber, timeAgo } from "../utils/format";

export default function MyScripts() {
  const [items, setItems] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetchMyScripts();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);


  async function handleDelete(id: string) {
    if (!confirm("حذف شود؟")) return;
    try {
      await deleteScript(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="container">
        <div className="scripts-header">
          <div>
            <h1 className="section-title">اسکریپت‌های من</h1>
            <p className="section-subtitle">{items.length} اسکریپت</p>
          </div>
          <Link to="/scripts/new" className="btn btn-primary">
            <Plus size={18} />
            اسکریپت جدید
          </Link>
        </div>

        {error && <div className="form-error">{error}</div>}

        {items.length === 0 ? (
          <div className="empty-state">
            <p>هنوز اسکریپتی نساختی</p>
            <Link to="/scripts/new" className="btn btn-primary">
              اولین اسکریپت را بساز
            </Link>
          </div>
        ) : (
          <div className="my-scripts-list">
            {items.map((s) => (
              <div key={s.id} className="my-script-row">
                <div className="my-script-info">
                  <h3>
                    <Link to={"/scripts/" + s.id}>{s.title}</Link>
                  </h3>
                  <div className="my-script-meta">
                    <span>{timeAgo(s.created_at)}</span>
                    <span>•</span>
                    <span>
                      <Eye size={12} /> {formatNumber(s.views_count)}
                    </span>
                  </div>
                </div>
                <div className="my-script-status">
                  {s.pending ? (
                    <span className="badge-pending">در صف بررسی ناظر</span>
                  ) : (
                    <span className="badge-published">منتشرشده</span>
                  )}
                </div>
                <div className="my-script-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleDelete(s.id)}
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}