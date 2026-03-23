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
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] md:flex">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white shadow-lg">
            <Hexagon size={24} className="fill-current" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-white leading-tight">ChemSAGE</h1>
            <p className="text-[13px] font-medium text-slate-400">Chemistry workspace</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-r-lg border-l-[3px] px-3 py-3 transition-all duration-200",
                isActive
                  ? "border-blue-500 bg-blue-500/10 font-medium text-blue-400"
                  : "border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[15px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-4">
        {profile?.role === "admin" ? (
          <Link href="/admin" className="mb-3 flex items-center gap-2 rounded-2xl bg-slate-800/80 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
            <Shield size={16} /> Admin panel
          </Link>
        ) : null}
        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/80"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
