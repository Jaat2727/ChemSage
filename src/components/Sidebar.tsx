"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Shield, Terminal } from "lucide-react";
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
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-[var(--surface-soft)] text-[var(--accent)]"
          : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-white",
      )}
    >
      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      <span>{item.name}</span>
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] p-4 md:flex">
      <div className="mb-6 flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 text-[var(--accent)]">
            <Terminal size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">ChemSAGE</h1>
            <p className="text-[11px] font-medium text-[var(--muted)]">v1.0 Workspace</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      <div className="mb-3 px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Navigation</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-1">
        {navItems.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-950/60"
          >
            <Shield size={16} /> Admin Panel
          </Link>
        ) : null}

        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--surface-soft)]"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
