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
        "flex items-center gap-3 px-3 py-2.5 font-mono text-sm transition-all duration-150",
        isActive
          ? "border-l-2 border-[var(--accent)] bg-[var(--surface-soft)] text-[var(--accent)]"
          : "border-l-2 border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface)] hover:text-white",
      )}
    >
      <item.icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
      <span>{item.name}</span>
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] p-4 md:flex">
      <div className="mb-4 flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-2.5">
          <div className="border border-[var(--accent)] p-1.5 text-[var(--accent)]">
            <Terminal size={16} />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-[0.16em] text-white">[ CS ]</h1>
            <p className="font-mono text-[10px] text-[var(--muted)]">ChemSAGE v1.0</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      <div className="mb-2 px-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{`> navigation`}</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto py-1">
        {navItems.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 border border-red-900 bg-red-950/40 px-3 py-2 font-mono text-sm text-red-300 transition-colors hover:bg-red-950/60"
          >
            <Shield size={14} /> admin_panel
          </Link>
        ) : null}

        <button
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 border border-[var(--border)] px-3 py-2 font-mono text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-white"
        >
          <LogOut size={14} /> signOut()
        </button>
      </div>
    </aside>
  );
}
