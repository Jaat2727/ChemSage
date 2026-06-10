"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Shield, Terminal, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { navItems } from "./navItems";
import { useAuth } from "@/providers/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

function NavItem({ item, collapsed }: { item: (typeof navItems)[0]; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.name : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-[var(--duration-default)]",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-[var(--bg-subtle)] text-[var(--accent)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)]",
      )}
    >
      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)] transition-[width] duration-[var(--duration-medium)] ease-out md:flex",
        collapsed ? "w-[var(--sidebar-compact)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-3", collapsed && "justify-center px-2")}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-1">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-overlay)] p-1.5 text-[var(--accent)]">
              <Terminal size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--fg-default)]">ChemSAGE</h1>
              <p className="text-caption text-[var(--fg-faint)]">v2.0 Workspace</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-overlay)] p-1.5 text-[var(--accent)]">
            <Terminal size={16} />
          </div>
        )}
        {!collapsed && <NotificationBell />}
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-overline text-[var(--fg-faint)]">Navigation</p>
        </div>
      )}

      {/* Nav items */}
      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto px-2", collapsed ? "pt-3" : "pt-1")}>
        {navItems.map((item) => (
          <NavItem key={item.name} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className={cn("space-y-2 border-t border-[var(--border-default)] p-2", collapsed && "px-1.5")}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] p-2 text-[var(--fg-faint)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)]"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-caption">Collapse</span>}
        </button>

        {profile?.role === "admin" ? (
          <Link
            href="/admin"
            title={collapsed ? "Admin Panel" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-muted)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--error)] transition-colors hover:bg-[rgba(248,113,113,0.18)]",
              collapsed && "justify-center px-0",
            )}
          >
            <Shield size={16} className="shrink-0" />
            {!collapsed && "Admin Panel"}
          </Link>
        ) : null}

        {profile && (
          <Link
            href={`/profile/${profile.id}`}
            title={collapsed ? "My Profile" : undefined}
            className={cn(
              "flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-overlay)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--fg-default)] transition-colors hover:bg-[var(--bg-subtle)]",
              collapsed && "justify-center px-0",
            )}
          >
            <User size={16} className="shrink-0" />
            {!collapsed && "My Profile"}
          </Link>
        )}

        <button
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--error-border)] bg-[var(--error-muted)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--error)] transition-colors hover:bg-[rgba(248,113,113,0.18)]",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
