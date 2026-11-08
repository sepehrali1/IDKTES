import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function CallToAction() {
  const { user } = useAuth();
  return (
    <section className="section-sm">
      <div className="container">
        <div className="cta">
          <div className="cta-glow" />
          <div className="cta-content">
            <span className="cta-badge">
              <Sparkles size={14} />
              کاملاً رایگان
            </span>
            <h2>همین حالا به SSBLOX بپیوند</h2>
            <p>
              نمونه‌کدهای آموزشی را مرور کن، تجربه‌ات را به اشتراک بگذار و برای ساخت بازی خودت یاد بگیر.
            </p>
            <div className="cta-actions">
              <Link to={user ? "/scripts/new" : "/register"} className="btn btn-primary btn-lg">
                {user ? "انتشار نمونه‌کد" : "ساخت حساب رایگان"}
                <ArrowLeft size={18} />
              </Link>
              <Link to="/scripts" className="btn btn-outline btn-lg">
                مرور اسکریپت‌ها
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}