import { useEffect, useState } from "react";
import { Ban, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/api";
import { timeAgo, formatNumber } from "../utils/format";
import { getCategoryName } from "../data/categories";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  verified: boolean;
  banned: boolean;
  created_at: string;
  scripts_count: number;
  warnings_count: number;
}

interface PendingScript {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  author_username: string;
}

interface ReportItem {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_username: string;
}

type Tab = "users" | "pending" | "reports";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pending, setPending] = useState<PendingScript[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnInput, setWarnInput] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    try {
      const [uRes, pRes, rRes] = await Promise.all([
        apiRequest<{ items: AdminUser[] }>("/api/admin/users"),
        apiRequest<{ items: PendingScript[] }>("/api/admin/scripts/pending"),
        apiRequest<{ items: ReportItem[] }>("/api/reports"),
      ]);
      setUsers(uRes.items);
      setPending(pRes.items);
      setReports(rRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleBan(user: AdminUser) {
    try {
      const path = user.banned
        ? "/api/admin/users/" + user.id + "/unban"
        : "/api/admin/users/" + user.id + "/ban";
      await apiRequest(path, { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function warnUser(user: AdminUser) {
    const reason = warnInput[user.id]?.trim();
    if (!reason) {
      setError("دلیل اخطار را بنویسید");
      return;
    }
    try {
      await apiRequest("/api/admin/users/" + user.id + "/warn", {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setWarnInput((s) => ({ ...s, [user.id]: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function approveScript(id: string) {
    try {
      await apiRequest("/api/admin/scripts/" + id + "/approve", {
        method: "POST",
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function deleteScript(id: string) {
    if (!confirm("حذف شود؟")) return;
    try {
      await apiRequest("/api/admin/scripts/" + id, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function updateReportStatus(id: string, status: string) {
    try {
      await apiRequest("/api/reports/" + id, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="form-page">
      <div className="container">
        <h1 className="section-title">پنل مدیریت</h1>
        <p className="section-subtitle" style={{ marginBottom: 24 }}>
          مدیریت کاربران، اسکریپت‌های منتظر تأیید و گزارش‌ها
        </p>

        {error && <div className="form-error">{error}</div>}

        <div className="admin-tabs">
          <button
            type="button"
            className={tab === "users" ? "tab active" : "tab"}
            onClick={() => setTab("users")}
          >
            کاربران ({users.length})
          </button>
          <button
            type="button"
            className={tab === "pending" ? "tab active" : "tab"}
            onClick={() => setTab("pending")}
          >
            منتظر تأیید ({pending.length})
          </button>
          <button
            type="button"
            className={tab === "reports" ? "tab active" : "tab"}
            onClick={() => setTab("reports")}
          >
            گزارش‌ها ({reports.length})
          </button>
        </div>

        {loading ? (
          <div className="page-loading">
            <div className="loading-spinner" />
          </div>
        ) : (
          <>
            {tab === "users" && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>کاربر</th>
                      <th>ایمیل</th>
                      <th>نقش</th>
                      <th>اسکریپت‌ها</th>
                      <th>اخطارها</th>
                      <th>وضعیت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td dir="ltr">{u.email}</td>
                        <td>{u.role}</td>
                        <td>{formatNumber(u.scripts_count)}</td>
                        <td>{formatNumber(u.warnings_count)}</td>
                        <td>
                          {u.banned ? (
                            <span className="badge-banned">مسدود</span>
                          ) : (
                            <span className="badge-active">فعال</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-actions">
                            {u.role !== "owner" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => toggleBan(u)}
                                >
                                  <Ban size={14} />
                                  {u.banned ? "رفع مسدودی" : "مسدودسازی"}
                                </button>
                                <input
                                  type="text"
                                  placeholder="دلیل اخطار..."
                                  className="admin-input"
                                  value={warnInput[u.id] ?? ""}
                                  onChange={(e) =>
                                    setWarnInput((s) => ({
                                      ...s,
                                      [u.id]: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => warnUser(u)}
                                >
                                  <ShieldAlert size={14} />
                                  اخطار
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "pending" && (
              <div className="admin-table-wrap">
                {pending.length === 0 ? (
                  <p className="empty-state">اسکریپتی منتظر تأیید نیست</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>عنوان</th>
                        <th>نویسنده</th>
                        <th>دسته</th>
                        <th>تاریخ</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((p) => (
                        <tr key={p.id}>
                          <td>{p.title}</td>
                          <td>{p.author_username}</td>
                          <td>{getCategoryName(p.category)}</td>
                          <td>{timeAgo(p.created_at)}</td>
                          <td>
                            <div className="admin-actions">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => approveScript(p.id)}
                              >
                                <CheckCircle2 size={14} />
                                تأیید
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => deleteScript(p.id)}
                              >
                                <Trash2 size={14} />
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "reports" && (
              <div className="admin-table-wrap">
                {reports.length === 0 ? (
                  <p className="empty-state">گزارشی نیست</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>گزارش‌دهنده</th>
                        <th>نوع</th>
                        <th>دلیل</th>
                        <th>وضعیت</th>
                        <th>تاریخ</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id}>
                          <td>{r.reporter_username}</td>
                          <td>{r.target_type}</td>
                          <td>{r.reason}</td>
                          <td>{r.status}</td>
                          <td>{timeAgo(r.created_at)}</td>
                          <td>
                            <div className="admin-actions">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() =>
                                  updateReportStatus(r.id, "reviewed")
                                }
                              >
                                بررسی‌شده
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  updateReportStatus(r.id, "dismissed")
                                }
                              >
                                رد
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}