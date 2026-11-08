import type { Category } from "../types";

// دسته‌های مخصوص توسعه‌ی قانونی بازی در Roblox Studio
export const categories: Category[] = [
  { id: "ui", name: "رابط کاربری", description: "منوها، پنل‌ها و تجربه کاربری", icon: "layout", gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
  { id: "gameplay", name: "مکانیک‌های بازی", description: "سیستم‌های اصلی گیم‌پلی در بازی خودت", icon: "gamepad-2", gradient: "linear-gradient(135deg, #10b981, #059669)" },
  { id: "data", name: "داده و ذخیره‌سازی", description: "داده‌ها، امتیازها و ذخیره‌سازی امن", icon: "database", gradient: "linear-gradient(135deg, #06b6d4, #0891b2)" },
  { id: "tools", name: "ابزارهای توسعه", description: "ابزارهای کمکی برای Roblox Studio", icon: "wrench", gradient: "linear-gradient(135deg, #64748b, #475569)" },
  { id: "animation", name: "انیمیشن", description: "انیمیشن کاراکترها و اشیا", icon: "clapperboard", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { id: "effects", name: "افکت‌ها", description: "صدا، ذرات و جلوه‌های بصری", icon: "wand-sparkles", gradient: "linear-gradient(135deg, #a855f7, #7c3aed)" },
  { id: "network", name: "رویداد و ارتباطات", description: "RemoteEvent و ارتباط سرور و کلاینت در بازی خودت", icon: "network", gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)" },
  { id: "learning", name: "نمونه‌های آموزشی", description: "کدهای ساده برای یادگیری Luau", icon: "book-open", gradient: "linear-gradient(135deg, #14b8a6, #0d9488)" },
];

export function getCategoryName(id: string): string {
  return categories.find((category) => category.id === id)?.name ?? "دسته‌بندی دیگر";
}
