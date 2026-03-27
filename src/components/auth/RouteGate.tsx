"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingCard } from "@/components/ui/Feedback";

export function AppRouteGate({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // Pending/banned users can only see the root page (which shows LockedScreen)
    if (profile && (profile.status === "pending" || profile.status === "banned") && pathname !== "/") {
      router.replace("/");
    }
  }, [loading, pathname, profile, router, session]);

  if (loading) {
    return <LoadingCard />;
  }

  if (!session) {
    return <LoadingCard title="Redirecting to login..." />;
  }

  return <>{children}</>;
}

export function AuthRouteGate({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Only redirect to app if user is logged in AND approved (active)
    if (session && profile?.status === "active") {
      router.replace("/");
    }
    // If session exists but profile is pending/banned, stay on auth pages
    // This happens when they sign in and get redirected back from login page
  }, [loading, profile?.status, router, session]);

  if (loading) {
    return <LoadingCard />;
  }

  return <>{children}</>;
}
