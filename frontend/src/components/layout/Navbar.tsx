"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, Mic, Search, Plus, BookOpen, Moon, Sun } from "lucide-react";
import { useSidebarStore } from "@/store";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useState, useRef, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────
interface NavbarProps {
  onMenuToggle?: () => void;
}

// ── Component ────────────────────────────────────────────────────
export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { toggle } = useSidebarStore();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = () => {
    toggle();
    onMenuToggle?.();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // User initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50 h-[60px]
        flex items-center gap-2 px-3
        bg-[#0e0e12]/80 light:bg-[#f0f2f8]/80
        backdrop-blur-[28px] saturate-150
        border-b border-white/[0.06] light:border-[rgba(200,210,235,0.40)]
        shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]
        light:shadow-[0_4px_24px_rgba(100,120,180,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]
      "
    >
      {/* ── LEFT: Hamburger + Logo ───────────────────── */}
      <div className="flex items-center gap-5 shrink-0 w-[220px]">
        {/* Hamburger */}
        <button
          id="navbar-hamburger"
          onClick={handleMenuToggle}
          className="glass-btn ml-1"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 select-none">
          <div className="
            w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0
            bg-brand-600/12 light:bg-brand-600/10
            border border-brand-500/25 light:border-brand-500/30
            shadow-[inset_0_0_12px_rgba(37,99,235,0.3),0_2px_8px_rgba(37,99,235,0.15)]
            backdrop-blur-sm
          ">
            <BookOpen size={17} className="text-brand-400 light:text-brand-600" strokeWidth={2.2} />
          </div>
          <span className="hidden sm:block tracking-tight font-display font-extrabold text-xl logo-gradient">
            StudyTube
          </span>
        </Link>
      </div>

      {/* ── CENTER: Search ────────────── */}
      <div className="flex items-center flex-1 justify-center max-w-[640px] mx-auto">
        <div className="flex items-center flex-1 h-10">
          {/* Text input */}
          <input
            id="navbar-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search study videos..."
            className="
              flex-1 h-10 outline-none min-w-0 px-4 text-sm
              bg-white/[0.05] light:bg-white/55
              border border-white/[0.08] light:border-[rgba(200,210,235,0.60)]
              border-r-0 rounded-l-xl
              text-[#e8eaf2] light:text-[#0f1523]
              placeholder:text-[#4a4f66] light:placeholder:text-[#7a86a8]
              backdrop-blur-lg
              focus:border-brand-500/50 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]
              transition-all duration-200
            "
          />
          {/* Search button */}
          <button
            id="navbar-search-btn"
            type="button"
            onClick={handleSearchSubmit}
            className="
              flex items-center justify-center shrink-0
              w-[52px] h-10
              bg-white/[0.06] light:bg-white/50
              border border-white/[0.08] light:border-[rgba(200,210,235,0.60)]
              border-l-0 rounded-r-xl
              text-[#8b90a7] light:text-[#3d4a6b]
              hover:text-brand-400 light:hover:text-brand-600
              transition-colors duration-200
            "
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Mic button */}
        <button
          id="navbar-mic-btn"
          type="button"
          className="glass-btn ml-2"
          aria-label="Search by voice"
        >
          <Mic size={18} />
        </button>
      </div>

      {/* ── RIGHT: Theme toggle + Create + Bell + Avatar ───── */}
      <div className="flex items-center shrink-0 ml-auto gap-2">

        {/* ── THEME TOGGLE ── */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="
            relative w-16 h-8 rounded-full cursor-pointer
            bg-white/[0.06] light:bg-[rgba(255,200,50,0.08)]
            border border-white/[0.10] light:border-[rgba(255,200,50,0.20)]
            transition-all duration-300
            focus:outline-none
          "
        >
          <span className={`
            absolute top-[3px] w-6 h-6 rounded-full
            flex items-center justify-center text-xs
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isDark
              ? 'left-[3px] bg-brand-600/30 border border-brand-500/50 shadow-glow-sm'
              : 'left-[3px] translate-x-8 bg-[rgba(255,200,50,0.25)] border border-[rgba(255,200,50,0.50)]'
            }
          `}>
            {isDark ? <Moon size={12} /> : <Sun size={12} />}
          </span>
        </button>

        {isAuthenticated && user ? (
          <>
            {/* Create pill button */}
            {/* <button
              id="navbar-create-btn"
              className="
                hidden sm:flex items-center gap-1.5 rounded-full h-9 px-3.5
                bg-white/[0.05] light:bg-white/50
                border border-white/[0.08] light:border-[rgba(200,210,235,0.50)]
                backdrop-blur-md
                text-[#8b90a7] light:text-[#3d4a6b]
                hover:border-white/[0.14] light:hover:border-[rgba(200,210,235,0.80)]
                hover:bg-white/[0.08] light:hover:bg-white/70
                transition-all duration-200
              "
            >
              <Plus size={18} />
              <span className="text-[13px] font-medium text-[#e8eaf2] light:text-[#0f1523]">Create</span>
            </button> */}

            {/* Bell icon */}
            {/* <button
              id="navbar-bell-btn"
              className="glass-btn relative"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.6} /> */}
            {/* Badge */}
            {/* <span className="
                absolute top-[2px] right-0
                w-4 h-4 rounded-full
                flex items-center justify-center
                text-white font-bold text-[9px]
                bg-gradient-to-br from-brand-600 to-brand-400
                border-[1.5px] border-[#0e0e12] light:border-[#f0f2f8]
              ">
                6
              </span>
            </button> */}

            {/* Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="navbar-avatar-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                className="
                  flex items-center justify-center rounded-full
                  w-[34px] h-[34px]
                  bg-brand-600/20 light:bg-brand-600/12
                  border border-brand-500/35 light:border-brand-500/30
                  shadow-[inset_0_0_8px_rgba(37,99,235,0.2)]
                "
                aria-label="Account menu"
                aria-expanded={showDropdown}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-brand-400 light:text-brand-600">{initials}</span>
                )}
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div
                  id="navbar-dropdown"
                  className="
                    absolute right-0 top-[46px] w-[240px]
                    rounded-2xl overflow-hidden
                    bg-[#13131a]/92 light:bg-white/90
                    backdrop-blur-[24px] saturate-[160%]
                    border border-white/[0.08] light:border-[rgba(200,210,235,0.50)]
                    shadow-[0_12px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]
                    light:shadow-[0_12px_48px_rgba(100,120,180,0.15),inset_0_1px_0_rgba(255,255,255,0.90)]
                    z-[100]
                  "
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] light:border-[rgba(200,210,235,0.30)]">
                    <div className="
                      flex items-center justify-center rounded-full shrink-0
                      w-[38px] h-[38px]
                      bg-brand-600/18 light:bg-brand-600/10
                      border border-brand-500/30
                    ">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-brand-400 light:text-brand-600">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#e8eaf2] light:text-[#0f1523]">{user.name}</p>
                      <p className="truncate text-xs text-[#8b90a7] light:text-[#3d4a6b]">{user.email}</p>
                      {user.role === "ADMIN" && (
                        <span className="
                          inline-block mt-0.5 uppercase
                          text-[9px] font-bold
                          text-brand-400 light:text-brand-600
                          bg-brand-600/15 light:bg-brand-600/10
                          px-2 py-[2px] rounded-full
                          border border-brand-500/30
                        ">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {[
                      { label: "My Progress", href: "/progress" },
                      { label: "History", href: "/history" },
                      { label: "My Library", href: "/library" },
                      ...(user.role === "ADMIN" ? [{ label: "Admin Panel", href: "/admin/channels" }] : []),
                    ].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)}>
                        <div className="
                          px-4 py-2.5 cursor-pointer transition-colors text-[13px]
                          text-[#e8eaf2] light:text-[#0f1523]
                          hover:bg-white/[0.05] light:hover:bg-brand-600/[0.06]
                        ">
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div className="py-1 border-t border-white/[0.06] light:border-[rgba(200,210,235,0.30)]">
                    <button
                      onClick={async () => { await logout(); setShowDropdown(false); router.push("/auth/login"); }}
                      className="
                        w-full text-left px-4 py-2.5 transition-colors text-[13px]
                        text-red-400 light:text-red-600
                        hover:bg-red-500/[0.08]
                      "
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Sign In button (logged out state) */
          <Link href="/auth/login">
            <button
              id="navbar-signin-btn"
              className="
                flex items-center gap-1.5 rounded-full h-9 px-4
                border-[1.5px] border-brand-600/45 light:border-brand-500/40
                bg-brand-600/8 light:bg-brand-600/7
                text-brand-400 light:text-brand-600
                text-[13px] font-semibold
                backdrop-blur-md
                transition-all duration-200
                hover:bg-brand-600/15 hover:border-brand-400/60
                hover:shadow-glow-blue
                light:hover:bg-brand-600/12 light:hover:text-brand-700
              "
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Sign In
            </button>
          </Link>
        )}
      </div>
    </header>
  );
}
