export interface Category {
  id: string;
  name: string;
  description: string;
  icon: "layout" | "gamepad-2" | "database" | "wrench" | "clapperboard" | "wand-sparkles" | "network" | "book-open";
  gradient: string;
}

export interface StatsData {
  users: number;
  scripts: number;
  views: number;
  likes: number;
  by_category: Record<string, number>;
}