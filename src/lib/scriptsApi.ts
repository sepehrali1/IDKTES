import { apiRequest } from "./api";
import type {
  ScriptListResponse,
  ScriptResponse,
  MineScriptsResponse,
  CommentsResponse,
  CommentResponse,
} from "../types/script";

export async function fetchScripts(params: {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<ScriptListResponse> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category) q.set("category", params.category);
  if (params.sort) q.set("sort", params.sort);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  return apiRequest<ScriptListResponse>("/api/scripts?" + q.toString());
}

export async function fetchScript(id: string): Promise<ScriptResponse> {
  return apiRequest<ScriptResponse>("/api/scripts/" + id);
}

export async function fetchMyScripts(): Promise<MineScriptsResponse> {
  return apiRequest<MineScriptsResponse>("/api/scripts/mine");
}

export async function createScript(payload: {
  title: string;
  description: string;
  code: string;
  category: string;
  image_url: string | null;
  safety_confirmed: boolean;
}): Promise<ScriptResponse> {
  return apiRequest<ScriptResponse>("/api/scripts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteScript(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/api/scripts/" + id, { method: "DELETE" });
}

export async function toggleLike(
  id: string
): Promise<{ liked: boolean; likes_count: number }> {
  return apiRequest<{ liked: boolean; likes_count: number }>(
    "/api/scripts/" + id + "/like",
    { method: "POST" }
  );
}

export async function fetchComments(id: string): Promise<CommentsResponse> {
  return apiRequest<CommentsResponse>("/api/scripts/" + id + "/comments");
}

export async function postComment(
  id: string,
  content: string
): Promise<CommentResponse> {
  return apiRequest<CommentResponse>("/api/scripts/" + id + "/comments", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(
  commentId: string
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/api/comments/" + commentId, {
    method: "DELETE",
  });
}

import type { StatsData } from "../types";

export async function fetchStats(): Promise<StatsData> {
  return apiRequest<StatsData>("/api/stats");
}
export async function reportScript(id: string, reason: string): Promise<{ ok: true; id: string }> {
  return apiRequest<{ ok: true; id: string }>("/api/reports", {
    method: "POST",
    body: JSON.stringify({ target_type: "script", target_id: id, reason }),
  });
}
