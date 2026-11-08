import { BookOpen, Code2, Flag, LockKeyhole, ShieldCheck } from "lucide-react";

const RULES = [
  {
    icon: Code2,
    title: "محتوای قابل انتشار",
    body: "نمونه‌کدهای آموزشی Luau برای بازی‌هایی که خودت در Roblox Studio می‌سازی؛ همراه با توضیح روشن، دسته‌بندی درست و اطلاعات کافی برای بررسی.",
  },
  {
    icon: ShieldCheck,
    title: "محتوای ممنوع",
    body: "اکسپلویت، تقلب در بازی دیگران، دورزدن آنتی‌چیت یا محدودیت‌های پلتفرم، سرقت حساب و اطلاعات، کد مخرب و هر محتوایی که به دیگران آسیب بزند منتشر نکن.",
  },
  {
    icon: Flag,
    title: "گزارش و نظارت",
    body: "هر کاربر می‌تواند محتوای مشکوک را گزارش کند. انتشار کاربران عادی تا زمان بررسی ناظر در صف تأیید می‌ماند.",
  },
  {
    icon: LockKeyhole,
    title: "حریم خصوصی و امنیت",
    body: "رمز عبور یا کلیدهای خصوصی را داخل کد، توضیحات، تصویر یا کامنت قرار نده. کدهای ناشناس را قبل از استفاده خط‌به‌خط بررسی کن.",
  },
];

export default function Rules() {
  return (
    <div className="rules-page">
      <div className="container">
        <header className="rules-heading">
          <span className="eyebrow"><BookOpen size={15} /> راهنمای جامعه</span>
          <h1>قوانین و استانداردهای <span className="gradient-text">SSBLOX</span></h1>
          <p>هدف اینجا یادگیری و ساخت بازی بهتر در Roblox Studio است. این قوانین برای امن ماندن جامعه و محتوای منتشرشده‌اند.</p>
        </header>
        <div className="rules-grid">
          {RULES.map(({ icon: Icon, title, body }, index) => (
            <article className="rules-card" key={title}>
              <span className="rules-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="rules-icon"><Icon size={22} /></div>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="rules-footnote">با انتشار محتوا یا استفاده از امکانات سایت، موافقت می‌کنی که این استانداردها را رعایت کنی.</p>
      </div>
    </div>
  );
}
