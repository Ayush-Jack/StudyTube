// ─────────────────────────────────────────────────────────────────
// User service — profile and domain management
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import type { ApiResponse, User } from "@/types";

export async function getProfile(): Promise<User> {
  const res = await api.get<ApiResponse<User>>("/users/me");
  return res.data.data;
}

export async function updateProfile(
  name: string,
  avatar?: string
): Promise<User> {
  const res = await api.put<ApiResponse<User>>("/users/me", {
    name,
    avatar,
  });
  return res.data.data;
}

export async function updateDomains(domains: string[]): Promise<User> {
  const res = await api.put<ApiResponse<User>>("/users/me/domains", {
    selectedDomains: domains,
  });
  return res.data.data;
}

export async function getAvailableDomains(): Promise<string[]> {
  const res = await api.get<ApiResponse<string[]>>("/users/domains");
  return res.data.data;
}
