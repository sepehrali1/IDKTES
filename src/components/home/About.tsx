import { Sparkles, Code2, Heart } from "lucide-react";

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container about-inner">
        <div className="about-content">
          <span className="about-badge">
            <Sparkles size={14} />
            داستان SSBLOX
          </span>

          <h2 className="section-title">درباره ما</h2>

          <p className="about-text">
            SSBLOX یک کتابخانه‌ی فارسی برای یادگیری و اشتراک‌گذاری نمونه‌کدهای
            Luau مخصوص Roblox Studio است. هدف ما ساختن فضایی امن و کاربردی برای
            سازندگانی است که بازی‌های خودشان را توسعه می‌دهند.
          </p>

          <p className="about-text">
            هر نمونه‌کد قبل از انتشار عمومی در صف بررسی قرار می‌گیرد و اعضای
            جامعه می‌توانند محتوای نامناسب را گزارش کنند. یادگیری و ساختن باید
            برای همه امن بماند.
          </p>

          <div className="about-author">
            <div className="about-author-avatar">S</div>
            <div>
              <div className="about-author-name">Sskid (سپهر)</div>
              <div className="about-author-role">
                بنیان‌گذار SSBLOX
              </div>
            </div>
          </div>
        </div>

        <div className="about-visual">
          <div className="about-card">
            <div className="about-card-icon">
              <Code2 size={28} />
            </div>
            <h3>پروژه‌ای مستقل</h3>
            <p>
              ساخته‌شده با تمرکز بر سادگی، امنیت و یادگیری توسعه‌ی بازی.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-icon">
              <Heart size={28} />
            </div>
            <h3>برای توسعه‌دهندگان Roblox</h3>
            <p>
              هدف SSBLOX این است که سازندگان به نمونه‌کدهای روشن و قابل‌بررسی دسترسی داشته باشند.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}