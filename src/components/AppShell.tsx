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
      <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] text-white">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="shrink-0 sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 md:hidden">
            <h1 className="text-base font-bold tracking-tight text-white">ChemSAGE</h1>
            <NotificationBell />
          </header>

          <div className="mx-auto w-full max-w-[1440px] flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-12 md:py-12 pb-24 md:pb-12">
            {children}
          </div>

          {/* Status bar - desktop only */}
          <footer className="hidden shrink-0 border-t border-[var(--border)] bg-[var(--background)] px-4 py-1.5 md:flex md:items-center md:justify-between z-10">
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
