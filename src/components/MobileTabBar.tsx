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
        <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="glass glass-border absolute bottom-20 left-3 right-3 rounded-2xl p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 px-1 text-xs uppercase tracking-[0.14em] text-slate-500">More</p>
            <div className="space-y-1">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      isActive ? "bg-slate-800 text-slate-100" : "text-slate-300 hover:bg-slate-900",
                    )}
                  >
                    <item.icon size={17} strokeWidth={isActive ? 2.3 : 2} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="glass glass-border fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
        <div className="grid h-15 grid-cols-5">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px]",
                  isActive ? "text-slate-100" : "text-slate-500",
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span>{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px]",
              menuOpen || moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                ? "text-slate-100"
                : "text-slate-500",
            )}
          >
            <Menu size={18} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
