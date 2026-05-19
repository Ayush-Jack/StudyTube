"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, CheckCircle } from "lucide-react";
import { Suspense, useState, useEffect, useCallback } from "react";
import * as videoService from "@/services/videoService";
import type { Video } from "@/types";
import { formatTimeAgo, formatDuration } from "@/lib/utils";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setIsLoading(true);
      try {
        const res = await videoService.getFeed(0, 20);
        setResults(res.content);
        setTotalResults(res.totalElements);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      const res = await videoService.searchVideos(q, 0, 20);
      setResults(res.content);
      setTotalResults(res.totalElements);
    } catch {
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(query);
  }, [query, fetchResults]);

  return (
    <div className="flex-1">
      <div className="px-6 py-6 max-w-[1200px]">
        {/* Filter row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button className="chip flex items-center gap-2">
            <SlidersHorizontal size={14} /> Filters
          </button>
          {["All", "Channels", "Sort: Latest", "Duration", "Features"].map((chip, i) => (
            <button key={chip} className={cn("chip", i === 0 && "active")}>
              {chip}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mb-4">
          {isLoading
            ? "Searching..."
            : totalResults > 0
              ? `${totalResults} results for "${query}"`
              : `No results for "${query}"`}
        </p>

        {/* Results list */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse p-2">
                <div className="w-[246px] h-[138px] shrink-0 rounded-xl bg-white/[0.04] light:bg-black/[0.04]" />
                <div className="flex-1 py-1">
                  <div className="h-5 rounded mb-3 w-3/4 bg-white/[0.04] light:bg-black/[0.04]" />
                  <div className="h-3 rounded mb-2 w-1/2 bg-white/[0.04] light:bg-black/[0.04]" />
                  <div className="h-3 rounded w-full bg-white/[0.04] light:bg-black/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-4">
            {results.map((video) => (
              <SearchResultItem key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-24 text-center">
            <Search size={48} className="mb-4 text-[#4a4f66] light:text-[#7a86a8]" />
            <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">No results found</h2>
            <p className="text-[#8b90a7] light:text-[#3d4a6b]">Try different keywords or browse by category</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultItem({ video }: { video: Video }) {
  const displayDuration = video.duration ? formatDuration(video.duration) : "";
  const displayTime = video.publishedAt ? formatTimeAgo(video.publishedAt) : "";
  const displayViews = video.viewCountDisplay || `${video.viewCount}`;

  return (
    <Link href={`/watch?v=${video.youtubeVideoId}`}
      className="
        flex gap-4 group cursor-pointer rounded-xl p-2 transition-all
        border border-transparent
        hover:bg-white/[0.04] light:hover:bg-white/50
        hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.50)]
      "
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-[246px] h-[138px] overflow-hidden rounded-xl bg-[#1a1a24] light:bg-[#dde1ef]">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <span className="
          absolute bottom-2 right-2 text-white text-xs font-medium px-1.5 py-0.5
          rounded-md bg-black/65 backdrop-blur-md border border-white/10
        ">
          {displayDuration}
        </span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] line-clamp-2 leading-snug mb-2">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full overflow-hidden">
            <img
              src={video.channelAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.channelName)}&backgroundColor=3b82f6`}
              alt={video.channelName}
              className="w-full h-full"
            />
          </div>
          <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">{video.channelName}</span>
          <CheckCircle size={13} className="text-[#4a4f66] light:text-[#7a86a8]" />
          <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">• {displayViews} views • {displayTime}</span>
        </div>
        <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] line-clamp-2 leading-relaxed">{video.description}</p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#8b90a7] light:text-[#3d4a6b]">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
