"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Tv, History, Clock, CheckCircle,
  Zap, PlaySquare, ListVideo, BookmarkIcon,
  Settings, HelpCircle, ChevronDown,
} from "lucide-react";
import { useSidebarStore, useAuthStore } from "@/store";
import { CHANNELS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* ─── Nav Data ─────────────────────────────────────────────── */
const PRIMARY_NAV = [
  { icon: Home,        label: "Home",          href: "/" },
  { icon: Zap,         label: "Trending",      href: "/trending" },
  { icon: Tv,          label: "Subscriptions", href: "/subscriptions" },
];

const YOU_NAV = [
  { icon: PlaySquare,   label: "Your channel", href: "/channel/me" },
  { icon: History,      label: "History",      href: "/history" },
  { icon: ListVideo,    label: "Playlists",    href: "/playlists" },
  { icon: Clock,        label: "Watch later",  href: "/watch-later" },
  { icon: CheckCircle,  label: "Progress",     href: "/progress" },
  { icon: BookmarkIcon, label: "My Library",   href: "/library" },
];

const FOOTER_NAV = [
  { icon: Settings,    label: "Settings", href: "/settings" },
  { icon: HelpCircle,  label: "Help",     href: "/help" },
];

/* ─── Divider ──────────────────────────────────────────────── */
function Divider() {
  return <div className="my-3 mx-4 border-t border-white/[0.06] light:border-[rgba(200,210,235,0.30)]" />;
}

/* ─── Section Label ────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 px-4 mb-1">
      <span className="text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">{children}</span>
      <span className="text-lg leading-none text-[#4a4f66] light:text-[#7a86a8]">›</span>
    </div>
  );
}

/* ─── Expanded Item ─────────────────────────────────────────── */
function ExpandedItem({ icon: Icon, label, href, active }: {
  icon: React.ElementType; label: string; href: string; active: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "group flex items-center gap-3 px-3 h-10 mx-2 rounded-xl cursor-pointer transition-all text-sm relative",
          active
            ? "bg-white/[0.04] light:bg-brand-600/[0.08] text-[#e8eaf2] light:text-brand-700 font-semibold"
            : "text-[#8b90a7] light:text-[#3d4a6b] font-medium hover:bg-white/[0.04] light:hover:bg-brand-600/[0.06] hover:text-[#e8eaf2] light:hover:text-[#0f1523]"
        )}
      >
        {/* Active accent bar */}
        {active && (
          <div className="absolute left-0 top-[15%] w-[3px] h-[70%] rounded-r bg-brand-500 shadow-glow-sm" />
        )}
        {/* Icon badge */}
        <div className={cn("sidebar-badge", active && "active")}>
          <Icon
            size={18}
            className="shrink-0"
            strokeWidth={active ? 2.2 : 1.8}
          />
        </div>
        <span className="leading-none truncate">{label}</span>
      </div>
    </Link>
  );
}

/* ─── Mini Item (collapsed) ────────────────── */
function MiniItem({ icon: Icon, label, href, active }: {
  icon: React.ElementType; label: string; href: string; active: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 w-full py-3 cursor-pointer transition-all rounded-xl mx-auto min-h-[60px]",
          active
            ? "text-[#e8eaf2] light:text-brand-700"
            : "text-[#8b90a7] light:text-[#3d4a6b] hover:bg-white/[0.04] light:hover:bg-brand-600/[0.06]"
        )}
      >
        <div className={cn("sidebar-badge", active && "active")}>
          <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
        </div>
        <span className={cn(
          "text-[10px] text-center leading-tight whitespace-pre-line max-w-[56px]",
          active ? "text-[#e8eaf2] light:text-brand-700" : "text-[#4a4f66] light:text-[#7a86a8]"
        )}>
          {label.split(" ").slice(0, 2).join("\n")}
        </span>
      </div>
    </Link>
  );
}

