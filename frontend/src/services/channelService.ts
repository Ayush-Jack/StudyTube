// ─────────────────────────────────────────────────────────────────
// Channel service — public + admin CRUD
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import type { ApiResponse, Channel, AdminChannel } from "@/types";

// ── Public ───────────────────────────────────────────────────────

export async function getApprovedChannels(): Promise<Channel[]> {
  const res = await api.get<ApiResponse<Channel[]>>("/channels");
  return res.data.data;
}

export async function getChannelById(id: string): Promise<Channel> {
  const res = await api.get<ApiResponse<Channel>>(`/channels/${id}`);
  return res.data.data;
}

// ── Admin ────────────────────────────────────────────────────────

export async function getAllChannels(): Promise<AdminChannel[]> {
  const res = await api.get<ApiResponse<AdminChannel[]>>("/admin/channels");
  return res.data.data;
}

export async function addChannel(
  youtubeChannelId: string,
  name: string,
  domains: string[]
): Promise<AdminChannel> {
  const res = await api.post<ApiResponse<AdminChannel>>("/admin/channels", {
    youtubeChannelId,
    name,
    domains,
  });
  return res.data.data;
}

export async function deleteChannel(id: string): Promise<void> {
  await api.delete(`/admin/channels/${id}`);
}

export async function toggleChannel(id: string): Promise<AdminChannel> {
  const res = await api.patch<ApiResponse<AdminChannel>>(
    `/admin/channels/${id}/toggle`
  );
  return res.data.data;
}
