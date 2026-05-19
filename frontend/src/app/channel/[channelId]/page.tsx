"use client";
import { useParams } from "next/navigation";
import VideoCard from "@/components/video/VideoCard";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import * as channelService from "@/services/channelService";
import * as videoService from "@/services/videoService";
import type { Channel, Video } from "@/types";

const TABS = ["Videos", "Playlists", "Community", "About"];

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  const [activeTab, setActiveTab] = useState("Videos");
  const [subscribed, setSubscribed] = useState(false);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError("");
      try {
        const [ch, vids] = await Promise.all([
          channelService.getChannelById(channelId),
          videoService.getVideosByChannel(channelId, 0, 20),
        ]);
        setChannel(ch);
        setVideos(vids.content);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load channel";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [channelId]);

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="w-full h-40 animate-pulse bg-white/[0.03] light:bg-black/[0.03]" />
        <div className="px-6 py-5 flex items-start gap-5">
          <div className="w-20 h-20 rounded-full animate-pulse -mt-8 bg-white/[0.04] light:bg-black/[0.04]" />
          <div className="flex-1">
            <div className="h-6 rounded w-48 mb-2 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
            <div className="h-4 rounded w-32 animate-pulse bg-white/[0.04] light:bg-black/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <span className="text-5xl mb-4">⚠️</span>
        <h2 className="text-xl font-semibold text-[#e8eaf2] light:text-[#0f1523] mb-2">Channel not found</h2>
        <p className="text-[#8b90a7] light:text-[#3d4a6b]">{error}</p>
      </div>
    );
  }

  // Domain icon helper
  const domainIcon = channel.domains.includes("Engineering") ? "⚙️" :
    channel.domains.includes("Medical") ? "🩺" :
    channel.domains.includes("Programming") ? "💻" : "📚";

  return (
    <div className="flex-1">
      {/* Channel Banner */}
      <div className="w-full h-40 relative overflow-hidden bg-gradient-to-br from-brand-600/[0.06] via-transparent to-brand-600/[0.03] light:from-brand-600/[0.08] light:to-brand-600/[0.04]">
        <div className="absolute inset-0 opacity-20 flex items-center justify-center text-[120px] select-none">
          {domainIcon}
        </div>
      </div>

      {/* Channel Header */}
      <div className="px-6 py-5 flex items-start gap-5 border-b border-white/[0.06] light:border-[rgba(200,210,235,0.30)]">
        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 ring-4 ring-[#0e0e12] light:ring-[#f0f2f8] -mt-8 relative z-10">
          <img
            src={channel.thumbnailUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(channel.name)}&backgroundColor=3b82f6`}
            alt={channel.name}
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold font-display text-[#e8eaf2] light:text-[#0f1523]">{channel.name}</h1>
            <CheckCircle size={18} className="text-[#8b90a7] light:text-[#3d4a6b]" />
          </div>
          <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b] mt-0.5">{channel.handle}</p>
          <p className="text-sm text-[#8b90a7] light:text-[#3d4a6b]">
            {channel.subscriberCount} subscribers
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {channel.domains.map((d) => (
              <span key={d} className="chip text-xs !py-1 !px-2.5">{d}</span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setSubscribed(!subscribed)}
          className={cn(
            "px-6 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 mt-2",
            subscribed
              ? "bg-white/[0.05] light:bg-black/[0.04] text-[#e8eaf2] light:text-[#0f1523] border border-white/[0.08] light:border-black/[0.08]"
              : "bg-[#e8eaf2] light:bg-[#0f1523] text-[#0e0e12] light:text-white"
          )}>
          {subscribed ? "Subscribed ✓" : "Subscribe"}
        </button>
      </div>

      {/* Tab Bar */}
      <div className="px-6 flex gap-1 border-b border-white/[0.06] light:border-[rgba(200,210,235,0.30)]">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab
                ? "text-[#e8eaf2] light:text-[#0f1523]"
                : "text-[#8b90a7] light:text-[#3d4a6b] hover:text-[#e8eaf2] light:hover:text-[#0f1523]"
            )}>
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 shadow-glow-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="px-6 py-6">
        {activeTab === "Videos" && (
          videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {videos.map((video, i) => (
                <VideoCard key={`${video.id}-${i}`} video={video} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-[#8b90a7] light:text-[#3d4a6b] py-12 text-center">No videos yet from this channel.</p>
          )
        )}
        {activeTab !== "Videos" && (
          <div className="py-24 text-center">
            <p className="text-4xl mb-3">🚧</p>
            <p className="text-lg font-medium text-[#e8eaf2] light:text-[#0f1523]">{activeTab} coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
