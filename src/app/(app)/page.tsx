"use client";

import Link from "next/link";
import { Bookmark, Calendar, ChevronRight, FileText, Folder, MessageSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  const modules = [
    {
      title: "Study Vault",
      description: "Access curated notes, premium assets, and laboratory resources",
      icon: Folder,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      href: "/vault",
    },
    {
      title: "Exam Archive",
      description: "Review historic question papers and high-yield assessment materials",
      icon: FileText,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      href: "/archive",
    },
    {
      title: "Schedule Manager",
      description: "Track class timings and monitor your academic sessions",
      icon: Calendar,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      href: "/schedule",
    },
    {
      title: "Network Hub",
      description: "Collaborate and synchronize with your academic peer group in real-time",
      icon: MessageSquare,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      href: "/hub",
    },
    {
      title: "Synergy Groups",
      description: "Coordinate advanced study sessions and group projects",
      icon: Users,
      iconColor: "text-pink-500",
      iconBg: "bg-pink-500/10",
      href: "/groups",
    },
    {
      title: "Task Terminal",
      description: "Optimize your workflow with prioritized assignment tracking",
      icon: Bookmark,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-500/10",
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

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100">Modules</h2>
        <p className="mt-1 text-sm text-slate-400">Quickly jump into the tools you use most.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link key={mod.title} href={mod.href} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]/70 transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/10">
            <div className="flex-1 p-6">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${mod.iconBg}`}>
                <mod.icon className={mod.iconColor} size={24} strokeWidth={2.5} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{mod.title}</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-400">{mod.description}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/30 px-6 py-4 transition-colors group-hover:bg-slate-900/50">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 transition-colors group-hover:text-slate-300">OPEN MODULE</span>
              <ChevronRight size={16} className="text-slate-500 transition-colors group-hover:translate-x-1 group-hover:text-slate-200" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
