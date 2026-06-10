"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, X } from "lucide-react";
import { navItems } from "./navItems";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryItems = useMemo(() => navItems.slice(0, 4), []);
  const moreItems = useMemo(() => navItems.slice(4), []);

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-[60px] left-3 right-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-overlay)] p-3 shadow-xl animate-sheet-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-overline text-[var(--fg-faint)]">More Options</p>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-[var(--fg-faint)] hover:text-[var(--fg-default)]">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[0.8125rem] font-medium",
                      isActive
                        ? "bg-[var(--bg-subtle)] text-[var(--accent)]"
                        : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)]",
                    )}
                  >
                    <item.icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                    {item.name}
                  </Link>
                );
              })}
              
              {profile && (
                <div className="border-t border-[var(--border-default)] mt-2 pt-2">
                  <Link
                    href={`/profile/${profile.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[0.8125rem] font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)]"
                  >
                    <User size={18} strokeWidth={1.8} />
                    My Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-default)] bg-[var(--bg-base)] pb-safe md:hidden">
        <div className="grid h-14 grid-cols-5">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-[var(--accent)]" : "text-[var(--fg-faint)] hover:text-[var(--fg-default)]",
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              menuOpen || moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                ? "text-[var(--accent)]"
                : "text-[var(--fg-faint)] hover:text-[var(--fg-default)]",
            )}
          >
            <Menu size={20} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
