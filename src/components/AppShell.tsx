"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileTabBar } from "@/components/MobileTabBar";
import { AppRouteGate } from "@/components/auth/RouteGate";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppRouteGate>
      <div className="flex min-h-screen w-full bg-transparent text-slate-100">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="glass glass-border sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden">
            <h1 className="text-sm font-semibold tracking-[0.18em] text-slate-200">CHEMSAGE</h1>
            <NotificationBell />
          </header>

          <div className="mx-auto mb-16 w-full max-w-6xl flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 md:mb-0 md:px-8 md:py-8 pb-safe">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar />
    </AppRouteGate>
  );
}
