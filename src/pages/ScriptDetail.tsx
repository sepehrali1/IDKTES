import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Eye,
  Copy,
  Check,
  BadgeCheck,
  Clock,
  Trash2,
  ArrowRight,
  Flag,
  ShieldAlert,
} from "lucide-react";
import {
  fetchScript,
  toggleLike,
  deleteScript,
  fetchComments,
  postComment,
  deleteComment,
  reportScript,
} from "../lib/scriptsApi";
import type { ScriptItem, CommentItem } from "../types/script";
import { useAuth } from "../contexts/AuthContext";
import { formatNumber, timeAgo, toPersianDigits } from "../utils/format";
import { getCategoryName } from "../data/categories";

export default function ScriptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [script, setScript] = useState<ScriptItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchScript(id), fetchComments(id)])
      .then(([sRes, cRes]) => {
        if (!mounted) return;
        setScript(sRes.script);
        setComments(cRes.comments);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "خطا در بارگذاری");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleLike() {
    if (!script) return;
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await toggleLike(script.id);
      setScript((prev) =>
        prev
          ? { ...prev, liked_by_me: res.liked, likes_count: res.likes_count }
          : prev
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function handleCopy() {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("کپی ناموفق");
    }
  }

  async function handleDelete() {
    if (!script) return;
    if (!confirm("آیا مطمئنید؟")) return;
    try {
      await deleteScript(script.id);
      navigate("/scripts");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!script || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await postComment(script.id, commentText);
      setComments((prev) => [...prev, res.comment]);
      setCommentText("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "خطا");
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleReport(e: FormEvent) {
    e.preventDefault();
    if (!script || reportReason.trim().length < 5) return;
    setReportSubmitting(true);
    setActionError(null);
    try {
      await reportScript(script.id, reportReason.trim());
      setReportOpen(false);
      setReportReason("");
      setNotice("گزارش شما برای بررسی ارسال شد");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ارسال گزارش ناموفق بود");
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "خطا");
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

  if (error || !script) {
    return (
      <div className="container detail-error">
        <p>{error ?? "اسکریپت یافت نشد"}</p>
        <Link to="/scripts" className="btn btn-primary">
          <ArrowRight size={16} />
          بازگشت به لیست
        </Link>
      </div>
    );
  }

  return (
    <div className="script-detail-page">
      <div className="container">
        <Link to="/scripts" className="back-link">
          <ArrowRight size={16} />
          بازگشت به لیست
        </Link>

        <div className="detail-card">
          {script.image_url && (
            <div className="detail-image">
              <img src={script.image_url} alt={script.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            </div>
          )}

          <div className="detail-header">
            <div className="detail-meta-top">
              <span className="badge-category">{getCategoryName(script.category)}</span>
              {script.pending && (
                <span className="badge-pending">منتظر تأیید</span>
              )}
            </div>
            <h1>{script.title}</h1>
            <div className="detail-author">
              <div className="author-avatar">
                {script.author.username.charAt(0).toUpperCase()}
              </div>
              <span>{script.author.username}</span>
              {script.author.verified && (
                <BadgeCheck size={16} className="verified-badge" />
              )}
              <span className="dot-sep">•</span>
              <Clock size={14} />
              <span>{timeAgo(script.created_at)}</span>
            </div>
          </div>

          <p className="detail-description">{script.description}</p>

          <div className="detail-actions">
            <button
              type="button"
              className={
                script.liked_by_me ? "btn btn-primary" : "btn btn-outline"
              }
              onClick={handleLike}
            >
              <Heart
                size={16}
                fill={script.liked_by_me ? "currentColor" : "none"}
              />
              {formatNumber(script.likes_count)}
            </button>
            <div className="stat">
              <Eye size={16} />
              {formatNumber(script.views_count)}
            </div>
            {user && !script.is_mine && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setReportOpen((open) => !open)}
              >
                <Flag size={16} />
                گزارش محتوا
              </button>
            )}
            {script.is_mine && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                حذف
              </button>
            )}
          </div>

          {actionError && <div className="form-error" role="alert">{actionError}</div>}
          {notice && <div className="form-success" role="status">{notice}</div>}

          {reportOpen && (
            <form className="report-panel" onSubmit={handleReport}>
              <div className="report-panel-title">
                <Flag size={18} />
                گزارش این محتوا
              </div>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="دلیل گزارش را دقیق بنویس..."
                rows={3}
                minLength={5}
                maxLength={500}
                required
              />
              <div className="report-panel-actions">
                <button className="btn btn-primary" type="submit" disabled={reportSubmitting || reportReason.trim().length < 5}>
                  {reportSubmitting ? "در حال ارسال..." : "ارسال گزارش"}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setReportOpen(false)}>
                  انصراف
                </button>
              </div>
            </form>
          )}

          <div className="code-block">
            <div className="code-header">
              <span className="code-lang">Luau</span>
              <button
                type="button"
                className="btn btn-ghost btn-copy"
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "کپی شد" : "کپی کد"}
              </button>
            </div>
            <pre className="code-body">
              <code>{script.code}</code>
            </pre>
          </div>

          <div className="code-safety-note">
            <ShieldAlert size={18} />
            <p>این کد فقط یک نمونه‌ی متنی است. قبل از استفاده، خط‌به‌خط آن را بررسی و در محیط آزمایشی بازی خودت امتحان کن. هرگز کد ناشناس را بدون بررسی اجرا نکن.</p>
          </div>

          <div className="comments-section">
            <h2>دیدگاه‌ها ({toPersianDigits(comments.length)})</h2>

            {user ? (
              <form onSubmit={handleComment} className="comment-form">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="نظرت رو بنویس..."
                  rows={3}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={commentSubmitting || !commentText.trim()}
                >
                  {commentSubmitting ? "در حال ارسال..." : "ارسال"}
                </button>
              </form>
            ) : (
              <p className="comment-login-hint">
                برای کامنت گذاشتن <Link to="/login">وارد</Link> شوید.
              </p>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="empty-comments">
                  هنوز کامنتی نیست — اولین نفر باشید!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">
                      {c.author.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-head">
                        <span className="comment-username">
                          {c.author.username}
                        </span>
                        {c.author.verified && (
                          <BadgeCheck size={14} className="verified-badge" />
                        )}
                        <span className="comment-time">
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                      <p>{c.content}</p>
                    </div>
                    {c.is_mine && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDeleteComment(c.id)}
                        aria-label="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}