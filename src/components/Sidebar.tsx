"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";
import { Hexagon } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] border-r border-slate-800 h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
            <Hexagon size={24} className="fill-current" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-white leading-tight">ChemSAGE</h1>
            <p className="text-[13px] text-slate-400 font-medium">Chemistry workspace</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-r-lg border-l-[3px] transition-all duration-200 ${
                isActive
                  ? "bg-blue-500/10 text-blue-400 border-blue-500 font-medium"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[15px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
