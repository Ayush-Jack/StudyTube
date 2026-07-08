// ─────────────────────────────────────────────────────────────────
// Sync service — admin sync operations (async + legacy)
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import type {
  ApiResponse,
  PageResponse,
  SyncLog,
  SyncResultResponse,
  SyncJobResponse,
} from "@/types";

// ════════════════════════════════════════════════════════════════
//  ASYNC SYNC (recommended — non-blocking)
// ════════════════════════════════════════════════════════════════

/** Start a background sync job. Returns jobId immediately. */
export async function startSync(): Promise<string> {
  const res = await api.post<ApiResponse<{ jobId: string }>>(
    "/admin/sync/start"
  );
  return res.data.data.jobId;
}

/** Poll the progress of a sync job. */
export async function getSyncJobStatus(
  jobId: string
): Promise<SyncJobResponse> {
  const res = await api.get<ApiResponse<SyncJobResponse>>(
    `/admin/sync/status/${jobId}`
  );
  return res.data.data;
}

/** Get paginated history of all sync jobs. */
export async function getSyncJobHistory(
  page = 0,
  size = 10
): Promise<PageResponse<SyncJobResponse>> {
  const res = await api.get<ApiResponse<PageResponse<SyncJobResponse>>>(
    "/admin/sync/jobs",
    { params: { page, size } }
  );
  return res.data.data;
}

// ════════════════════════════════════════════════════════════════
//  LEGACY SYNC (blocking — preserved for backward compatibility)
// ════════════════════════════════════════════════════════════════

/** Trigger sync for ALL approved channels (blocking — can take minutes) */
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

/** Fetch paginated sync logs (per-channel history) */
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
