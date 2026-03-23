"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileTabBar } from "@/components/MobileTabBar";
import { AppRouteGate } from "@/components/auth/RouteGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppRouteGate>
      <Sidebar />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="absolute left-0 right-0 top-0 z-40 flex h-16 items-center border-b border-slate-800/60 bg-slate-950/80 px-5 backdrop-blur-xl md:hidden">
          <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">ChemSAGE</h1>
        </header>
        <div className="mb-16 mt-16 flex-1 overflow-y-auto p-5 md:mb-0 md:mt-0 md:p-8">{children}</div>
      </main>
      <MobileTabBar />
    </AppRouteGate>
  );
}
