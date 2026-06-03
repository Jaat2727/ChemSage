"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Calendar, FileText, Folder, MessageSquare, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import { useAuth } from "@/providers/AuthProvider";

const workspaceCards = [
  { title: "Resource Vault", description: "Notes, lab references, and curated study material.", href: "/vault", icon: Folder },
  { title: "Past Papers", description: "Browse previous exam papers and revision archives.", href: "/archive", icon: FileText },
  { title: "Class Planner", description: "Weekly class timings and lab slots organized.", href: "/schedule", icon: Calendar },
  { title: "Direct Chats", description: "One-to-one messaging and community chat.", href: "/hub", icon: MessageSquare },
  { title: "Study Circles", description: "Join focused group rooms for discussions.", href: "/groups", icon: Users },
  { title: "Task Board", description: "Track assignments and keep your work queue clean.", href: "/tasks", icon: Bookmark },
];

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingCard />;
  if (!profile) return <LockedScreen title="Profile missing" description="We couldn't load your ChemSAGE profile." />;
  if (profile.status === "pending") {
    return <LockedScreen title="Account pending approval" description="Your account has been created, but an administrator still needs to approve it." />;
  }
  if (profile.status === "banned") {
    return <LockedScreen title="Account disabled" description="This account is currently banned. Contact the chemistry department admin." />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-12">
      <PageHeader
        title={`Welcome back, ${profile.name.split(" ")[0]}`}
        description="Everything you need for chemistry coursework, collaboration, and planning lives here."
        profile={profile}
      />

      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">PROGRAMME</p>
          <p className="mt-1 font-mono text-lg font-bold text-white">{profile.programme}</p>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">BATCH</p>
          <p className="mt-1 font-mono text-lg font-bold text-white">{profile.batch_year}</p>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">STATUS</p>
          <p className="mt-1 font-mono text-lg font-bold text-[var(--accent)]">{`> active`}</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-mono text-xl font-bold text-white">workspace_sections</h2>
            <p className="font-mono text-sm text-[var(--muted)]">{`// Tap a section to continue where you left off.`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaceCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)] hover:bg-[var(--surface-soft)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--background)] text-[var(--muted)] transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                <card.icon size={18} />
              </div>
              <h3 className="font-mono text-base font-bold text-white">{card.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{card.description}</p>
              <div className="mt-4 flex items-center gap-1 font-mono text-xs text-[var(--muted)] transition-colors group-hover:text-[var(--accent)]">
                {`open()`} <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
