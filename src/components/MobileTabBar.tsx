"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#0f172a] pb-safe md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors",
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200",
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium whitespace-nowrap">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
