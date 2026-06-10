import Link from "next/link";
import {
  ArrowRight, FlaskConical, ShieldCheck, CheckCircle2, FileText,
  CalendarClock, Lock, GraduationCap, BadgeCheck,
  FolderOpen, MessageSquare, ClipboardList, Layers, ExternalLink,
  Search, ShieldAlert, ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--fg-default)] selection:bg-[var(--accent)] selection:text-black font-sans antialiased">
      
      {/* ─── Navigation ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] text-[var(--accent)] border border-[rgba(212,255,0,0.15)]">
              <FlaskConical size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[var(--fg-default)]">ChemSAGE</span>
              <span className="text-[9px] font-mono text-[var(--accent)] tracking-wider uppercase -mt-0.5">IIT Madras</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-raised)] px-2.5 py-1 text-[10px] font-mono text-[var(--fg-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Portal Online
            </span>
            <Link 
              href="/login" 
              className="rounded-[var(--radius-md)] bg-white/[0.08] px-4 py-1.5 text-caption font-bold text-[var(--fg-default)] transition-all hover:bg-white/[0.14] hover:border-[var(--border-strong)] active:scale-95 border border-[var(--border-default)]"
            >
              Access Workspace
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">

        {/* ═══ HERO ══════════════════════════════════════════════════════════════ */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-16 sm:pt-24 sm:pb-20 border-b border-[var(--border-subtle)]">
          {/* Subtle accent glow */}
          <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] rounded-full bg-[var(--accent)]/[0.02] blur-[120px]" />

          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-raised)] px-3.5 py-1 text-overline text-[var(--fg-muted)]">
              <Lock size={11} className="text-[var(--accent)]" />
              Private Academic Portal
            </div>

            <h1 className="text-display mb-6 max-w-4xl leading-tight font-black tracking-tight" style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)" }}>
              The private academic ecosystem for <span className="text-[var(--accent)]">IITM Chemistry</span> BS students.
            </h1>

            <div className="mb-10 max-w-2xl text-[15px] leading-relaxed text-[var(--fg-muted)]">
              <p className="mb-4">
                Scattered Google Drive folders, flooded WhatsApp chats, and missing deadlines make academic organization chaotic. 
                ChemSAGE centralizes everything into a secure, peer-moderated environment built specifically for the IIT Madras Chemistry degree.
              </p>
              <p className="text-[11px] font-mono text-[var(--fg-faint)] uppercase tracking-wider">
                🔒 Enforced IITM roll number authorization
              </p>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4 mb-16">
              <Link 
                href="/login" 
                className="group flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-black transition-all hover:bg-[var(--accent-hover)] active:scale-[0.97] sm:w-auto"
              >
                Access Workspace
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a 
                href="#features" 
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-raised)] px-8 py-3.5 text-sm font-bold text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)] sm:w-auto"
              >
                Explore Features
              </a>
            </div>

            {/* Live HTML/CSS Mockup of the Dashboard */}
            <div className="w-full max-w-5xl rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-raised)] p-2 shadow-2xl relative text-left">
              {/* Browser Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-3 rounded-t-[var(--radius-lg)]">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/30" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/30" />
                  <span className="w-3 h-3 rounded-full bg-green-500/30" />
                </div>
                <div className="px-6 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--fg-muted)] w-1/2 text-center truncate select-none">
                  chemsage.iitm.ac.in/dashboard
                </div>
                <div className="w-12" />
              </div>
              
              {/* Simulated Workspace Application */}
              <div className="grid grid-cols-[180px_1fr] bg-[var(--bg-base)] min-h-[380px] rounded-b-[var(--radius-lg)] overflow-hidden text-xs">
                {/* Simulated Sidebar */}
                <div className="border-r border-[var(--border-default)] bg-[var(--bg-raised)] p-3 flex flex-col justify-between select-none">
                  <div className="space-y-4">
                    {/* Brand */}
                    <div className="flex items-center gap-2 px-1">
                      <FlaskConical size={14} className="text-[var(--accent)]" />
                      <span className="font-bold tracking-tight text-[var(--fg-default)]">ChemSAGE</span>
                    </div>
                    
                    {/* Nav Items */}
                    <nav className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)] font-medium">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                          <span>Dashboard</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-white/[0.02] hover:text-[var(--fg-default)] transition-colors">
                        <FolderOpen size={12} />
                        <span>Resource Vault</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-white/[0.02] hover:text-[var(--fg-default)] transition-colors">
                        <FileText size={12} />
                        <span>Digital Library</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-white/[0.02] hover:text-[var(--fg-default)] transition-colors">
                        <MessageSquare size={12} />
                        <span>Study Circles</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-white/[0.02] hover:text-[var(--fg-default)] transition-colors">
                        <CalendarClock size={12} />
                        <span>Class Planner</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-white/[0.02] hover:text-[var(--fg-default)] transition-colors">
                        <ClipboardList size={12} />
                        <span>Task Board</span>
                      </div>
                    </nav>
                  </div>
                  
                  {/* Account Badge */}
                  <div className="border-t border-[var(--border-subtle)] pt-2.5 mt-4 space-y-1">
                    <div className="font-mono text-[9px] text-[var(--fg-muted)] px-1">ROLL: CY25B013</div>
                    <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--success-muted)] border border-[var(--success-border)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--success)] ml-1">
                      <BadgeCheck size={9} /> Verified Student
                    </div>
                  </div>
                </div>
                
                {/* Simulated Main Content */}
                <div className="p-4 bg-[var(--bg-base)] flex flex-col justify-between gap-4">
                  {/* Workspace Subhead */}
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 select-none">
                    <div>
                      <h3 className="font-bold text-[var(--fg-default)] text-sm">Welcome back, Aravind</h3>
                      <p className="text-[9px] text-[var(--fg-muted)]">BS Chemistry (Batch of 2025)</p>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border-default)] text-[9px] text-[var(--fg-faint)] w-36 select-none">
                      <Search size={9} />
                      <span>Search resources...</span>
                    </div>
                  </div>
                  
                  {/* Dashboard Grid */}
                  <div className="grid grid-cols-2 gap-3 grow">
                    {/* Today's Lectures widget */}
                    <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-md)] p-3 flex flex-col justify-between select-none">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1 mb-2">
                        <span className="font-bold text-[var(--fg-default)] text-[10px] uppercase tracking-wider text-[var(--info)] flex items-center gap-1">
                          <CalendarClock size={10} /> Today's Schedule
                        </span>
                        <span className="text-[8px] text-[var(--fg-faint)] font-mono">THU</span>
                      </div>
                      <div className="space-y-1.5 grow flex flex-col justify-center">
                        <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-1.5 rounded-[var(--radius-sm)] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[var(--fg-default)] block text-[10px]">CY1010: Lecture</span>
                            <p className="text-[8px] text-[var(--fg-muted)]">Inorganic (Room 102)</p>
                          </div>
                          <span className="text-[8px] font-mono text-[var(--accent)] shrink-0 bg-[var(--accent-muted)] px-1 py-0.5 rounded">09:00 - 10:15</span>
                        </div>
                        <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-1.5 rounded-[var(--radius-sm)] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[var(--fg-default)] block text-[10px]">CY1020: Lab</span>
                            <p className="text-[8px] text-[var(--fg-muted)]">Quantitative Anal. (Lab B)</p>
                          </div>
                          <span className="text-[8px] font-mono text-[var(--fg-muted)] shrink-0">11:00 - 13:00</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Vault Resources widget */}
                    <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-md)] p-3 flex flex-col justify-between select-none">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1 mb-2">
                        <span className="font-bold text-[var(--fg-default)] text-[10px] uppercase tracking-wider text-[var(--success)] flex items-center gap-1">
                          <FolderOpen size={10} /> Resource Vault
                        </span>
                        <span className="text-[8px] text-[var(--fg-faint)]">Sem II</span>
                      </div>
                      <div className="space-y-1.5 grow flex flex-col justify-center">
                        <div className="flex items-center justify-between hover:bg-white/[0.01] p-1 rounded border border-transparent hover:border-[var(--border-default)]">
                          <span className="truncate pr-2 text-[10px] text-[var(--fg-default)]">📄 Aldol_Mechanism_Notes.pdf</span>
                          <span className="text-[8px] rounded bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success-border)] px-1 py-0.5 shrink-0 font-mono">v1.2</span>
                        </div>
                        <div className="flex items-center justify-between hover:bg-white/[0.01] p-1 rounded border border-transparent hover:border-[var(--border-default)]">
                          <span className="truncate pr-2 text-[10px] text-[var(--fg-default)]">📄 CY1020_Lab_Manual.pdf</span>
                          <span className="text-[8px] rounded bg-[var(--info-muted)] text-[var(--info)] border border-[var(--info-border)] px-1 py-0.5 shrink-0 text-[7px] uppercase font-bold tracking-wider">Faculty</span>
                        </div>
                        <div className="flex items-center justify-between hover:bg-white/[0.01] p-1 rounded border border-transparent hover:border-[var(--border-default)]">
                          <span className="truncate pr-2 text-[10px] text-[var(--fg-default)]">📄 2024_EndSem_Solutions.pdf</span>
                          <span className="text-[8px] rounded bg-white/5 border border-white/10 text-[var(--fg-muted)] px-1 py-0.5 shrink-0 font-mono">EXAM</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Task deadlines widget */}
                    <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-md)] p-3 flex flex-col justify-between select-none">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1 mb-2">
                        <span className="font-bold text-[var(--fg-default)] text-[10px] uppercase tracking-wider text-[var(--warning)] flex items-center gap-1">
                          <ClipboardList size={10} /> Active Deadlines
                        </span>
                        <span className="text-[8px] text-[var(--fg-faint)] font-mono">2 Active</span>
                      </div>
                      <div className="space-y-1.5 grow flex flex-col justify-center">
                        <div className="bg-[var(--bg-base)] border-l-2 border-red-500 p-1.5 rounded-[var(--radius-sm)] flex justify-between items-center">
                          <div>
                            <p className="font-bold text-[var(--fg-default)] text-[10px] leading-tight">CY1020 Lab Report</p>
                            <p className="text-[8px] text-[var(--fg-muted)]">Quantitative error analysis</p>
                          </div>
                          <span className="text-[8px] font-bold text-red-400 px-1 py-0.5 rounded bg-[var(--error-muted)] border border-[var(--error-border)]">In 2 Hours</span>
                        </div>
                        <div className="bg-[var(--bg-base)] border-l-2 border-amber-500 p-1.5 rounded-[var(--radius-sm)] flex justify-between items-center">
                          <div>
                            <p className="font-bold text-[var(--fg-default)] text-[10px] leading-tight">Quiz 1 Prep</p>
                            <p className="text-[8px] text-[var(--fg-muted)]">Solid State Chemistry</p>
                          </div>
                          <span className="text-[8px] font-bold text-amber-400 px-1 py-0.5 rounded bg-[var(--warning-muted)] border border-[var(--warning-border)]">Tomorrow</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Real-time Peer Discussion widget */}
                    <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-md)] p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1 mb-2 select-none">
                        <span className="font-bold text-[var(--fg-default)] text-[10px] uppercase tracking-wider text-purple-400 flex items-center gap-1">
                          <MessageSquare size={10} /> Study Circle Chat
                        </span>
                        <span className="text-[8px] rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1 font-mono">CY1010</span>
                      </div>
                      <div className="space-y-2 grow flex flex-col justify-end text-[9px] max-h-[85px] overflow-hidden pr-1">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-purple-300 flex items-center gap-1">Aravind <span className="text-[7px] text-[var(--fg-faint)] font-normal">09:12 AM</span></span>
                          <p className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-default)] leading-tight">Does anyone have the mechanism for the aldol condensation lab?</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">Meera <span className="text-[7px] text-[var(--fg-faint)] font-normal">09:14 AM</span></span>
                          <p className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-default)] leading-tight">Just uploaded the verified guide to the Vault! Under Sem II folders.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ ACADEMIC STATISTICS ═════════════════════════════════════════════ */}
        <section className="py-20 px-6 bg-[var(--bg-raised)] border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <p className="text-overline text-[var(--accent)] mb-2 font-mono">Portal Activity</p>
              <h2 className="text-h1 tracking-tight" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)" }}>Verified Academic Coverage</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { count: "480+", label: "Academic Resources", desc: "Peer-reviewed lecture notes, quantitative lab guides, and references." },
                { count: "150+", label: "Archived Exam Papers", desc: "Access organized quizzes, mid-semester, and end-semester papers." },
                { count: "24+", label: "Active Study Circles", desc: "Course-specific discussion rooms and active student study forums." },
                { count: "180+", label: "Registered Students", desc: "Chemistry BS undergraduates verified against official enrollment records." }
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-base)] p-6 transition-all hover:border-[var(--border-strong)] flex flex-col justify-between"
                >
                  <div>
                    <div className="text-3xl font-black text-[var(--accent)] tracking-tight mb-2 font-mono select-none">
                      {stat.count}
                    </div>
                    <div className="text-h3 mb-2 font-bold text-[var(--fg-default)]">
                      {stat.label}
                    </div>
                  </div>
                  <p className="text-caption text-[var(--fg-muted)] leading-relaxed mt-2 border-t border-[var(--border-subtle)] pt-3">
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CORE FEATURES ════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 px-6 border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 max-w-2xl">
              <p className="mb-2 text-overline text-[var(--accent)] font-mono">Academic Infrastructure</p>
              <h2 className="text-display tracking-tight mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
                Core Platform Components
              </h2>
              <p className="text-body text-[var(--fg-muted)] leading-relaxed">
                ChemSAGE maps directly to the actual rhythm of your academic coursework. 
                Instead of scattered links and noise, manage your education in five structured modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: "Resource Vault", 
                  desc: "A centralized folder structure for student-contributed lecture slides, reference readings, and lab worksheets. Complete with version control and file owners.",
                  icon: FolderOpen, 
                  color: "text-[var(--success)]",
                  bg: "bg-[var(--success-muted)]",
                  border: "border-[var(--success-border)]"
                },
                { 
                  title: "Digital Library", 
                  desc: "A structured archive of quizzes, mid-sems, and end-sems. Searchable by course code, academic year, and professor to help target preparation.",
                  icon: FileText, 
                  color: "text-[var(--info)]",
                  bg: "bg-[var(--info-muted)]",
                  border: "border-[var(--info-border)]"
                },
                { 
                  title: "Study Circles", 
                  desc: "Classrooms have dedicated channels. Share resources, clear lab doubts, and coordinate study sessions in text rooms free of unrelated notifications.",
                  icon: MessageSquare, 
                  color: "text-[var(--feat-groups)]",
                  bg: "rgba(167, 139, 250, 0.12)",
                  border: "border-purple-500/20"
                },
                { 
                  title: "Class Planner", 
                  desc: "Visual schedule dashboard. Syncs with your cohort's core chemistry lectures, tutorial groups, and lab sections to organize your week.",
                  icon: CalendarClock, 
                  color: "text-[var(--warning)]",
                  bg: "bg-[var(--warning-muted)]",
                  border: "border-[var(--warning-border)]"
                },
                { 
                  title: "Task Board", 
                  desc: "Kanban-style tasks mapped to academic work. Set priorities for upcoming laboratory submissions, quiz studies, and chemistry assignments.",
                  icon: ClipboardList, 
                  color: "text-[var(--accent)]",
                  bg: "bg-[var(--accent-muted)]",
                  border: "border-[rgba(212,255,0,0.15)]"
                },
                {
                  title: "Department Hub",
                  desc: "Official cohort directories and announcements. Find verified contacts, schedule office hours, and keep track of academic updates.",
                  icon: Layers,
                  color: "text-[var(--fg-default)]",
                  bg: "bg-white/[0.03]",
                  border: "border-[var(--border-default)]"
                }
              ].map((feature, idx) => (
                <div 
                  key={idx} 
                  className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-raised)] p-6 transition-colors hover:border-[var(--border-strong)] flex flex-col justify-between"
                >
                  <div>
                    <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] ${feature.bg} ${feature.border} ${feature.color}`}>
                      <feature.icon size={18} />
                    </div>
                    <h3 className="text-h2 mb-3 font-bold">{feature.title}</h3>
                    <p className="text-caption text-[var(--fg-muted)] leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-1 text-[10px] font-mono text-[var(--fg-faint)] select-none">
                    <span>Ecosystem Module</span>
                    <span>·</span>
                    <span className={feature.color}>Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STUDENT WORKFLOW ════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-[var(--bg-raised)] border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <p className="mb-2 text-overline text-[var(--accent)] font-mono">Academic Rhythm</p>
              <h2 className="text-display tracking-tight mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
                The Semester Loop
              </h2>
              <p className="mx-auto max-w-xl text-body text-[var(--fg-muted)]">
                See how a BS Chemistry student leverages the ChemSAGE platform chronologically across a typical semester.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Horizontal line indicator for desktop */}
              <div className="absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-[var(--border-default)] hidden md:block z-0" />

              {[
                { 
                  step: "01", 
                  title: "Pre-Semester Setup", 
                  desc: "Verify your enrollment, configure your Planner timetable, and automatically enter relevant course study circles." 
                },
                { 
                  step: "02", 
                  title: "Weekly Momentum", 
                  desc: "Retrieve peer-curated class summaries, download lab procedures, and clear doubts in active discussion circles." 
                },
                { 
                  step: "03", 
                  title: "Task Coordination", 
                  desc: "Log laboratory write-ups, assignment deadlines, and seminar dates to monitor tasks in a visual Kanban board." 
                },
                { 
                  step: "04", 
                  title: "Exam Preparation", 
                  desc: "Filter and access previous quiz, mid-semester, and end-semester solution sheets in the digital library." 
                }
              ].map((workflow, idx) => (
                <div key={idx} className="relative z-10 flex flex-col justify-between bg-[var(--bg-base)] p-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] min-h-[200px]">
                  <div>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] font-mono text-xs font-bold border border-[rgba(212,255,0,0.15)] mb-4 select-none">
                      {workflow.step}
                    </div>
                    <h3 className="text-h3 mb-2 font-bold text-[var(--fg-default)]">{workflow.title}</h3>
                  </div>
                  <p className="text-caption text-[var(--fg-muted)] leading-relaxed mt-2">
                    {workflow.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECURITY & TRUST ═════════════════════════════════════════════════ */}
        <section className="py-24 px-6 border-b border-[var(--border-subtle)]" id="security">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              
              <div className="lg:col-span-1">
                <p className="mb-2 text-overline text-[var(--accent)] font-mono">Access & Governance</p>
                <h2 className="text-display tracking-tight mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
                  A Trusted Campus Space
                </h2>
                <p className="text-body text-[var(--fg-muted)] leading-relaxed mb-6">
                  Unlike open chat servers or indexable cloud folders, ChemSAGE enforces strict campus-only privacy and data governance rules.
                </p>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-raised)] p-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="text-[var(--accent)] shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-h3 font-bold mb-1">Authorization Required</h4>
                      <p className="text-caption text-[var(--fg-muted)]">
                        Every user roll number is validated against official department lists. No external access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    title: "Verified Student Accounts",
                    desc: "Student access is validated against registered IIT Madras Chemistry cohorts. There are no public sign-ups or anonymous external observers.",
                    check: "IITM Domain Restricted"
                  },
                  {
                    title: "Moderated Repository",
                    desc: "Course files uploaded to the Resource Vault are reviewed by designated student contributors to ensure accuracy, organization, and compliance.",
                    check: "Curated & Organized Files"
                  },
                  {
                    title: "Blocked Web Crawlers",
                    desc: "The entire workspace database is protected from search engines. Shared files, plans, and peer discussions remain strictly private.",
                    check: "No Search Engine Indexing"
                  },
                  {
                    title: "No Ads or Monetization",
                    desc: "This platform is built purely for campus service. There are no trackers, premium paywalls, advertising models, or corporate telemetry.",
                    check: "Ad-Free Campus Intranet"
                  }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-6 bg-[var(--bg-raised)] flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-h3 font-bold mb-3 text-[var(--fg-default)]">{item.title}</h3>
                      <p className="text-caption text-[var(--fg-muted)] leading-relaxed mb-4">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--accent)] select-none">
                      <CheckCircle2 size={11} />
                      {item.check}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ═══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-[var(--accent)]/[0.02] blur-[120px]" />
          
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-display mb-4 tracking-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
              Access the BS Chemistry Workspace
            </h2>
            <p className="mx-auto mb-8 max-w-md text-body leading-relaxed text-[var(--fg-muted)]">
              Authorized students can log in to view resources, coordinates, and academic planners.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-8 py-4 text-sm font-bold text-black transition-all hover:bg-[var(--accent-hover)] active:scale-[0.97]"
              >
                Enter Portal Workspace
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link 
                href="/signup" 
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-raised)] px-8 py-4 text-sm font-bold text-[var(--fg-default)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                Register Account
              </Link>
            </div>
            <p className="mt-5 text-[10px] font-mono text-[var(--fg-faint)] select-none">
              Requires validation of IITM Student ID and Roll Number
            </p>
          </div>
        </section>

      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-subtle)] py-12 px-6 bg-[var(--bg-raised)]">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2 text-[var(--fg-default)] select-none">
              <FlaskConical size={15} className="text-[var(--accent)]" />
              <span className="text-sm font-bold">ChemSAGE</span>
              <span className="text-[10px] font-mono text-[var(--fg-faint)]">v2.1</span>
            </div>
            <p className="text-[11px] text-[var(--fg-faint)] text-center md:text-left">
              Private academic network for the IIT Madras Chemistry Department. Built and managed by student representatives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 text-caption text-[var(--fg-muted)]">
            <span className="flex items-center gap-1.5 text-[11px] font-mono select-none">
              <Lock size={12} className="text-[var(--accent)]" /> Campus Intranet System
            </span>
            <span className="hidden sm:inline-block text-[var(--border-strong)]">|</span>
            <a 
              href="https://www.iitm.ac.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[var(--fg-default)] inline-flex items-center gap-1 text-[11px] transition-colors"
            >
              IIT Madras Official <ExternalLink size={10} />
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
