"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";

export function AppRouteGate({ children }: { children: React.ReactNode }) {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return <LoadingCard />;
  }

  // Next.js Middleware handles unauth protection, 
  // return null to prevent flash of content
  if (!session) {
    return null;
  }

  if (profile && profile.status === "pending") {
    return <LockedScreen title="Account pending approval" description="Your account has been created, but an administrator still needs to approve it." />;
  }

  if (profile && profile.status === "banned") {
    return <LockedScreen title="Account disabled" description="This account is currently banned. Contact the chemistry department admin." />;
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
      router.replace("/vault");
    }
    // If session exists but profile is pending/banned, stay on auth pages
    // This happens when they sign in and get redirected back from login page
  }, [loading, profile?.status, router, session]);

  if (loading) {
    return <LoadingCard />;
  }

  return <>{children}</>;
}
