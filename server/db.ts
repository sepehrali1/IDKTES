import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type UserRole = "user" | "moderator" | "owner";

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  verified: boolean;
  banned: boolean;
  created_at: string;
}

export interface Script {
  id: string;
  title: string;
  description: string;
  code: string;
  category: string;
  author_id: string;
  image_url: string | null;
  safety_confirmed?: boolean;
  likes_count: number;
  views_count: number;
  pending: boolean;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  script_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  script_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Report {
  id: string;
  target_type: "script" | "comment" | "user";
  target_id: string;
  reporter_id: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
}

export interface Warning {
  id: string;
  user_id: string;
  reason: string;
  issued_by: string;
  created_at: string;
}

export interface Database {
  users: User[];
  scripts: Script[];
  likes: Like[];
  comments: Comment[];
  reports: Report[];
  warnings: Warning[];
}

const DB_PATH = process.env.SSBLOX_DB_PATH
  ? path.resolve(process.env.SSBLOX_DB_PATH)
  : path.join(process.cwd(), "server", "data", "db.json");

let cache: Database | null = null;
let saveQueue: Promise<void> = Promise.resolve();

function emptyDatabase(): Database {
  return { users: [], scripts: [], likes: [], comments: [], reports: [], warnings: [] };
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
}

export const db = {
  async load(): Promise<Database> {
    if (cache) return cache;
    await ensureDir();
    try {
      const raw = await fs.readFile(DB_PATH, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Database file has an invalid root structure; refusing to overwrite it.");
      }
      const record = parsed as Partial<Database>;
      const collections: (keyof Database)[] = ["users", "scripts", "likes", "comments", "reports", "warnings"];
      for (const key of collections) {
        if (record[key] !== undefined && !Array.isArray(record[key])) {
          throw new Error(`Database collection '${key}' is invalid; refusing to overwrite the file.`);
        }
      }
      cache = {
        users: record.users ?? [],
        scripts: record.scripts ?? [],
        likes: record.likes ?? [],
        comments: record.comments ?? [],
        reports: record.reports ?? [],
        warnings: record.warnings ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      cache = emptyDatabase();
      await db.save();
    }
    return cache;
  },

  async save(): Promise<void> {
    if (!cache) return;
    const snapshot = JSON.stringify(cache, null, 2);
    const operation = saveQueue.then(async () => {
      await ensureDir();
      const temporaryPath = `${DB_PATH}.${process.pid}.${randomUUID()}.tmp`;
      await fs.writeFile(temporaryPath, snapshot, { encoding: "utf-8", mode: 0o600 });
      await fs.rename(temporaryPath, DB_PATH);
    });
    saveQueue = operation.catch(() => undefined);
    await operation;
  },
};
