"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Calendar, FileText, Folder, MessageSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import { useAuth } from "@/providers/AuthProvider";

const workspaceCards = [
  {
    title: "Resource Vault",
    description: "Notes, lab references, and curated study material in one place.",
    href: "/vault",
    icon: Folder,
  },
  {
    title: "Past Papers",
    description: "Browse previous exam papers and revision-oriented archives.",
    href: "/archive",
    icon: FileText,
  },
  {
    title: "Class Planner",
    description: "Keep weekly class timings and lab slots organized.",
    href: "/schedule",
    icon: Calendar,
  },
  {
    title: "Direct Chats",
    description: "One-to-one messaging and community chat with peers.",
    href: "/hub",
    icon: MessageSquare,
  },
  {
    title: "Study Circles",
    description: "Join focused group rooms for discussions and planning.",
    href: "/groups",
    icon: Users,
  },
  {
    title: "Task Board",
    description: "Track assignments and keep your work queue clean.",
    href: "/tasks",
    icon: Bookmark,
  },
];

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingCard />;
  if (!profile) return <LockedScreen title="Profile missing" description="We couldn't load your ChemSAGE profile." />;
  if (profile.status === "pending") {
    return <LockedScreen title="Account pending approval" description="Your account has been created, but an administrator still needs to approve it before you can access the portal." />;
  }
  if (profile.status === "banned") {
    return <LockedScreen title="Account disabled" description="This account is currently banned. Please contact the chemistry department admin for clarification." />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <PageHeader
        title={`Welcome back, ${profile.name.split(" ")[0]}`}
        description="Everything you need for chemistry coursework, collaboration, and planning lives here."
        profile={profile}
      />

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Programme</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{profile.programme}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Batch</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{profile.batch_year}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">Active workspace</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Workspace sections</h2>
            <p className="text-sm text-slate-400">Tap a section to continue where you left off.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaceCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-slate-200">
                <card.icon size={18} />
              </div>
              <h3 className="text-base font-semibold text-slate-100">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{card.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-300">
                Open section <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
