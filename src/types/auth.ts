export type UserRole = "user" | "moderator" | "owner";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  verified: boolean;
  banned: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}