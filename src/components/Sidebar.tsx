"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Hexagon, LogOut, Shield } from "lucide-react";
import { navItems } from "./navItems";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl md:flex">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 text-white shadow-lg shadow-blue-500/25">
            <Hexagon size={22} className="fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">ChemSAGE</h1>
            <p className="text-[12px] font-medium text-slate-500">Chemistry workspace</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200",
                isActive
                  ? "bg-blue-500/10 font-semibold text-blue-400 shadow-sm shadow-blue-500/5"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                isActive ? "bg-blue-500/15 text-blue-400" : "text-slate-500",
              )}>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[14px]">{item.name}</span>
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800/80 p-3">
        {profile?.role === "admin" ? (
          <Link href="/admin" className="mb-2 flex items-center gap-2.5 rounded-xl bg-red-500/[0.08] px-3.5 py-3 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/[0.12]">
            <Shield size={16} /> Admin panel
          </Link>
        ) : null}
        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 px-3 py-3 text-sm font-semibold text-slate-400 transition-all duration-200 hover:border-slate-700 hover:bg-white/[0.03] hover:text-slate-200 active:scale-[0.98]"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
