"use client";
import { cn } from "@/lib/utils";
import { Video, CheckCircle, Clock, BookOpen, BarChart2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import * as progressService from "@/services/progressService";
import type { UserStats, WatchHistory } from "@/types";

export default function ProgressPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<WatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [statsData, historyData] = await Promise.all([
          progressService.getStats(),
          progressService.getWatchHistory(0, 10),
        ]);
        setStats(statsData);
        setHistory(historyData.content);
      } catch {
        // Silent fail — show empty state
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const STATS_DISPLAY = [
    { icon: Video, label: "Videos Watched", value: stats?.totalVideosWatched ?? 0, sub: "", color: "#3b82f6" },
    { icon: CheckCircle, label: "Completed", value: stats?.totalVideosCompleted ?? 0, sub: stats ? `${stats.totalVideosWatched > 0 ? Math.round((stats.totalVideosCompleted / stats.totalVideosWatched) * 100) : 0}% completion rate` : "", color: "#34d399" },
    { icon: Clock, label: "Watch Time", value: stats?.totalWatchTimeFormatted ?? "0m", sub: "", color: "#fbbf24" },
    { icon: BookOpen, label: "Active Domains", value: stats?.domainsStudied?.length ?? 0, sub: stats?.domainsStudied?.slice(0, 3).join(", ") ?? "", color: "#a78bfa" },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 px-6 py-6">
        <div className="max-w-[1200px]">
          <div className="h-8 rounded w-64 mb-8 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                <div className="h-4 rounded w-20 mb-3 bg-white/[0.06] light:bg-black/[0.06]" />
                <div className="h-8 rounded w-16 mb-2 bg-white/[0.06] light:bg-black/[0.06]" />
                <div className="h-3 rounded w-24 bg-white/[0.06] light:bg-black/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 py-6">
      <div className="max-w-[1200px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-brand-600/12 light:bg-brand-600/10 border border-brand-500/25">
            <BarChart2 size={24} className="text-brand-400 light:text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[#e8eaf2] light:text-[#0f1523]">My Learning Progress</h1>
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">Welcome back, {user?.name?.split(" ")[0] ?? "Student"}!</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS_DISPLAY.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">{label}</span>
              </div>
              <p className="text-3xl font-bold text-[#e8eaf2] light:text-[#0f1523] font-display">{value}</p>
              {sub && (
                <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mt-1">{sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Domain Progress */}
        {stats && stats.domainsStudied.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-5">Domains Studied</h2>
            <div className="flex flex-wrap gap-2">
              {stats.domainsStudied.map((domain) => (
                <span key={domain} className={cn("chip", domain === stats.mostWatchedDomain && "active")}>
                  {domain} {domain === stats.mostWatchedDomain && "⭐"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recently Watched */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-4">Recently Watched</h2>
          {history.length > 0 ? (
            <div className="flex flex-col gap-2">
              {history.map((item) => (
                <a key={item.id} href={`/watch?v=${item.youtubeVideoId}`}
                  className="
                    flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer
                    border border-transparent
                    hover:bg-white/[0.04] light:hover:bg-brand-600/[0.06]
                    hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.40)]
                  "
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8eaf2] light:text-[#0f1523] line-clamp-1">{item.videoTitle}</p>
                    <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">{item.channelName} • {item.domain}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.isCompleted && (
                      <CheckCircle size={14} className="text-emerald-400 light:text-emerald-600" />
                    )}
                    <span className="text-xs text-[#4a4f66] light:text-[#7a86a8]">{item.completionPercent}%</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] py-4 text-center">No watch history yet. Start watching to track your progress!</p>
          )}
        </div>
      </div>
    </div>
  );
}
