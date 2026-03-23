"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xl pb-safe md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 transition-all duration-200",
                isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300 active:scale-95",
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
      </div>
    </nav>
  );
}
