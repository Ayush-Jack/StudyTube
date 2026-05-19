// ─────────────────────────────────────────────────────────────────
// Video service — feed, search, detail, filter
// ─────────────────────────────────────────────────────────────────
import api from "@/lib/api";
import type { ApiResponse, PageResponse, Video } from "@/types";

export async function getFeed(
  page: number = 0,
  size: number = 20
): Promise<PageResponse<Video>> {
  const res = await api.get<ApiResponse<PageResponse<Video>>>("/videos/feed", {
    params: { page, size },
  });
  return res.data.data;
}

export async function getVideoById(id: string): Promise<Video> {
  const res = await api.get<ApiResponse<Video>>(`/videos/${id}`);
  return res.data.data;
}

export async function getVideoByYoutubeId(
  youtubeVideoId: string
): Promise<Video> {
  const res = await api.get<ApiResponse<Video>>(`/videos/yt/${youtubeVideoId}`);
  return res.data.data;
}

export async function searchVideos(
  query: string,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<Video>> {
  const res = await api.get<ApiResponse<PageResponse<Video>>>(
    "/videos/search",
    { params: { q: query, page, size } }
  );
  return res.data.data;
}

export async function getVideosByDomain(
  domain: string,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<Video>> {
  const res = await api.get<ApiResponse<PageResponse<Video>>>(
    `/videos/domain/${encodeURIComponent(domain)}`,
    { params: { page, size } }
  );
  return res.data.data;
}

export async function getVideosByChannel(
  channelId: string,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<Video>> {
  const res = await api.get<ApiResponse<PageResponse<Video>>>(
    `/videos/channel/${channelId}`,
    { params: { page, size } }
  );
  return res.data.data;
}
