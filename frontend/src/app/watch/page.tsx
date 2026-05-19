"use client";
import Head from "next/head";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
  ThumbsUp, ThumbsDown, Share2, Bookmark,
  CheckCircle, Bell, MoreHorizontal, MoreVertical, BadgeCheck, ChevronRight,
} from "lucide-react";
import * as videoService from "@/services/videoService";
import * as progressService from "@/services/progressService";
import type { Video } from "@/types";
import { formatTimeAgo, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Avatar Helper ────────────────────────────────────────────────
function Avatar({ src, name, size = 40 }: { src: string; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full overflow-hidden shrink-0 bg-brand-600/20 light:bg-brand-600/12 border border-brand-500/30"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = "none";
          if (el.parentElement) el.parentElement.innerText = initials;
        }}
      />
    </div>
  );
}

// ── Related Video Card ───────────────────────────────────────────
function RelatedCard({ video }: { video: Video }) {
  const displayDuration = video.duration ? formatDuration(video.duration) : "";
  const displayTime = video.publishedAt ? formatTimeAgo(video.publishedAt) : "";
  const displayViews = video.viewCountDisplay || `${video.viewCount}`;

  return (
    <Link
      href={`/watch?v=${video.youtubeVideoId}`}
      className="
        group flex flex-row gap-2 mb-2 rounded-xl p-2 cursor-pointer transition-all
        border border-transparent
        hover:bg-white/[0.04] light:hover:bg-white/50
        hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.50)]
      "
    >
      {/* Thumbnail 168×94 */}
      <div className="relative shrink-0 rounded-xl overflow-hidden w-[168px] h-[94px] bg-[#1a1a24] light:bg-[#dde1ef]">
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        <span className="
          absolute bottom-1 right-1 text-white font-medium rounded px-1 py-0.5
          text-[11px] leading-4 bg-black/90
        ">
          {displayDuration}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pt-0.5 relative">
        <button
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#8b90a7] light:text-[#3d4a6b]"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical size={16} />
        </button>
        <p className="text-sm font-medium text-[#e8eaf2] light:text-[#0f1523] leading-snug line-clamp-2 pr-5">
          {video.title}
        </p>
        <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b] mt-1 flex items-center gap-1 truncate">
          {video.channelName}
          <BadgeCheck size={12} className="shrink-0" />
        </p>
        <p className="text-xs text-[#8b90a7] light:text-[#3d4a6b]">
          {displayViews} views · {displayTime}
        </p>
      </div>
    </Link>
  );
}

// ── Watch Content (uses useSearchParams) ─────────────────────────
function WatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get("v");

  // Redirect home if no video ID
  if (!videoId) {
    router.replace("/");
    return null;
  }

  return <WatchPlayer videoId={videoId} />;
}

