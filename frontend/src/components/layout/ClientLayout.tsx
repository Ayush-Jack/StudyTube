"use client";
import { useSidebarStore } from "@/store";
import { AuthProvider } from "@/context/AuthContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebarStore();
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0e0e12] light:bg-[#f0f2f8] transition-colors duration-300">
        {children}
      </div>
    </AuthProvider>
  );
}