"use client";
import { CategoryBar } from "@/components/layout/CategoryBar";
import VideoCard from "@/components/video/VideoCard";
import { useCategoryStore } from "@/store";
import { useState, useEffect, useCallback } from "react";
import * as videoService from "@/services/videoService";
import type { Video } from "@/types";

export default function HomePage() {
  const { activeCategory } = useCategoryStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchVideos = useCallback(async (pageNum: number, category: string, append = false) => {
    try {
      if (pageNum === 0) setIsLoading(true);
      else setLoadingMore(true);
      setError("");

      let result;
      if (category === "All") {
        result = await videoService.getFeed(pageNum, 20);
      } else {
        result = await videoService.getVideosByDomain(category, pageNum, 20);
      }

      if (append) {
        setVideos((prev) => [...prev, ...result.content]);
      } else {
        setVideos(result.content);
      }
      setHasMore(!result.last);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load videos";
      setError(msg);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch on mount and when category changes
  useEffect(() => {
    setPage(0);
    fetchVideos(0, activeCategory);
  }, [activeCategory, fetchVideos]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage, activeCategory, true);
  };

  return (
    <div className="flex-1">
      {/* YouTube-style sticky category bar */}
      <CategoryBar />

      {/* Video grid */}
      <div className="px-2 py-6">
        {isLoading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video mb-3 rounded-xl bg-white/[0.04] light:bg-black/[0.04]" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full shrink-0 bg-white/[0.04] light:bg-black/[0.04]" />
                  <div className="flex-1">
                    <div className="h-4 rounded mb-2 w-full bg-white/[0.04] light:bg-black/[0.04]" />
                    <div className="h-3 rounded w-2/3 bg-white/[0.04] light:bg-black/[0.04]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">⚠️</span>
            <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">
              Something went wrong
            </h2>
            <p className="text-[#8b90a7] light:text-[#3d4a6b] mb-4">{error}</p>
            <button
              onClick={() => fetchVideos(0, activeCategory)}
              className="chip active"
            >
              Try Again
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">📚</span>
            <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">
              No videos in this category yet
            </h2>
            <p className="text-[#8b90a7] light:text-[#3d4a6b]">
              We&apos;re working on adding more {activeCategory} content.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {videos.map((video, i) => (
                <VideoCard key={video.id} video={video} index={i} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className={`chip ${loadingMore ? 'opacity-60' : ''}`}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
