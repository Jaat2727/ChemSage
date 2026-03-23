import { Folder, FileText, Calendar, MessageSquare, Users, Bookmark, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const modules = [
    {
      title: "Study Vault",
      description: "Access curated notes, premium assets, and laboratory resources",
      icon: Folder,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      href: "/vault"
    },
    {
      title: "Exam Archive",
      description: "Review historic question papers and high-yield assessment materials",
      icon: FileText,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      href: "/archive"
    },
    {
      title: "Schedule Manager",
      description: "Track class timings and monitor your academic sessions",
      icon: Calendar,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      href: "/schedule"
    },
    {
      title: "Network Hub",
      description: "Collaborate and synchronize with your academic peer group in real-time",
      icon: MessageSquare,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      href: "/hub"
    },
    {
      title: "Synergy Groups",
      description: "Coordinate advanced study sessions and group projects",
      icon: Users,
      iconColor: "text-pink-500",
      iconBg: "bg-pink-500/10",
      href: "/groups"
    },
    {
      title: "Task Terminal",
      description: "Optimize your workflow with prioritized assignment tracking",
      icon: Bookmark,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-500/10",
      href: "/tasks"
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Hey, John <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h1>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
          <span className="text-sm font-bold text-blue-700 dark:text-blue-400 tracking-wide">
            BS • 2025
          </span>
        </div>
      </div>

      {/* Modules Intro */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Modules</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Quickly jump into the tools you use most.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, idx) => (
          <Link 
            href={mod.href} 
            key={idx}
            className="group flex flex-col bg-white dark:bg-[#0f172a]/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:shadow-blue-900/5 transition-all duration-200"
          >
            <div className="p-6 flex-1">
              <div className={`w-12 h-12 rounded-2xl ${mod.iconBg} flex items-center justify-center mb-5`}>
                <mod.icon className={mod.iconColor} size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {mod.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {mod.description}
              </p>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 transition-colors">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                OPEN MODULE
              </span>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
