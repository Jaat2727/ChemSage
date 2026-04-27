"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Hexagon, LogOut, Shield } from "lucide-react";
import { navItems } from "./navItems";
import { useAuth } from "@/providers/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

function NavItem({ item }: { item: (typeof navItems)[0] }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        isActive ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
      )}
    >
      <item.icon size={17} strokeWidth={isActive ? 2.3 : 2} />
      <span className="font-medium">{item.name}</span>
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <aside className="glass glass-border hidden h-screen w-64 shrink-0 flex-col p-3 md:flex">
      <div className="mb-2 flex items-center justify-between rounded-xl px-2 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-100">
            <Hexagon size={18} className="fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-[0.16em] text-slate-100">CHEMSAGE</h1>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-1 py-2">
        {navItems.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-800 px-1 pt-3">
        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/60"
          >
            <Shield size={14} /> Admin panel
          </Link>
        ) : null}

        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