/* ─── Main Sidebar ───────────────────────────────────────────── */
export default function Sidebar() {
  const { isExpanded, isOverlay, toggle } = useSidebarStore();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [showMoreChannels, setShowMoreChannels] = useState(false);

  const activeChannels = CHANNELS.filter((c) => c.status === "active");
  const visibleChannels = showMoreChannels ? activeChannels : activeChannels.slice(0, 6);
  const isActive = (href: string) => pathname === href;

  const sidebarClasses = `
    bg-[#0e0e12]/65 light:bg-[#f0f2f8]/70
    backdrop-blur-xl
    border-r border-white/[0.05] light:border-[rgba(200,210,235,0.40)]
    scrollbar-none
  `;

  /* ── OVERLAY MODE (watch page) ─────────────────────────────── */
  if (isOverlay) {
    return (
      <>
        {/* Backdrop — click to close */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[4px]"
            onClick={() => toggle()}
          />
        )}

        {/* Slide-in drawer */}
        <div
          className={cn(
            "fixed top-[60px] left-0 h-full w-60 z-50 overflow-y-auto transition-transform duration-200",
            sidebarClasses,
            isExpanded ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="py-3">
            {PRIMARY_NAV.map(({ icon, label, href }) => (
              <ExpandedItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
            ))}
            <Divider />
            <SectionLabel>You</SectionLabel>
            {YOU_NAV.map(({ icon, label, href }) => (
              <ExpandedItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
            ))}
            <Divider />
            {FOOTER_NAV.map(({ icon, label, href }) => (
              <ExpandedItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
            ))}
          </nav>
        </div>
      </>
    );
  }

  /* ── MINI sidebar (collapsed) ────────────────── */
  if (!isExpanded) {
    return (
      <aside className={cn("sticky top-[60px] self-start h-[calc(100vh-60px)] overflow-y-auto shrink-0 w-[72px]", sidebarClasses)}>
        <div className="flex flex-col py-2 px-1">
          {PRIMARY_NAV.map(({ icon, label, href }) => (
            <MiniItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
          ))}
          <MiniItem icon={Tv} label="You" href="#" active={false} />
        </div>
      </aside>
    );
  }

  /* ── EXPANDED sidebar ─────────────────── */
  return (
    <aside className={cn("sticky top-[60px] self-start h-[calc(100vh-60px)] overflow-y-auto shrink-0 w-60", sidebarClasses)}>
      <nav className="py-3">
        {PRIMARY_NAV.map(({ icon, label, href }) => (
          <ExpandedItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
        ))}

        <Divider />
        <SectionLabel>You</SectionLabel>
        {YOU_NAV.map(({ icon, label, href }) => (
          <ExpandedItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
        ))}

        {isAuthenticated && (
          <>
            <Divider />
            <SectionLabel>Subscriptions</SectionLabel>
            {visibleChannels.map((ch) => (
              <Link key={ch.id} href={`/channel/${ch.id}`}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 h-10 mx-2 rounded-xl cursor-pointer transition-all text-sm",
                    isActive(`/channel/${ch.id}`)
                      ? "bg-white/[0.04] light:bg-brand-600/[0.08] text-[#e8eaf2] light:text-[#0f1523]"
                      : "text-[#8b90a7] light:text-[#3d4a6b] hover:bg-white/[0.04] light:hover:bg-brand-600/[0.06]"
                  )}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/[0.08] light:border-black/[0.08]">
                    <img src={ch.avatar} alt={ch.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="truncate">{ch.name}</span>
                </div>
              </Link>
            ))}
            <button
              onClick={() => setShowMoreChannels(!showMoreChannels)}
              className="
                flex items-center gap-3 px-3 h-10 mx-2 rounded-xl cursor-pointer transition-all
                w-[calc(100%-16px)] text-sm
                text-[#8b90a7] light:text-[#3d4a6b]
                hover:bg-white/[0.04] light:hover:bg-brand-600/[0.06]
              "
            >
              <ChevronDown size={18} strokeWidth={1.8} className={cn("shrink-0 transition-transform", showMoreChannels && "rotate-180")} />
              <span>{showMoreChannels ? "Show less" : "Show more"}</span>
            </button>
          </>
        )}

        <Divider />
        {FOOTER_NAV.map(({ icon, label, href }) => (
          <ExpandedItem key={href} icon={icon} label={label} href={href} active={isActive(href)} />
        ))}

        {/* Footer links */}
        <Divider />
        <div className="px-4 py-2 flex flex-wrap gap-x-2 gap-y-1">
          {["About", "Press", "Copyright", "Contact", "Creators", "Terms", "Privacy"].map((t) => (
            <span key={t} className="text-[11px] cursor-pointer transition-colors text-[#4a4f66] light:text-[#7a86a8] hover:text-[#8b90a7] light:hover:text-[#3d4a6b]">{t}</span>
          ))}
          <span className="text-[11px] mt-1 w-full text-[#4a4f66] light:text-[#7a86a8]">© 2025 StudyTube</span>
        </div>
      </nav>
    </aside>
  );
}
