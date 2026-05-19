"use client";
// ─────────────────────────────────────────────────────────────────
// Protected route — redirects unauthenticated or un-onboarded users
// ─────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean; // default true
}

export default function ProtectedRoute({
  children,
  requireOnboarding = true,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (requireOnboarding && user && !user.hasOnboarded) {
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, requireOnboarding, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#3ea6ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) return null;

  // Need onboarding
  if (requireOnboarding && user && !user.hasOnboarded) return null;

  return <>{children}</>;
}
