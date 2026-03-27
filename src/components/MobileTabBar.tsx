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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-20 left-3 right-3 rounded-3xl border border-slate-800/70 bg-slate-950/95 p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 px-2 pt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">More sections</div>
            <div className="grid grid-cols-1 gap-2">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
                      isActive ? "bg-blue-500/10 text-blue-400" : "text-slate-300 [@media(hover:hover)]:hover:bg-white/[0.04] active:bg-white/[0.1]",
                    )}
                  >
                    <item.icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xl pb-safe md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-200",
                  isActive ? "text-blue-400" : "text-slate-500 [@media(hover:hover)]:hover:text-slate-300 active:scale-95",
                )}
              >
                <div className="relative">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <div className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
                  )}
                </div>
                <span className={cn("text-[10px] whitespace-nowrap", isActive ? "font-semibold" : "font-medium")}>{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-200",
              menuOpen || moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                ? "text-blue-400"
                : "text-slate-500 [@media(hover:hover)]:hover:text-slate-300 active:scale-95",
            )}
          >
            <div className="relative">
              <Menu size={20} strokeWidth={2} />
              {(menuOpen || moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))) && (
                <div className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
              )}
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
