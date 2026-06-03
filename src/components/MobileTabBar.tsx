"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { navItems } from "./navItems";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryItems = useMemo(() => navItems.slice(0, 4), []);
  const moreItems = useMemo(() => navItems.slice(4), []);

  return (
    <>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/80 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-16 left-3 right-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg shadow-black/50"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">More Options</p>
            <div className="space-y-0.5">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive
                        ? "bg-[var(--surface-soft)] text-[var(--accent)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white",
                    )}
                  >
                    <item.icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)] pb-safe md:hidden">
        <div className="grid h-15 grid-cols-5">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-white",
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
              "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              menuOpen || moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                ? "text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-white",
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
