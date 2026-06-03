import Link from "next/link";
import {
  ArrowRight, FlaskConical, ShieldCheck, CheckCircle2, BookOpen, FileText,
  Users, CalendarClock, Lock, ChevronRight, GraduationCap, BadgeCheck,
  FolderOpen, MessageSquare, ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[var(--accent)] selection:text-black font-sans">

      {/* ─── Navigation ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#050505]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
              <FlaskConical size={15} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight">ChemSAGE</span>
          </div>
          <Link href="/login" className="rounded-md bg-white/[0.08] px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/[0.14] active:scale-95">
            Access Workspace
          </Link>
        </div>
      </header>

      <main className="flex flex-col">

        {/* ═══ HERO ══════════════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16 sm:py-20">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-[var(--accent)]/[0.03] blur-[120px]" />

          <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            {/* 1. Private Academic Workspace badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 sm:text-[11px]">
              <Lock size={12} className="text-[var(--accent)]" />
              Private Academic Workspace
            </div>

            {/* 2. Headline */}
            <h1 className="mb-5 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-black leading-[1.1] tracking-tight">
              The academic operating system for{" "}
              <span className="text-[var(--accent)]">IITM Chemistry.</span>
            </h1>

            {/* 3. Problem statement & 4. Supporting description */}
            <div className="mb-8 max-w-2xl text-[clamp(0.95rem,2vw,1.125rem)] font-medium leading-relaxed text-gray-400">
              <p className="mb-1 text-white">Stop searching through WhatsApp groups.</p>
              <p>
                A private workspace for verified IIT Madras BS Chemistry students.
                Access notes, past papers, schedules, study circles, and academic resources in one trusted environment.
              </p>
            </div>

            {/* 5. Trust indicators */}
            <div className="mb-10 flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-bold text-gray-400 sm:text-xs">
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 size={14} className="text-[var(--accent)]" /> Verified IITM Students Only</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 size={14} className="text-[var(--accent)]" /> Faculty Approved Resources</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap"><CheckCircle2 size={14} className="text-[var(--accent)]" /> Private Academic Community</span>
            </div>

            {/* 6. CTA */}
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link href="/login" className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-[#bce600] active:scale-[0.97] sm:w-auto">
                Access Workspace
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#why" className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-transparent px-8 py-3.5 text-sm font-bold text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white sm:w-auto">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* ─── Cohort Badges ────────────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.04] py-10 px-6">
          <div className="mx-auto max-w-3xl">
            <p className="mb-5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Active Cohorts</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "BS Chemistry 2024", icon: GraduationCap },
                { label: "BS Chemistry 2025", icon: GraduationCap },
                { label: "BS Chemistry 2026", icon: GraduationCap },
                { label: "Faculty Contributors", icon: BadgeCheck },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-bold text-gray-400">
                  <c.icon size={13} className="text-[var(--accent)]" />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 1: Why ChemSAGE Exists ═══════════════════════════════════ */}
        <section id="why" className="py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 max-w-2xl mx-auto text-center">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">The Problem</p>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Academic resources should not be buried in chats.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Before */}
              <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-8">
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">Before ChemSAGE</p>
                <ul className="space-y-4">
                  {[
                    "WhatsApp groups with 500+ unread messages",
                    "PDFs lost in chat history",
                    "Missing deadlines from scattered sources",
                    "Notes shared once, never found again",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* After */}
              <div className="rounded-2xl border border-[var(--accent)]/10 bg-[var(--accent)]/[0.02] p-8">
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">With ChemSAGE</p>
                <ul className="space-y-4">
                  {[
                    "Central repository with structured access",
                    "Verified, version-tracked resources",
                    "Searchable archive of every past paper",
                    "Organized academic planning and deadlines",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 2: Membership ════════════════════════════════════════════ */}
        <section className="py-24 px-6 border-y border-white/[0.04]">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 max-w-2xl mx-auto text-center">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Membership</p>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl mb-4">
                Access is restricted.
              </h2>
              <p className="text-base text-gray-400 leading-relaxed">
                Only verified IIT Madras BS Chemistry students and approved faculty can join ChemSAGE.
                Every account is validated before access is granted.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {[
                { title: "Verified Student", desc: "IITM roll number validated against official records", icon: ShieldCheck, color: "text-[var(--accent)]", border: "border-[var(--accent)]/15", bg: "bg-[var(--accent)]/[0.03]" },
                { title: "Verified Faculty", desc: "Approved by admin with elevated contribution access", icon: BadgeCheck, color: "text-blue-400", border: "border-blue-400/15", bg: "bg-blue-400/[0.03]" },
                { title: "Admin", desc: "Full platform governance and moderation capabilities", icon: Lock, color: "text-amber-400", border: "border-amber-400/15", bg: "bg-amber-400/[0.03]" },
              ].map((role) => (
                <div key={role.title} className={`rounded-2xl border ${role.border} ${role.bg} p-6 text-center`}>
                  <div className={`mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${role.border} ${role.color}`}>
                    <role.icon size={20} />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-white">{role.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: Everything In One Workspace ═══════════════════════════ */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 max-w-2xl mx-auto text-center">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Workspace</p>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Everything in one workspace.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { title: "Resource Vault", desc: "Community-maintained notes, assignments, lab reports, and references. Version-tracked with ownership and permissions.", icon: FolderOpen, color: "text-[var(--accent)]" },
                { title: "Digital Library", desc: "Structured archive of quizzes, mid-sems, and end-sems. Searchable by subject, year, semester, and faculty.", icon: FileText, color: "text-blue-400" },
                { title: "Study Circles", desc: "Collaborative spaces for course discussions, group preparation, and real-time academic chat.", icon: MessageSquare, color: "text-purple-400" },
                { title: "Planner", desc: "Schedules, deadlines, and weekly academic planning. See your full week at a glance.", icon: CalendarClock, color: "text-amber-400" },
              ].map((f) => (
                <div key={f.title} className="group rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 transition-colors hover:bg-white/[0.03] hover:border-white/[0.1]">
                  <f.icon size={22} className={`${f.color} mb-5`} />
                  <h3 className="mb-2 text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 4: Built For The Cohort ══════════════════════════════════ */}
        <section className="py-24 px-6 border-y border-white/[0.04]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Community</p>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl mb-5">
              Created by students. Used by students.
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-base text-gray-400 leading-relaxed">
              ChemSAGE was built specifically for the IITM BS Chemistry community to solve real academic workflow problems.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] font-bold text-gray-500">
              {[
                "No generic LMS",
                "No advertisements",
                "No public users",
                "Only the chemistry community",
              ].map((item, i) => (
                <span key={item} className="flex items-center gap-2">
                  {i > 0 && <span className="hidden sm:block text-white/10">·</span>}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 5: Final CTA ═════════════════════════════════════════════ */}
        <section className="py-28 px-6">
          <div className="relative mx-auto max-w-3xl text-center">
            {/* Subtle glow */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-[var(--accent)]/[0.04] blur-[100px]" />

            <div className="relative">
              <h2 className="mb-4 text-3xl font-black tracking-tight text-white md:text-4xl">
                Join the IITM Chemistry workspace.
              </h2>
              <p className="mx-auto mb-10 max-w-md text-base text-gray-400 leading-relaxed">
                Access verified resources, collaborate with peers, and stay organized throughout your degree.
              </p>
              <Link href="/login" className="group inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-8 py-4 text-sm font-bold text-black transition-all hover:bg-[#bce600] active:scale-[0.97]">
                Access Workspace
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Footer ───────────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.04] py-10 px-6">
          <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5 text-gray-500">
              <FlaskConical size={14} />
              <span className="text-xs font-bold">ChemSAGE</span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-600">Private Academic Platform</span>
            </div>
            <div className="flex items-center gap-6 text-[11px] font-bold text-gray-600">
              <span>IIT Madras BS Chemistry Community</span>
              <span className="flex items-center gap-1.5 text-gray-500">
                <Lock size={10} /> Verified Access Only
              </span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