// ── Watch Player (core logic) ────────────────────────────────────
function WatchPlayer({ videoId }: { videoId: string }) {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────────────
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isCompleted,  setIsCompleted]  = useState<boolean>(false);
  const [showFullDesc, setShowFullDesc] = useState<boolean>(false);
  const [reaction, setReaction]         = useState<"like" | "dislike" | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoEnded, setVideoEnded]     = useState(false);

  // Track watch time for progress reporting
  const watchStartRef = useRef<number>(Date.now());
  const lastReportRef = useRef<number>(0);

  // ── Fullscreen detection ─────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── YouTube IFrame API — detect video end ────────────────────────
  useEffect(() => {
    setVideoEnded(false);

    // Load the YT IFrame API script (once)
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    function initPlayer() {
      if (!(window as any).YT?.Player) return;
      new (window as any).YT.Player("yt-player", {
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) setVideoEnded(true);
            // Reset when playing again
            if (event.data === 1) setVideoEnded(false);
          },
        },
      });
    }

    // If YT is already loaded, init immediately; otherwise wait for callback
    if ((window as any).YT?.Player) {
      // Small delay to ensure iframe is rendered
      const t = setTimeout(initPlayer, 500);
      return () => clearTimeout(t);
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId]);

  // ── Fetch video data ────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError("");
      try {
        const vid = await videoService.getVideoByYoutubeId(videoId);
        setVideo(vid);
        if (vid.domain) {
          const related = await videoService.getVideosByDomain(vid.domain, 0, 15);
          setRelatedVideos(related.content.filter((v) => v.youtubeVideoId !== videoId));
        }
      } catch {
        try {
          const vid = await videoService.getVideoById(videoId);
          setVideo(vid);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Video not found";
          setError(msg);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
    watchStartRef.current = Date.now();
    lastReportRef.current = 0;
  }, [videoId]);

  // ── Report progress periodically (every 30s) ────────────────────
  const reportProgress = useCallback(async (completionPct: number) => {
    if (!video) return;
    const watchedSeconds = Math.floor((Date.now() - watchStartRef.current) / 1000);
    if (watchedSeconds < 5) return;
    try {
      await progressService.recordWatch(video.id, watchedSeconds, completionPct);
      lastReportRef.current = Date.now();
    } catch {
      // Silent fail
    }
  }, [video]);

  useEffect(() => {
    if (!video) return;
    const interval = setInterval(() => { reportProgress(0); }, 30000);
    return () => { clearInterval(interval); reportProgress(0); };
  }, [video, reportProgress]);

  const handleMarkComplete = async () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    if (newState && video) await reportProgress(100);
  };

  // ── Loading state ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen pt-14">
        <div className="flex flex-row gap-6 mx-auto max-w-[1600px] px-6 py-3 pb-12">
          <div className="flex-1 min-w-0">
            <div className="w-full aspect-video animate-pulse rounded-xl bg-white/[0.04] light:bg-black/[0.04]" />
            <div className="h-6 rounded mt-3 w-3/4 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
            <div className="h-4 rounded mt-2 w-1/2 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">Video not found</h2>
          <p className="text-[#8b90a7] light:text-[#3d4a6b]">{error}</p>
        </div>
      </div>
    );
  }

  // ── Derived display values ──────────────────────────────────────
  const displayViews = video.viewCountDisplay || `${video.viewCount}`;
  const displayTime = video.publishedAt ? formatTimeAgo(video.publishedAt) : "";
  const channelAvatarUrl = video.channelAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.channelName)}&backgroundColor=3b82f6`;

  const filterTabs = ["All", `From ${video.channelName}`, video.domain];
  const filteredRelated = activeFilter === `From ${video.channelName}`
    ? relatedVideos.filter((v) => v.channelName === video.channelName)
    : activeFilter === video.domain
    ? relatedVideos.filter((v) => v.domain === video.domain)
    : relatedVideos;

  const embedSrc = [
    `https://www.youtube.com/embed/${video.youtubeVideoId}`,
    `?autoplay=1`,
    `&rel=0`,
    `&modestbranding=1`,
    `&iv_load_policy=3`,
    `&disablekb=0`,
    `&fs=1`,
    `&playsinline=1`,
    `&enablejsapi=1`,
  ].join("");
  const pageUrl  = `https://studytube.in/watch?v=${video.youtubeVideoId}`;

  // Next video for "Up Next" overlay
  const nextVideo = filteredRelated.length > 0 ? filteredRelated[0] : null;

  // ── Action button class ─────────────────────────────────────────
  const actionBtn = "flex items-center gap-2 rounded-full text-sm font-medium px-4 py-2 transition-all bg-white/[0.05] light:bg-white/50 border border-white/[0.08] light:border-[rgba(200,210,235,0.50)] text-[#e8eaf2] light:text-[#0f1523] hover:bg-white/[0.09] light:hover:bg-white/70";

  return (
    <>
      {/* ── SEO ────────────────────────────────────────────────── */}
      <Head>
        <title>{video.title} | StudyTube</title>
        <meta name="description"        content={video.description.slice(0, 160)} />
        <meta property="og:title"       content={video.title} />
        <meta property="og:description" content={video.description} />
        <meta property="og:image"       content={video.thumbnailUrl} />
        <meta property="og:url"         content={pageUrl} />
        <link rel="canonical"           href={pageUrl} />
      </Head>

      {/* ── Page Shell ─────────────────────────────────────────── */}
      <div className="min-h-screen pt-14">
        <div className="flex flex-row gap-6 mx-auto max-w-[1600px] px-6 py-3 pb-12">
          {/* ── LEFT / CENTER ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ── VIDEO PLAYER ─────────────────────────────────── */}
            {/*
              Strategy: The iframe is 36px taller than the visible
              container. overflow:hidden clips the YouTube "More
              videos" watermark and logo that sit in the bottom bar.
              NO transparent overlays → all controls (play, seek,
              fullscreen, mute, CC, settings) work perfectly.
            */}
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-white/[0.07]"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Actual YouTube embed — 36px taller to push the
                  "More videos" bar below the visible clipping edge */}
              <iframe
                id="yt-player"
                src={embedSrc}
                title={video.title}
                className="absolute border-none block"
                style={{ top: 0, left: 0, width: '100%', height: 'calc(100% + 36px)' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />

              {/* ── UP NEXT OVERLAY — replaces YouTube end screen ── */}
              {videoEnded && !isFullscreen && (
                <div className="
                  absolute inset-0 z-20
                  bg-[#0e0e12]/90 backdrop-blur-sm
                  flex flex-col items-center justify-center gap-4
                  rounded-2xl
                ">
                  <p className="text-[#8b90a7] text-sm font-medium uppercase tracking-widest">
                    Up Next
                  </p>

                  {nextVideo ? (
                    <Link
                      href={`/watch?v=${nextVideo.youtubeVideoId}`}
                      className="
                        flex gap-3 items-center
                        bg-white/[0.06] border border-white/[0.10]
                        rounded-xl p-3 w-[340px]
                        hover:bg-white/[0.10] transition-all
                        light:bg-white/50 light:border-[rgba(200,210,235,0.50)]
                      "
                    >
                      <img
                        src={nextVideo.thumbnailUrl || `https://i.ytimg.com/vi/${nextVideo.youtubeVideoId}/mqdefault.jpg`}
                        alt={nextVideo.title}
                        className="w-28 rounded-lg aspect-video object-cover"
                      />
                      <span className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523] line-clamp-2">
                        {nextVideo.title}
                      </span>
                    </Link>
                  ) : (
                    <p className="text-[#4a4f66] text-sm">No more videos in this domain</p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setVideoEnded(false)}
                      className="
                        px-4 py-2 rounded-xl text-sm font-medium
                        bg-white/[0.05] border border-white/[0.08]
                        text-[#8b90a7] hover:text-[#e8eaf2]
                        transition-all duration-200
                      "
                    >
                      ↺ Replay
                    </button>
                    <Link
                      href="/"
                      className="
                        px-4 py-2 rounded-xl text-sm font-medium
                        bg-brand-600/15 border border-brand-500/40
                        text-brand-400 hover:text-[#e8eaf2]
                        transition-all duration-200
                      "
                    >
                      ← Back to Feed
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── TITLE ─────────────────────────────────────────── */}
            <h1 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mt-3 mb-1 leading-snug">
              {video.title}
            </h1>

            {/* ── VIEWS + DATE ───────────────────────────────────── */}
            <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mb-3">
              {displayViews} views · {displayTime}
            </p>

            {/* ── ACTION BUTTONS ROW ────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap mb-4">

              {/* Like / Dislike split pill */}
              <div className="flex items-center rounded-full overflow-hidden glass">
                <button
                  onClick={() => setReaction(reaction === "like" ? null : "like")}
                  className={cn("flex items-center gap-1.5 px-4 py-2 transition-colors border-r border-white/[0.08] light:border-[rgba(200,210,235,0.30)]",
                    reaction === "like" ? "text-brand-400" : "text-[#e8eaf2] light:text-[#0f1523]"
                  )}
                >
                  <ThumbsUp size={18} fill={reaction === "like" ? "currentColor" : "none"} />
                  <span className="text-sm font-medium">{displayViews}</span>
                </button>
                <button
                  onClick={() => setReaction(reaction === "dislike" ? null : "dislike")}
                  className={cn("flex items-center px-4 py-2 transition-colors",
                    reaction === "dislike" ? "text-red-400" : "text-[#e8eaf2] light:text-[#0f1523]"
                  )}
                >
                  <ThumbsDown size={18} fill={reaction === "dislike" ? "currentColor" : "none"} />
                </button>
              </div>

              <button className={actionBtn}>
                <Share2 size={18} /> Share
              </button>
              <button className={actionBtn}>
                <Bookmark size={18} /> Save
              </button>
              <button className="glass-btn !w-10 !h-10">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* ── CHANNEL ROW ───────────────────────────────────── */}
            <div className="flex items-center justify-between mt-2 mb-4">
              <div className="flex items-center gap-3">
                <Link href={`/channel/${video.channelId}`}>
                  <Avatar src={channelAvatarUrl} name={video.channelName} size={40} />
                </Link>
                <div>
                  <Link href={`/channel/${video.channelId}`}>
                    <p className="text-base font-medium text-[#e8eaf2] light:text-[#0f1523] flex items-center gap-1 hover:underline cursor-pointer">
                      {video.channelName}
                      <BadgeCheck size={16} className="text-[#8b90a7] light:text-[#3d4a6b] shrink-0" />
                    </p>
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={cn(
                  "flex items-center gap-1.5 font-medium text-sm rounded-full px-4 py-2 transition-all",
                  isSubscribed
                    ? "bg-white/[0.05] light:bg-black/[0.04] text-[#e8eaf2] light:text-[#0f1523] border border-white/[0.08] light:border-black/[0.08]"
                    : "bg-[#e8eaf2] light:bg-[#0f1523] text-[#0e0e12] light:text-white hover:opacity-90"
                )}
              >
                {isSubscribed ? <><Bell size={16} /> Subscribed</> : "Subscribe"}
              </button>
            </div>

            {/* ── MARK AS COMPLETE ────────────── */}
            <div className="mb-3">
              <button
                onClick={handleMarkComplete}
                className={cn(
                  "flex items-center gap-2 text-sm rounded-full px-4 py-2 transition-all",
                  isCompleted
                    ? "bg-emerald-500/20 light:bg-emerald-500/10 border border-emerald-500/40 light:border-emerald-500/30 text-emerald-400 light:text-emerald-600"
                    : "bg-white/[0.05] light:bg-white/50 border border-white/[0.08] light:border-[rgba(200,210,235,0.50)] text-[#e8eaf2] light:text-[#0f1523] hover:bg-emerald-600/15 hover:border-emerald-500/40"
                )}
              >
                <CheckCircle size={16} />
                {isCompleted ? "Completed ✓" : "Mark as Complete"}
              </button>
            </div>

            {/* ── DESCRIPTION BOX ───────────────────────────────── */}
            <div
              className="glass rounded-xl mt-3 cursor-pointer p-3"
              onClick={() => setShowFullDesc(!showFullDesc)}
            >
              <p className="font-medium text-sm text-[#e8eaf2] light:text-[#0f1523] mb-1">
                {displayViews} views&nbsp;&nbsp;{displayTime}
              </p>
              <p
                className="text-sm text-[#e8eaf2] light:text-[#0f1523] leading-relaxed"
                style={{
                  ...(showFullDesc
                    ? {}
                    : {
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }),
                }}
              >
                {video.description}
              </p>
              <span className="font-medium text-sm text-[#e8eaf2] light:text-[#0f1523] mt-1 inline-block">
                {showFullDesc ? "Show less" : "...more"}
              </span>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR — RELATED VIDEOS ──────────────────── */}
          <div className="shrink-0 hidden lg:block w-[402px]">

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-none">
              {filterTabs.map((tab) => {
                const isActiveTab = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={cn("chip shrink-0", isActiveTab && "active")}
                  >
                    {tab}
                  </button>
                );
              })}
              <button className="glass-btn shrink-0 !w-8 !h-8">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Related Video Cards */}
            <div className="flex flex-col">
              {filteredRelated.map((rv) => (
                <RelatedCard key={rv.id} video={rv} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Exported Page (wrapped in Suspense for useSearchParams) ──────
export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-14">
        <div className="flex flex-row gap-6 mx-auto max-w-[1600px] px-6 py-3 pb-12">
          <div className="flex-1 min-w-0">
            <div className="w-full aspect-video animate-pulse rounded-xl bg-white/[0.04] light:bg-black/[0.04]" />
            <div className="h-6 rounded mt-3 w-3/4 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
            <div className="h-4 rounded mt-2 w-1/2 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
          </div>
        </div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
