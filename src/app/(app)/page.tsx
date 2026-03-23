"use client";

import Link from "next/link";
import { Bookmark, Calendar, ChevronRight, FileText, Folder, MessageSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import { useAuth } from "@/providers/AuthProvider";

const delays = ["delay-0", "delay-75", "delay-100", "delay-150", "delay-200", "delay-300"];

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  const modules = [
    {
      title: "Study Vault",
      description: "Access curated notes, premium assets, and laboratory resources",
      icon: Folder,
      gradient: "from-emerald-500 to-teal-600",
      shadowColor: "shadow-emerald-500/20",
      href: "/vault",
    },
    {
      title: "Exam Archive",
      description: "Review historic question papers and high-yield assessment materials",
      icon: FileText,
      gradient: "from-purple-500 to-violet-600",
      shadowColor: "shadow-purple-500/20",
      href: "/archive",
    },
    {
      title: "Schedule Manager",
      description: "Track class timings and monitor your academic sessions",
      icon: Calendar,
      gradient: "from-orange-500 to-amber-600",
      shadowColor: "shadow-orange-500/20",
      href: "/schedule",
    },
    {
      title: "Network Hub",
      description: "Collaborate and synchronize with your academic peer group in real-time",
      icon: MessageSquare,
      gradient: "from-blue-500 to-indigo-600",
      shadowColor: "shadow-blue-500/20",
      href: "/hub",
    },
    {
      title: "Synergy Groups",
      description: "Coordinate advanced study sessions and group projects",
      icon: Users,
      gradient: "from-pink-500 to-rose-600",
      shadowColor: "shadow-pink-500/20",
      href: "/groups",
    },
    {
      title: "Task Terminal",
      description: "Optimize your workflow with prioritized assignment tracking",
      icon: Bookmark,
      gradient: "from-indigo-500 to-blue-600",
      shadowColor: "shadow-indigo-500/20",
      href: "/tasks",
    },
  ];

  if (loading) return <LoadingCard />;
  if (!profile) return <LockedScreen title="Profile missing" description="We couldn't load your ChemSAGE profile." />;
  if (profile.status === "pending") {
    return <LockedScreen title="Account pending approval" description="Your account has been created, but an administrator still needs to approve it before you can access the portal." />;
  }
  if (profile.status === "banned") {
    return <LockedScreen title="Account disabled" description="This account is currently banned. Please contact the chemistry department admin for clarification." />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      <PageHeader title={`Hey, ${profile.name.split(" ")[0]} 👋`} description="Your chemistry workspace is now backed by live Supabase data and session-aware access control." profile={profile} />

      <div className="mb-6 animate-slide-up delay-100">
        <h2 className="text-xl font-bold text-slate-100">Modules</h2>
        <p className="mt-1 text-sm text-slate-400">Quickly jump into the tools you use most.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, index) => (
          <Link
            key={mod.title}
            href={mod.href}
            className={`group flex animate-slide-up flex-col overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/60 hover:bg-slate-900/60 hover:shadow-xl hover:shadow-blue-950/20 ${delays[index] || ""}`}
          >
            <div className="flex-1 p-6">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white shadow-lg ${mod.shadowColor} transition-transform duration-300 group-hover:scale-110`}>
                <mod.icon size={22} strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{mod.title}</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-400">{mod.description}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/50 bg-white/[0.02] px-6 py-4 transition-colors group-hover:bg-white/[0.04]">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 transition-colors group-hover:text-slate-300">OPEN MODULE</span>
              <ChevronRight size={16} className="text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
