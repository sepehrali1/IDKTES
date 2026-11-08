import { useEffect, useState } from "react";
import { BadgeCheck, Shield } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface OwnerUser {
  id: string;
  email: string;
  username: string;
  role: "user" | "moderator" | "owner";
  verified: boolean;
  banned: boolean;
  created_at: string;
}

export default function Owner() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<OwnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await apiRequest<{ items: OwnerUser[] }>("/api/owner/users");
      setUsers(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleVerified(u: OwnerUser) {
    try {
      await apiRequest("/api/owner/users/" + u.id + "/verified", {
        method: "PUT",
        body: JSON.stringify({ verified: !u.verified }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  async function changeRole(u: OwnerUser, role: string) {
    try {
      await apiRequest("/api/owner/users/" + u.id + "/role", {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا");
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="container">
        <div className="owner-header">
          <Shield size={28} />
          <div>
            <h1 className="section-title">پنل مالک</h1>
            <p className="section-subtitle">
              تأیید حساب کاربران و مدیریت نقش‌ها
            </p>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>ایمیل</th>
                <th>تیک آبی</th>
                <th>نقش</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.username}
                    {u.id === me?.id && (
                      <span style={{ color: "#a855f7", marginInlineStart: 8 }}>
                        (شما)
                      </span>
                    )}
                  </td>
                  <td dir="ltr">{u.email}</td>
                  <td>
                    {u.verified ? (
                      <BadgeCheck size={20} style={{ color: "#3b82f6" }} />
                    ) : (
                      <span style={{ color: "#6b7280" }}>—</span>
                    )}
                  </td>
                  <td>
                    <select
                      className="filter-select"
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      disabled={u.id === me?.id}
                    >
                      <option value="user">کاربر</option>
                      <option value="moderator">ناظر</option>
                      <option value="owner">مالک</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        u.verified
                          ? "btn btn-outline btn-sm"
                          : "btn btn-primary btn-sm"
                      }
                      onClick={() => toggleVerified(u)}
                      disabled={u.id === me?.id}
                    >
                      <BadgeCheck size={14} />
                      {u.verified ? "حذف تیک" : "دادن تیک"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}