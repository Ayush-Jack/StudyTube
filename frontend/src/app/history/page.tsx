"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Clock, Trash2, Search, X, PlayCircle, CheckCircle2,
  Loader2, AlertTriangle, History as HistoryIcon, BadgeCheck,
} from "lucide-react";
import * as progressService from "@/services/progressService";
import type { WatchHistory, PageResponse } from "@/types";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatWatchDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Group history entries by date category */
function groupByDate(entries: WatchHistory[]): { label: string; items: WatchHistory[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const groups: Record<string, WatchHistory[]> = {};
  const order: string[] = [];

  for (const entry of entries) {
    const d = new Date(entry.watchedAt);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() >= today.getTime()) label = "Today";
    else if (d.getTime() >= yesterday.getTime()) label = "Yesterday";
    else if (d.getTime() >= weekAgo.getTime()) label = "This week";
    else if (d.getTime() >= monthAgo.getTime()) label = "This month";
    else label = "Older";

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(entry);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}

// ── Main Component ───────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  // ── Fetch history ────────────────────────────────────────────
  const fetchHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const data: PageResponse<WatchHistory> = await progressService.getWatchHistory(pageNum, PAGE_SIZE);

      if (append) {
        setEntries((prev) => [...prev, ...data.content]);
      } else {
        setEntries(data.content);
      }
      setHasMore(!data.last);
      setPage(pageNum);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load history";
      if (message.includes("401") || message.includes("Unauthorized")) {
        setError("login");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchHistory(0); }, [fetchHistory]);

  // ── Load more ────────────────────────────────────────────────
  const loadMore = () => {
    if (!loadingMore && hasMore) fetchHistory(page + 1, true);
  };

  // ── Remove single entry ──────────────────────────────────────
  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await progressService.deleteHistoryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silently fail
    } finally {
      setRemovingId(null);
    }
  };

  // ── Clear all ────────────────────────────────────────────────
  const handleClearAll = async () => {
    setClearing(true);
    try {
      await progressService.clearAllHistory();
      setEntries([]);
      setShowClearConfirm(false);
    } catch {
      // silently fail
    } finally {
      setClearing(false);
    }
  };

  // ── Filter by search ────────────────────────────────────────
  const filtered = search.trim()
    ? entries.filter(
        (e) =>
          e.videoTitle.toLowerCase().includes(search.toLowerCase()) ||
          e.channelName.toLowerCase().includes(search.toLowerCase()) ||
          (e.domain && e.domain.toLowerCase().includes(search.toLowerCase()))
      )
    : entries;

  const grouped = groupByDate(filtered);

  // ── Login prompt ─────────────────────────────────────────────
  if (error === "login") {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-10 max-w-md mx-auto">
          <HistoryIcon size={48} className="mx-auto mb-4 text-brand-400" />
          <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">
            Sign in to view your history
          </h2>
          <p className="text-[#8b90a7] light:text-[#3d4a6b] mb-6 text-sm">
            Your watch history is saved to your account.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-[1100px] mx-auto px-6 py-6 pb-16">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <HistoryIcon size={20} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#e8eaf2] light:text-[#0f1523]">
                Watch History
              </h1>
              {entries.length > 0 && (
                <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mt-0.5">
                  {entries.length} video{entries.length !== 1 ? "s" : ""} watched
                </p>
              )}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4f66] light:text-[#7a86a8]" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    pl-9 pr-8 py-2 rounded-xl text-sm w-[240px]
                    bg-[#0e0e12] light:bg-[#f0f2f8]
                    border border-white/[0.07] light:border-[rgba(200,210,235,0.40)]
                    text-[#e8eaf2] light:text-[#0f1523]
                    placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]
                    focus:outline-none focus:border-brand-500/50
                    transition-colors
                  "
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a4f66] hover:text-[#8b90a7] transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Clear all */}
              <button
                onClick={() => setShowClearConfirm(true)}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  bg-red-500/10 border border-red-500/20
                  text-red-400 hover:bg-red-500/20 hover:border-red-500/30
                  transition-all
                "
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Clear all confirmation ────────────────────────────── */}
        {showClearConfirm && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 border border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-400 shrink-0" />
              <p className="text-sm text-[#e8eaf2] light:text-[#0f1523]">
                This will permanently delete your entire watch history. Are you sure?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-1.5 rounded-lg text-sm text-[#8b90a7] hover:text-[#e8eaf2] light:hover:text-[#0f1523] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {clearing ? <Loader2 size={14} className="animate-spin" /> : "Yes, clear all"}
              </button>
            </div>
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-brand-400" />
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">Loading history...</p>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────── */}
        {!loading && error && error !== "login" && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertTriangle size={32} className="text-red-400" />
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">{error}</p>
            <button
              onClick={() => fetchHistory(0)}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────── */}
        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <HistoryIcon size={36} className="text-brand-400/60" />
            </div>
            <h2 className="text-lg font-semibold text-[#e8eaf2] light:text-[#0f1523]">
              No watch history yet
            </h2>
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] max-w-sm text-center">
              Videos you watch will appear here. Start exploring to build your learning history!
            </p>
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              <PlayCircle size={16} />
              Explore Videos
            </Link>
          </div>
        )}

        {/* ── No search results ────────────────────────────────── */}
        {!loading && !error && entries.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search size={32} className="text-[#4a4f66]" />
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">
              No results for &quot;{search}&quot;
            </p>
          </div>
        )}

        {/* ── History list (grouped by date) ────────────────────── */}
        {!loading && !error && grouped.map((group) => (
          <div key={group.label} className="mb-8">
            {/* Date header */}
            <h3 className="text-sm font-semibold text-[#8b90a7] light:text-[#3d4a6b] mb-3 flex items-center gap-2">
              <Clock size={14} />
              {group.label}
            </h3>

            <div className="space-y-1">
              {group.items.map((entry) => {
                const thumb =
                  entry.thumbnailUrl ||
                  `https://i.ytimg.com/vi/${entry.youtubeVideoId}/mqdefault.jpg`;
                const isRemoving = removingId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "group flex items-start gap-4 rounded-xl p-3 transition-all",
                      "hover:bg-white/[0.04] light:hover:bg-white/50",
                      "border border-transparent hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.50)]",
                      isRemoving && "opacity-40 pointer-events-none"
                    )}
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/watch?v=${entry.youtubeVideoId}`}
                      className="relative shrink-0 rounded-xl overflow-hidden w-[200px] h-[112px] bg-[#1a1a24] light:bg-[#dde1ef]"
                    >
                      <img
                        src={thumb}
                        alt={entry.videoTitle}
                        className="w-full h-full object-cover"
                      />
                      {/* Progress bar */}
                      {entry.completionPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                          <div
                            className="h-full bg-red-500 transition-all"
                            style={{ width: `${Math.min(entry.completionPercent, 100)}%` }}
                          />
                        </div>
                      )}
                      {/* Completion badge */}
                      {entry.isCompleted && (
                        <div className="absolute top-1.5 right-1.5 bg-green-500/90 rounded-full p-0.5">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                      {/* Watch duration */}
                      {entry.watchDurationSeconds > 0 && (
                        <span className="absolute bottom-1.5 right-1.5 text-white font-medium rounded px-1.5 py-0.5 text-[11px] leading-4 bg-black/80">
                          {formatWatchDuration(entry.watchDurationSeconds)}
                        </span>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-0.5">
                      <Link href={`/watch?v=${entry.youtubeVideoId}`}>
                        <h4 className="text-sm font-medium text-[#e8eaf2] light:text-[#0f1523] leading-snug line-clamp-2 hover:text-brand-400 transition-colors cursor-pointer">
                          {entry.videoTitle}
                        </h4>
                      </Link>

                      <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mt-1.5 flex items-center gap-1">
                        {entry.channelName}
                        <BadgeCheck size={12} className="text-[#4a4f66] light:text-[#7a86a8] shrink-0" />
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#4a4f66] light:text-[#7a86a8]">
                        <span>{formatTimeAgo(entry.watchedAt)}</span>
                        {entry.domain && (
                          <>
                            <span>·</span>
                            <span className="chip">{entry.domain}</span>
                          </>
                        )}
                        {entry.completionPercent > 0 && (
                          <>
                            <span>·</span>
                            <span className={cn(
                              entry.isCompleted ? "text-green-400" : "text-brand-400"
                            )}>
                              {entry.completionPercent}% watched
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(entry.id)}
                      disabled={isRemoving}
                      className="
                        shrink-0 mt-1 p-2 rounded-lg
                        opacity-0 group-hover:opacity-100
                        text-[#4a4f66] hover:text-red-400
                        hover:bg-red-500/10
                        transition-all duration-200
                      "
                      title="Remove from history"
                    >
                      {isRemoving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Load more ─────────────────────────────────────────── */}
        {!loading && !error && hasMore && filtered.length > 0 && !search && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium
                bg-white/[0.05] light:bg-white/50
                border border-white/[0.08] light:border-[rgba(200,210,235,0.40)]
                text-[#e8eaf2] light:text-[#0f1523]
                hover:bg-white/[0.09] light:hover:bg-white/70
                transition-all disabled:opacity-50
              "
            >
              {loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
