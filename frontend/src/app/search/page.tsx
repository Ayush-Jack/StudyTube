"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Search, CheckCircle, Users, PlaySquare, X } from "lucide-react";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import * as videoService from "@/services/videoService";
import * as channelService from "@/services/channelService";
import type { Video, Channel } from "@/types";
import { formatTimeAgo, formatDuration } from "@/lib/utils";

type TabType = "all" | "videos" | "channels";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const tabParam = (searchParams.get("tab") as TabType) || "all";

  const [activeTab, setActiveTab] = useState<TabType>(tabParam);
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [totalVideoResults, setTotalVideoResults] = useState(0);
  const [videoPage, setVideoPage] = useState(0);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all channels once (they're a small list)
  useEffect(() => {
    channelService.getApprovedChannels().then(setChannels).catch(() => setChannels([]));
  }, []);

  // Filter channels client-side based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredChannels(channels);
      return;
    }
    const q = query.toLowerCase();
    setFilteredChannels(
      channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.handle && ch.handle.toLowerCase().includes(q)) ||
          ch.domains.some((d) => d.toLowerCase().includes(q))
      )
    );
  }, [query, channels]);

  // Fetch video results from backend
  const fetchVideos = useCallback(
    async (q: string, page: number) => {
      setIsLoadingVideos(true);
      try {
        let res;
        if (!q.trim()) {
          res = await videoService.getFeed(page, 20);
        } else {
          res = await videoService.searchVideos(q, page, 20);
        }
        if (page === 0) {
          setVideos(res.content);
        } else {
          setVideos((prev) => [...prev, ...res.content]);
        }
        setTotalVideoResults(res.totalElements);
        setHasMoreVideos(!res.last);
      } catch {
        if (page === 0) setVideos([]);
        setTotalVideoResults(0);
        setHasMoreVideos(false);
      } finally {
        setIsLoadingVideos(false);
      }
    },
    []
  );

  // Reset and fetch when query changes
  useEffect(() => {
    setVideoPage(0);
    fetchVideos(query, 0);
    setLocalQuery(query);
  }, [query, fetchVideos]);

  const loadMore = () => {
    const nextPage = videoPage + 1;
    setVideoPage(nextPage);
    fetchVideos(query, nextPage);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleLocalSearch = () => {
    if (localQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setLocalQuery("");
    router.push("/search");
    inputRef.current?.focus();
  };

  const totalChannelResults = filteredChannels.length;
  const isLoading = isLoadingVideos || isLoadingChannels;

  return (
    <div className="min-h-screen pt-14">
      <div className="max-w-[1000px] mx-auto px-6 py-6 pb-16">
        {/* Inline search bar for this page */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center h-11 rounded-xl overflow-hidden
            bg-white/[0.05] light:bg-white/55
            border border-white/[0.08] light:border-[rgba(200,210,235,0.60)]
            focus-within:border-brand-500/50 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]
            transition-all duration-200
          ">
            <Search size={18} className="ml-4 mr-2 text-[#4a4f66] light:text-[#7a86a8] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLocalSearch()}
              placeholder="Search videos and channels..."
              className="flex-1 h-full bg-transparent outline-none text-sm
                text-[#e8eaf2] light:text-[#0f1523]
                placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]
              "
            />
            {localQuery && (
              <button onClick={clearSearch} className="px-3 text-[#4a4f66] hover:text-[#8b90a7] transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleLocalSearch}
            className="h-11 px-5 rounded-xl text-sm font-medium
              bg-brand-600/20 light:bg-brand-600/10
              border border-brand-500/40 light:border-brand-500/35
              text-brand-400 light:text-brand-600
              hover:bg-brand-600/30 hover:shadow-glow-sm
              transition-all duration-200
            "
          >
            Search
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit
          bg-white/[0.04] light:bg-white/40
          border border-white/[0.06] light:border-[rgba(200,210,235,0.30)]
        ">
          {(["all", "videos", "channels"] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            const count =
              tab === "all"
                ? totalVideoResults + totalChannelResults
                : tab === "videos"
                  ? totalVideoResults
                  : totalChannelResults;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.08] light:bg-white/70 text-[#e8eaf2] light:text-[#0f1523] shadow-sm"
                    : "text-[#8b90a7] light:text-[#3d4a6b] hover:text-[#e8eaf2] light:hover:text-[#0f1523]"
                )}
              >
                {tab === "videos" && <PlaySquare size={15} />}
                {tab === "channels" && <Users size={15} />}
                {tab === "all" && <Search size={15} />}
                <span className="capitalize">{tab}</span>
                {query && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    isActive
                      ? "bg-brand-500/20 text-brand-400 light:bg-brand-600/15 light:text-brand-600"
                      : "bg-white/[0.06] light:bg-black/[0.06] text-[#4a4f66] light:text-[#7a86a8]"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Result summary */}
        <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mb-5">
          {isLoadingVideos && videos.length === 0
            ? "Searching..."
            : query
              ? `${activeTab === "channels" ? totalChannelResults : activeTab === "videos" ? totalVideoResults : totalVideoResults + totalChannelResults} results for "${query}"`
              : "Browse all content"}
        </p>

        {/* ═══ Channels Section ═══ */}
        {(activeTab === "all" || activeTab === "channels") && filteredChannels.length > 0 && (
          <div className="mb-8">
            {activeTab === "all" && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] flex items-center gap-2">
                  <Users size={18} className="text-brand-400" />
                  Channels
                  <span className="text-xs text-[#4a4f66] light:text-[#7a86a8] font-normal ml-1">
                    ({totalChannelResults})
                  </span>
                </h2>
                {totalChannelResults > 4 && (
                  <button
                    onClick={() => handleTabChange("channels")}
                    className="text-xs text-brand-400 light:text-brand-600 hover:underline"
                  >
                    View all →
                  </button>
                )}
              </div>
            )}

            <div className={cn(
              "grid gap-3",
              activeTab === "channels" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
            )}>
              {(activeTab === "all" ? filteredChannels.slice(0, 4) : filteredChannels).map((channel) => (
                <ChannelResultCard key={channel.id} channel={channel} />
              ))}
            </div>

            {activeTab !== "channels" && filteredChannels.length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] light:border-[rgba(200,210,235,0.20)]" />
            )}
          </div>
        )}

        {/* ═══ Videos Section ═══ */}
        {(activeTab === "all" || activeTab === "videos") && (
          <div>
            {activeTab === "all" && videos.length > 0 && (
              <h2 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] flex items-center gap-2 mb-4">
                <PlaySquare size={18} className="text-brand-400" />
                Videos
                <span className="text-xs text-[#4a4f66] light:text-[#7a86a8] font-normal ml-1">
                  ({totalVideoResults})
                </span>
              </h2>
            )}

            {isLoadingVideos && videos.length === 0 ? (
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
            ) : videos.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
                  {videos.map((video) => (
                    <VideoResultItem key={video.id} video={video} />
                  ))}
                </div>
                {hasMoreVideos && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingVideos}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium
                        bg-white/[0.05] light:bg-white/50
                        border border-white/[0.08] light:border-[rgba(200,210,235,0.40)]
                        text-[#8b90a7] light:text-[#3d4a6b]
                        hover:bg-white/[0.09] light:hover:bg-white/70
                        hover:text-[#e8eaf2] light:hover:text-[#0f1523]
                        transition-all disabled:opacity-50
                      "
                    >
                      {isLoadingVideos ? "Loading..." : "Load more videos"}
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ═══ Empty state ═══ */}
        {!isLoadingVideos &&
          videos.length === 0 &&
          filteredChannels.length === 0 &&
          query && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] light:bg-black/[0.04] flex items-center justify-center mb-5">
                <Search size={36} className="text-[#4a4f66] light:text-[#7a86a8]" />
              </div>
              <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">
                No results found
              </h2>
              <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] max-w-sm">
                No videos or channels matched &quot;{query}&quot;. Try different keywords or browse by category.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

/* ─── Video Result Card ─────────────────────────────────────── */
function VideoResultItem({ video }: { video: Video }) {
  const displayDuration = video.duration ? formatDuration(video.duration) : "";
  const displayTime = video.publishedAt ? formatTimeAgo(video.publishedAt) : "";
  const displayViews = video.viewCountDisplay || `${video.viewCount}`;

  return (
    <Link
      href={`/watch?v=${video.youtubeVideoId}`}
      className="
        flex gap-4 group cursor-pointer rounded-xl p-2 transition-all
        border border-transparent
        hover:bg-white/[0.04] light:hover:bg-white/50
        hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.50)]
      "
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-[246px] h-[138px] overflow-hidden rounded-xl bg-[#1a1a24] light:bg-[#dde1ef]">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {displayDuration && (
          <span className="
            absolute bottom-2 right-2 text-white text-xs font-medium px-1.5 py-0.5
            rounded-md bg-black/65 backdrop-blur-md border border-white/10
          ">
            {displayDuration}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-base font-semibold text-[#e8eaf2] light:text-[#0f1523] line-clamp-2 leading-snug mb-2">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
            <img
              src={
                video.channelAvatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.channelName)}&backgroundColor=3b82f6`
              }
              alt={video.channelName}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">{video.channelName}</span>
          <CheckCircle size={13} className="text-[#4a4f66] light:text-[#7a86a8]" />
          <span className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">
            • {displayViews} views • {displayTime}
          </span>
        </div>
        <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] line-clamp-2 leading-relaxed">
          {video.description}
        </p>
      </div>
    </Link>
  );
}

/* ─── Channel Result Card ───────────────────────────────────── */
function ChannelResultCard({ channel }: { channel: Channel }) {
  return (
    <Link
      href={`/channel/${channel.id}`}
      className="
        flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all
        border border-white/[0.06] light:border-[rgba(200,210,235,0.30)]
        bg-white/[0.02] light:bg-white/40
        hover:bg-white/[0.06] light:hover:bg-white/60
        hover:border-white/[0.12] light:hover:border-[rgba(200,210,235,0.55)]
        group
      "
    >
      {/* Avatar */}
      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white/[0.08] light:border-[rgba(200,210,235,0.40)]
        group-hover:border-brand-500/40 transition-colors">
        <img
          src={
            channel.thumbnailUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(channel.name)}&backgroundColor=3b82f6`
          }
          alt={channel.name}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523] truncate">
            {channel.name}
          </h3>
          <CheckCircle size={14} className="text-brand-400/60 light:text-brand-600/60 shrink-0" />
        </div>
        {channel.handle && (
          <p className="text-xs text-[#4a4f66] light:text-[#7a86a8] mb-1">{channel.handle}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">
            {channel.subscriberCount} subscribers
          </span>
          {channel.domains.length > 0 && (
            <>
              <span className="text-[#4a4f66] light:text-[#7a86a8]">•</span>
              <div className="flex items-center gap-1 flex-wrap">
                {channel.domains.slice(0, 3).map((domain) => (
                  <span
                    key={domain}
                    className="text-[10px] px-2 py-0.5 rounded-full
                      bg-brand-500/10 light:bg-brand-600/8
                      text-brand-400 light:text-brand-600
                      border border-brand-500/20 light:border-brand-500/15
                    "
                  >
                    {domain}
                  </span>
                ))}
                {channel.domains.length > 3 && (
                  <span className="text-[10px] text-[#4a4f66] light:text-[#7a86a8]">
                    +{channel.domains.length - 3}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Page wrapper ──────────────────────────────────────────── */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-14">
          <div className="max-w-[1000px] mx-auto px-6 py-6">
            <div className="h-11 rounded-xl bg-white/[0.04] light:bg-black/[0.04] mb-6 animate-pulse" />
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-24 rounded-lg bg-white/[0.04] light:bg-black/[0.04] animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
