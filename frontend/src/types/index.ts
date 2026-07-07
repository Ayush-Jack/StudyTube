// ─────────────────────────────────────────────────────────────────
// TypeScript interfaces for StudyTube API integration
// Matches Spring Boot DTOs exactly
// ─────────────────────────────────────────────────────────────────

// ── User / Auth ──────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "USER" | "ADMIN";
  selectedDomains: string[];
  hasOnboarded: boolean;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ── Video ────────────────────────────────────────────────────────

export interface Video {
  id: string;
  youtubeVideoId: string;
  channelId: string;
  channelName: string;
  channelAvatar: string | null;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string | null;          // ISO 8601 e.g. "PT45M23S"
  viewCount: number;
  viewCountDisplay: string;         // e.g. "1.2M"
  domain: string;
  publishedAt: string;              // ISO instant
}

// ── Channel ──────────────────────────────────────────────────────

export interface Channel {
  id: string;
  youtubeChannelId: string;
  name: string;
  handle: string | null;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  domains: string[];
  approved: boolean;
  createdAt: string;
}

// ── Progress / History ───────────────────────────────────────────

export interface WatchHistory {
  id: string;
  videoId: string;
  youtubeVideoId: string;
  videoTitle: string;
  channelName: string;
  thumbnailUrl: string | null;
  domain: string;
  watchedAt: string;
  watchDurationSeconds: number;
  completionPercent: number;
  isCompleted: boolean;
}

export interface UserStats {
  totalVideosWatched: number;
  totalVideosCompleted: number;
  totalWatchTimeSeconds: number;
  totalWatchTimeFormatted: string;  // e.g. "5h 23m"
  domainsStudied: string[];
  mostWatchedDomain: string | null;
}

// ── API generic types ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  status?: number;
}

/** Spring Data Page<T> shape */
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;         // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ── Admin — Channel is the same shape ────────────────────────────

export type AdminChannel = Channel;

// ── Admin — Sync ─────────────────────────────────────────────────

export interface SyncLog {
  id: string;
  channelId: string;
  channelName: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  videosFound: number;
  videosAdded: number;
  videosSkipped: number;
  errorMessage: string | null;
  syncedAt: string;
  durationMs: number;
}

export interface SyncResultResponse {
  channelId: string;
  channelName: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  videosAdded: number;
  videosSkipped: number;
  errorMessage: string | null;
  syncedAt: string;
}
