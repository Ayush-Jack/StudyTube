// ─────────────────────────────────────────────────────────────────
// Auth service — register, login, logout, refresh, getCurrentUser
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import { saveTokens, getRefreshToken, clearTokens } from "@/lib/auth";
import type { ApiResponse, AuthResponse, User } from "@/types";

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>("/auth/register", {
    name,
    email,
    password,
  });
  const data = res.data.data;
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", {
    email,
    password,
  });
  const data = res.data.data;
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>("/auth/google", {
    idToken,
  });
  const data = res.data.data;
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refreshToken(): Promise<AuthResponse> {
  const token = getRefreshToken();
  if (!token) throw new Error("No refresh token available");

  const res = await api.post<ApiResponse<AuthResponse>>("/auth/refresh", {
    refreshToken: token,
  });
  const data = res.data.data;
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const token = getRefreshToken();
  if (token) {
    try {
      await api.post("/auth/logout", { refreshToken: token });
    } catch {
      // Ignore — we clear tokens regardless
    }
  }
  clearTokens();
}

export async function getCurrentUser(): Promise<User> {
  const res = await api.get<ApiResponse<User>>("/auth/me");
  return res.data.data;
}
