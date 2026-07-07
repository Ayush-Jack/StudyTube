"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  PlaySquare,
  Users,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as channelService from "@/services/channelService";
import * as videoService from "@/services/videoService";
import VideoCard from "@/components/video/VideoCard";
import type { Channel, Video } from "@/types";

const TABS = ["Videos", "About"];

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [channelError, setChannelError] = useState("");
  const [activeTab, setActiveTab] = useState("Videos");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);

  // Fetch channel details
  useEffect(() => {
    if (!channelId) return;
    setIsLoadingChannel(true);
    channelService
      .getChannelById(channelId)
      .then((ch) => {
        setChannel(ch);
        setChannelError("");
      })
      .catch(() => setChannelError("Channel not found"))
      .finally(() => setIsLoadingChannel(false));
  }, [channelId]);

  // Fetch channel videos
  const fetchVideos = useCallback(
    async (pageNum: number, append = false) => {
      if (!channelId) return;
      if (pageNum === 0) setIsLoadingVideos(true);
      else setLoadingMore(true);

      try {
        const res = await videoService.getVideosByChannel(channelId, pageNum, 20);
        if (append) {
          setVideos((prev) => [...prev, ...res.content]);
        } else {
          setVideos(res.content);
        }
        setTotalVideos(res.totalElements);
        setHasMore(!res.last);
      } catch {
        if (pageNum === 0) setVideos([]);
      } finally {
        setIsLoadingVideos(false);
        setLoadingMore(false);
      }
    },
    [channelId]
  );

  useEffect(() => {
    fetchVideos(0);
  }, [fetchVideos]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage, true);
  };

  // ── Loading skeleton ────────────────────────────────────────
  if (isLoadingChannel) {
    return (
      <div className="min-h-screen pt-14">
        <div className="max-w-[1200px] mx-auto">
          {/* Banner skeleton */}
          <div className="h-[200px] bg-white/[0.03] light:bg-black/[0.03] animate-pulse" />
          {/* Channel info skeleton */}
          <div className="px-6 py-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/[0.06] light:bg-black/[0.06] animate-pulse shrink-0 -mt-8" />
            <div className="flex-1">
              <div className="h-6 w-48 rounded bg-white/[0.06] light:bg-black/[0.06] mb-3 animate-pulse" />
              <div className="h-4 w-32 rounded bg-white/[0.04] light:bg-black/[0.04] animate-pulse" />
            </div>
          </div>
          {/* Video grid skeleton */}
          <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video mb-3 rounded-xl bg-white/[0.04] light:bg-black/[0.04]" />
                <div className="h-4 rounded mb-2 w-3/4 bg-white/[0.04] light:bg-black/[0.04]" />
                <div className="h-3 rounded w-1/2 bg-white/[0.04] light:bg-black/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (channelError || !channel) {
    return (
      <div className="min-h-screen pt-14 flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] light:bg-black/[0.04] flex items-center justify-center mb-5">
          <Users size={36} className="text-[#4a4f66] light:text-[#7a86a8]" />
        </div>
        <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">
          Channel not found
        </h2>
        <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mb-6">
          The channel you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
            bg-brand-600/20 light:bg-brand-600/10
            border border-brand-500/40 light:border-brand-500/35
            text-brand-400 light:text-brand-600
            hover:bg-brand-600/30 hover:shadow-glow-sm
            transition-all
          "
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  const avatarUrl =
    channel.thumbnailUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(channel.name)}&backgroundColor=3b82f6`;

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-[1200px] mx-auto">
        {/* ═══ Channel Banner ═══ */}
        <div className="relative h-[160px] sm:h-[200px] overflow-hidden
          bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-transparent
          light:from-brand-600/15 light:via-brand-500/8 light:to-transparent
        ">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Gradient overlay for smooth blend */}
          <div className="absolute bottom-0 left-0 right-0 h-24
            bg-gradient-to-t from-[#0e0e12] light:from-[#f0f2f8] to-transparent
          " />
        </div>

        {/* ═══ Channel Info ═══ */}
        <div className="relative px-6 -mt-12 mb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden shrink-0
              border-4 border-[#0e0e12] light:border-[#f0f2f8]
              shadow-[0_4px_24px_rgba(0,0,0,0.4)]
              light:shadow-[0_4px_24px_rgba(100,120,180,0.15)]
            ">
              <img
                src={avatarUrl}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold font-display text-[#e8eaf2] light:text-[#0f1523] truncate">
                  {channel.name}
                </h1>
                <CheckCircle size={20} className="text-brand-400 light:text-brand-600 shrink-0" />
              </div>
              <div className="flex items-center gap-3 flex-wrap text-sm text-[#8b90a7] light:text-[#3d4a6b]">
                {channel.handle && (
                  <span className="font-medium">{channel.handle}</span>
                )}
                <span>{channel.subscriberCount} subscribers</span>
                <span>•</span>
                <span>{totalVideos} videos</span>
              </div>
            </div>

            {/* YouTube link */}
            <a
              href={`https://youtube.com/channel/${channel.youtubeChannelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                bg-white/[0.05] light:bg-white/50
                border border-white/[0.08] light:border-[rgba(200,210,235,0.40)]
                text-[#8b90a7] light:text-[#3d4a6b]
                hover:bg-white/[0.09] light:hover:bg-white/70
                hover:text-[#e8eaf2] light:hover:text-[#0f1523]
                transition-all shrink-0
              "
            >
              <ExternalLink size={14} />
              View on YouTube
            </a>
          </div>

          {/* Domain tags */}
          {channel.domains.length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {channel.domains.map((domain) => (
                <Link
                  key={domain}
                  href={`/?category=${encodeURIComponent(domain)}`}
                  className="text-xs px-3 py-1 rounded-full
                    bg-brand-500/10 light:bg-brand-600/8
                    text-brand-400 light:text-brand-600
                    border border-brand-500/20 light:border-brand-500/15
                    hover:bg-brand-500/20 hover:border-brand-500/35
                    transition-all
                  "
                >
                  {domain}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Tab Bar ═══ */}
        <div className="px-6 flex gap-1 border-b border-white/[0.06] light:border-[rgba(200,210,235,0.30)] mt-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab
                  ? "text-[#e8eaf2] light:text-[#0f1523]"
                  : "text-[#8b90a7] light:text-[#3d4a6b] hover:text-[#e8eaf2] light:hover:text-[#0f1523]"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-brand-500 shadow-glow-sm" />
              )}
            </button>
          ))}
        </div>

        {/* ═══ Tab Content ═══ */}
        <div className="px-6 py-6">
          {activeTab === "Videos" && (
            <>
              {isLoadingVideos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {Array.from({ length: 8 }).map((_, i) => (
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
              ) : videos.length > 0 ? (
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
                        className="px-6 py-2.5 rounded-xl text-sm font-medium
                          bg-white/[0.05] light:bg-white/50
                          border border-white/[0.08] light:border-[rgba(200,210,235,0.40)]
                          text-[#8b90a7] light:text-[#3d4a6b]
                          hover:bg-white/[0.09] light:hover:bg-white/70
                          hover:text-[#e8eaf2] light:hover:text-[#0f1523]
                          transition-all disabled:opacity-50
                        "
                      >
                        {loadingMore ? "Loading..." : "Load more videos"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] light:bg-black/[0.04] flex items-center justify-center mb-4">
                    <PlaySquare size={28} className="text-[#4a4f66] light:text-[#7a86a8]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-1">
                    No videos yet
                  </h3>
                  <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">
                    This channel hasn&apos;t uploaded any videos available on StudyTube.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "About" && (
            <div className="max-w-[700px]">
              <div className="glass rounded-2xl p-6 mb-4">
                <h3 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-3">
                  Description
                </h3>
                <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] leading-relaxed whitespace-pre-line">
                  {channel.description || "No description available."}
                </p>
              </div>

              <div className="glass rounded-2xl p-6 mb-4">
                <h3 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-3">
                  Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[#4a4f66] light:text-[#7a86a8] w-28 shrink-0">Subscribers</span>
                    <span className="text-[#e8eaf2] light:text-[#0f1523]">{channel.subscriberCount}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#4a4f66] light:text-[#7a86a8] w-28 shrink-0">Videos</span>
                    <span className="text-[#e8eaf2] light:text-[#0f1523]">{totalVideos}</span>
                  </div>
                  {channel.handle && (
                    <div className="flex items-center gap-3">
                      <span className="text-[#4a4f66] light:text-[#7a86a8] w-28 shrink-0">Handle</span>
                      <span className="text-[#e8eaf2] light:text-[#0f1523]">{channel.handle}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[#4a4f66] light:text-[#7a86a8] w-28 shrink-0">Added on</span>
                    <span className="text-[#e8eaf2] light:text-[#0f1523]">
                      {new Date(channel.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-3">
                  Links
                </h3>
                <a
                  href={`https://youtube.com/channel/${channel.youtubeChannelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-400 light:text-brand-600 hover:underline"
                >
                  <ExternalLink size={14} />
                  YouTube Channel
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
