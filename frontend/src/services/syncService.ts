// ─────────────────────────────────────────────────────────────────
// Sync service — admin sync operations
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import type { ApiResponse, PageResponse, SyncLog, SyncResultResponse } from "@/types";

/** Trigger sync for ALL approved channels (can take 10-20s) */
export async function triggerFullSync(): Promise<SyncResultResponse[]> {
  const res = await api.post<ApiResponse<SyncResultResponse[]>>(
    "/admin/sync/trigger",
    null,
    { timeout: 120000 } // 2-min timeout for bulk sync
  );
  return res.data.data;
}

/** Trigger sync for a single channel */
export async function triggerChannelSync(
  channelId: string
): Promise<SyncResultResponse> {
  const res = await api.post<ApiResponse<SyncResultResponse>>(
    `/admin/sync/channel/${channelId}`,
    null,
    { timeout: 60000 }
  );
  return res.data.data;
}

/** Fetch paginated sync logs */
export async function getSyncLogs(
  page = 0,
  size = 20
): Promise<PageResponse<SyncLog>> {
  const res = await api.get<ApiResponse<PageResponse<SyncLog>>>(
    "/admin/sync/logs",
    { params: { page, size } }
  );
  return res.data.data;
}
