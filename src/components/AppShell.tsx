"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileTabBar } from "@/components/MobileTabBar";
import { AppRouteGate } from "@/components/auth/RouteGate";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/providers/AuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  return (
    <AppRouteGate>
      <div className="flex min-h-screen w-full bg-[var(--background)] text-white">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
            <h1 className="text-base font-bold tracking-tight text-white">ChemSAGE</h1>
            <NotificationBell />
          </header>

          <div className="mx-auto mb-16 w-full max-w-6xl flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:mb-0 md:px-10 md:py-10 pb-safe">
            {children}
          </div>

          {/* Status bar - desktop only */}
          <footer className="hidden border-t border-[var(--border)] bg-[var(--background)] px-4 py-1.5 md:flex md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted)]">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
                {`> status: connected`}
              </span>
              {profile && (
                <span className="font-mono text-[11px] text-[var(--muted)]">
                  {`> user: ${profile.roll_no}`}
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-[var(--muted)]">ChemSAGE // v1.0</span>
          </footer>
        </main>
      </div>
      <MobileTabBar />
    </AppRouteGate>
  );
}
