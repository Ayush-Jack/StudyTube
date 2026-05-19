"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Tv, Tag, RefreshCw, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { icon: BarChart2, label: "Dashboard", href: "/admin" },
  { icon: Tv, label: "Channels", href: "/admin/channels" },
  { icon: Tag, label: "Categories", href: "/admin/categories" },
  { icon: RefreshCw, label: "Sync Status", href: "/admin/sync" },
  { icon: Users, label: "Users", href: "/admin/users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-[calc(100vh-56px)] ml-0">
      {/* Admin sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-white/[0.07] light:border-[rgba(200,210,235,0.40)] flex flex-col pt-4 bg-[#0b0b10] light:bg-[#f5f6fb]">
        <div className="px-4 mb-4">
          <span className="text-xs font-bold tracking-widest uppercase text-red-400 light:text-red-500">
            Admin Panel
          </span>
        </div>
        <nav className="flex-1">
          {ADMIN_NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm transition-colors cursor-pointer",
                  active
                    ? "bg-brand-600/15 light:bg-brand-100 text-[#e8eaf2] light:text-brand-700 border-l-4 border-brand-500 rounded-l-none ml-0 pl-4"
                    : "text-[#8b90a7] light:text-[#3d4a6b] hover:bg-white/[0.04] light:hover:bg-black/[0.04] hover:text-[#e8eaf2] light:hover:text-[#0f1523]"
                )}>
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/[0.07] light:border-[rgba(200,210,235,0.40)] mt-auto">
          <Link href="/">
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-[#4a4f66] light:text-[#7a86a8] hover:text-[#8b90a7] light:hover:text-[#3d4a6b] transition-colors cursor-pointer">
              <ArrowLeft size={15} /> Back to StudyTube
            </div>
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
