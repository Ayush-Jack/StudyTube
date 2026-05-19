"use client";
import Link from "next/link";
import type { Video } from "@/types";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTimeAgo, formatDuration } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  compact?: boolean;
  watchProgress?: number; // 0-100, optional — comes from progress API
  index?: number; // for staggered animation
}

export default function VideoCard({ video, compact = false, watchProgress, index = 0 }: VideoCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const displayDuration = video.duration ? formatDuration(video.duration) : "";
  const displayTime = video.publishedAt ? formatTimeAgo(video.publishedAt) : "";
  const displayViews = video.viewCountDisplay || `${video.viewCount} views`;

  if (compact) {
    return (
      <div
        onClick={() => router.push(`/watch?v=${video.youtubeVideoId}`)}
        className="
          flex gap-2 group cursor-pointer rounded-xl p-1.5
          transition-all duration-200
          border border-transparent
          hover:bg-white/[0.04] light:hover:bg-white/50
          hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.50)]
        "
      >
        <div className="relative shrink-0 w-[168px] h-[94px] overflow-hidden rounded-[10px] bg-[#1a1a24] light:bg-[#dde1ef]">
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          <span className="
            absolute bottom-1 right-1 text-white font-medium px-1.5 py-0.5
            text-[11px] rounded-md
            bg-black/65 backdrop-blur-md border border-white/10
          ">
            {displayDuration}
          </span>
          {watchProgress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div className="h-full bg-brand-500" style={{ width: `${watchProgress}%` }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-1 pt-0.5">
          <h3 className="text-sm font-semibold line-clamp-2 leading-tight text-[#e8eaf2] light:text-[#0f1523]">
            {video.title}
          </h3>
          <p className="mt-1 text-[0.73rem] font-medium text-[#8b90a7] light:text-[#3d4a6b]">{video.channelName}</p>
          <p className="text-[0.73rem] text-[#4a4f66] light:text-[#7a86a8]">{displayViews} views &bull; {displayTime}</p>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/watch?v=${video.youtubeVideoId}`}>
      <div
        className="
          group cursor-pointer rounded-2xl
          bg-transparent border border-transparent
          transition-all duration-250
          animate-card-in
          hover:-translate-y-1 hover:p-1.5
          hover:bg-white/[0.04] light:hover:bg-white/60
          hover:border-white/[0.08] light:hover:border-[rgba(200,210,235,0.60)]
          hover:backdrop-blur-xl
          hover:shadow-glass-dark light:hover:shadow-glass-light
        "
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        <div className="relative overflow-hidden rounded-xl aspect-video bg-[#1a1a24] light:bg-[#dde1ef]">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-350 ease-out group-hover:scale-[1.03]"
          />
          <span className="
            absolute bottom-2 right-2 text-white font-bold
            text-[0.72rem] px-2 py-[2px] rounded-md tracking-wide
            bg-black/65 backdrop-blur-md border border-white/10
          ">
            {displayDuration}
          </span>
          {watchProgress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.08]">
              <div className="h-full bg-brand-500 rounded-tr-sm" style={{ width: `${watchProgress}%` }} />
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity glass-btn !w-[30px] !h-[30px]"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        <div className="flex gap-[10px] mt-3 p-0 group-hover:px-1 transition-all items-start">
          <div
            onClick={(e) => { e.preventDefault(); router.push(`/channel/${video.channelId}`); }}
            className="
              w-9 h-9 min-w-[36px] rounded-full overflow-hidden mt-0.5 cursor-pointer
              bg-gradient-to-br from-brand-600 to-brand-400
              border border-white/10 light:border-black/10
              shadow-[inset_0_0_6px_rgba(37,99,235,0.15)]
            "
          >
            <img
              src={video.channelAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.channelName)}&backgroundColor=3b82f6`}
              alt={video.channelName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold line-clamp-2 leading-snug text-[#e8eaf2] light:text-[#0f1523]">
              {video.title}
            </h3>
            <p
              onClick={(e) => { e.preventDefault(); router.push(`/channel/${video.channelId}`); }}
              className="
                mt-1 text-[0.75rem] font-medium cursor-pointer transition-colors
                text-[#8b90a7] light:text-[#3d4a6b]
                hover:text-[#e8eaf2] light:hover:text-[#0f1523]
              "
            >
              {video.channelName}
            </p>
            <p className="text-[0.72rem] text-[#4a4f66] light:text-[#7a86a8] mt-[2px]">
              {displayViews} views &bull; {displayTime}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
