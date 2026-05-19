// ─────────────────────────────────────────────────────────────────
// Progress service — watch tracking and learning stats
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import type { ApiResponse, PageResponse, WatchHistory, UserStats } from "@/types";

export async function recordWatch(
  videoId: string,
  watchDurationSeconds: number,
  completionPercent: number
): Promise<WatchHistory> {
  const res = await api.post<ApiResponse<WatchHistory>>("/progress/watch", {
    videoId,
    watchDurationSeconds,
    completionPercent,
  });
  return res.data.data;
}

export async function getWatchHistory(
  page: number = 0,
  size: number = 10
): Promise<PageResponse<WatchHistory>> {
  const res = await api.get<ApiResponse<PageResponse<WatchHistory>>>(
    "/progress/history",
    { params: { page, size } }
  );
  return res.data.data;
}

export async function getVideoProgress(
  videoId: string
): Promise<WatchHistory | null> {
  const res = await api.get<ApiResponse<WatchHistory | null>>(
    `/progress/video/${videoId}`
  );
  return res.data.data;
}

export async function getStats(): Promise<UserStats> {
  const res = await api.get<ApiResponse<UserStats>>("/progress/stats");
  return res.data.data;
}
