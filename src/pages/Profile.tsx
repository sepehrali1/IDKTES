import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Shield, LogOut, Calendar, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toPersianDigits, formatNumber } from "../utils/format";
import { apiRequest } from "../lib/api";

const ROLE_LABELS: Record<string, string> = {
  user: "کاربر",
  moderator: "ناظر",
  owner: "مالک پلتفرم",
};

interface ProfileStats {
  scripts: number;
  likes: number;
  comments: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ scripts: 0, likes: 0, comments: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest<ProfileStats>("/api/stats/me")
      .then(setStats)
      .catch(() => setStats({ scripts: 0, likes: 0, comments: 0 }));
  }, []);

  if (!user) return null;

  const joinDate = new Date(user.created_at).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{user.username}</h1>
                {user.verified && (
                  <span className="profile-verified" title="حساب تأیید شده">
                    <BadgeCheck size={22} />
                  </span>
                )}
                {user.role !== "user" && (
                  <span className="profile-role-badge">
                    <Shield size={14} />
                    {ROLE_LABELS[user.role]}
                  </span>
                )}
              </div>
              <p className="profile-subtitle">
                عضو SSBLOX از {joinDate}
              </p>
            </div>
          </div>

          <div className="profile-body">
            <div className="profile-field">
              <Mail size={16} />
              <span dir="ltr">{user.email}</span>
            </div>

            <div className="profile-field">
              <Calendar size={16} />
              <span>
                عضو شده در {toPersianDigits(new Date(user.created_at).getFullYear())}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              خروج از حساب
            </button>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat-card">
            <div className="profile-stat-value">{formatNumber(stats.scripts)}</div>
            <div className="profile-stat-label">اسکریپت منتشرشده</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{formatNumber(stats.likes)}</div>
            <div className="profile-stat-label">لایک دریافتی</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{formatNumber(stats.comments)}</div>
            <div className="profile-stat-label">کامنت</div>
          </div>
        </div>
      </div>
    </div>
  );
}