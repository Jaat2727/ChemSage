import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Users, MessageSquare, CalendarClock, ShieldCheck, CheckCircle2, ChevronRight, Download, Clock, Star, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[var(--accent)] selection:text-black font-sans">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface)] border border-white/10 text-[var(--accent)]">
              <FlaskConical size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">ChemSAGE</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="rounded-md bg-white px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
              Open Workspace
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        
        {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 pt-24 pb-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              
              {/* Left: Copy */}
              <div className="flex flex-col z-10 max-w-2xl">
                <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-300">
                  <ShieldCheck size={14} className="text-[var(--accent)]" />
                  Built for IITM BS Chemistry
                </div>
                
                <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                  The operating system for <span className="text-[var(--accent)]">IITM Chemistry</span> students.
                </h1>
                
                <p className="mb-10 max-w-xl text-lg font-medium text-gray-400 md:text-xl leading-relaxed">
                  Access notes, past papers, schedules, lab resources, deadlines, and study groups from one unified workspace.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link href="/signup" className="group flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-8 py-4 text-sm font-bold text-black transition-colors hover:bg-[#bce600]">
                    Open Workspace
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a href="#features" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-white/5">
                    Explore Features
                  </a>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-white">800+</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Notes</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-white">250+</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Past Papers</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-white">40+</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Study Groups</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-[var(--accent)]">450+</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Students</span>
                  </div>
                </div>
              </div>

              {/* Right: Dashboard Mockup */}
              <div className="relative z-10 w-full rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden lg:scale-105 transform origin-left">
                {/* Window Header */}
                <div className="flex items-center gap-2 border-b border-white/10 bg-[#111] px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                {/* Mockup Body */}
                <div className="flex h-[400px]">
                  {/* Sidebar */}
                  <div className="w-16 border-r border-white/10 bg-[#0a0a0a] flex flex-col items-center py-4 gap-6 text-gray-600">
                     <FlaskConical size={20} className="text-[var(--accent)]" />
                     <BookOpen size={20} />
                     <Users size={20} />
                     <CalendarClock size={20} />
                     <MessageSquare size={20} />
                  </div>
                  {/* Main View */}
                  <div className="flex-1 p-6 bg-[#050505] overflow-hidden flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="h-6 w-32 rounded bg-white/10" />
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/50" />
                    </div>
                    
                    {/* Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Class */}
                      <div className="rounded-lg border border-white/10 bg-[#111] p-4">
                        <div className="text-[10px] font-bold text-[var(--accent)] uppercase mb-2">Upcoming Class</div>
                        <div className="text-sm font-bold text-white mb-1">Physical Chemistry II</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> 10:00 AM • Rm 402</div>
                      </div>
                      {/* Task */}
                      <div className="rounded-lg border border-red-900/30 bg-red-950/10 p-4">
                        <div className="text-[10px] font-bold text-red-400 uppercase mb-2">Pending Task</div>
                        <div className="text-sm font-bold text-white mb-1">Lab Report Draft</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">Due Tomorrow</div>
                      </div>
                    </div>
                    
                    {/* List */}
                    <div className="rounded-lg border border-white/10 bg-[#111] flex-1 p-4">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-4">Recent Uploads</div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-blue-500/10 text-blue-400"><FileText size={14}/></div>
                          <div className="h-4 w-40 rounded bg-white/10" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-emerald-500/10 text-emerald-400"><FileText size={14}/></div>
                          <div className="h-4 w-32 rounded bg-white/10" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-amber-500/10 text-amber-400"><FileText size={14}/></div>
                          <div className="h-4 w-48 rounded bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Section 1: Academic Resources ────────────────────────────────────────── */}
        <section id="features" className="border-b border-white/5 py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 md:text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">A complete academic repository.</h2>
              <p className="text-gray-400 text-lg">Stop searching through disjointed WhatsApp groups. Everything you need is structured and instantly searchable.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 hover:bg-white/[0.02] transition-colors">
                <BookOpen size={24} className="text-[var(--accent)] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Lecture Notes</h3>
                <p className="text-gray-400 leading-relaxed">Crowdsourced, highly-rated notes organized by semester and subject. Never fall behind on theory.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 hover:bg-white/[0.02] transition-colors">
                <FlaskConical size={24} className="text-amber-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Lab Reports</h3>
                <p className="text-gray-400 leading-relaxed">Access structural templates, data analysis scripts, and reference reports for complex experiments.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 hover:bg-white/[0.02] transition-colors">
                <CheckCircle2 size={24} className="text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Assignments</h3>
                <p className="text-gray-400 leading-relaxed">Keep track of assignment solutions and practice problem sets submitted by seniors.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 hover:bg-white/[0.02] transition-colors">
                <FileText size={24} className="text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">References</h3>
                <p className="text-gray-400 leading-relaxed">Standard textbooks, reaction mechanism charts, and spectral data tables available offline.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Section 2: Past Paper Archive ────────────────────────────────────────── */}
        <section className="border-b border-white/5 py-24 px-6 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
          <div className="mx-auto max-w-7xl grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative rounded-xl border border-white/10 bg-[#111] p-6 shadow-2xl">
              <div className="flex gap-2 mb-4">
                 <div className="h-6 w-20 rounded bg-white/10" />
                 <div className="h-6 w-16 rounded bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[10px] text-[var(--accent)] font-bold flex items-center justify-center">End Sem</div>
              </div>
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-[#0a0a0a]">
                    <div>
                      <div className="text-sm font-bold text-white">Physical Chem {i}</div>
                      <div className="text-xs text-gray-500">2024 • PDF</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <Download size={12}/> 142
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-white mb-4">The ultimate Past Paper Archive.</h2>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                Stop begging seniors for last year's end-sem papers. Access a meticulously tagged, searchable database of Mid Sems, End Sems, and Quizzes.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm font-bold text-gray-300"><CheckCircle2 size={16} className="text-[var(--accent)]"/> Sorted by Subject & Year</li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-300"><CheckCircle2 size={16} className="text-[var(--accent)]"/> Download tracking for popular papers</li>
                <li className="flex items-center gap-3 text-sm font-bold text-gray-300"><CheckCircle2 size={16} className="text-[var(--accent)]"/> Seamless contribution flow</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Section 3 & 4: Study Circles & Scheduling ────────────────────────────── */}
        <section className="py-24 px-6 border-b border-white/5">
          <div className="mx-auto max-w-7xl grid md:grid-cols-2 gap-6">
            
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 lg:p-12">
              <Users size={32} className="text-purple-400 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Study Circles</h2>
              <p className="text-gray-400 mb-8">Join focused micro-communities based on your electives. Collaborate on lab reports, share real-time insights, and coordinate group projects via integrated rich-text chat channels.</p>
              <Link href="/signup" className="text-sm font-bold text-white flex items-center gap-2 hover:text-purple-400 transition-colors">
                Explore Communities <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 lg:p-12">
              <CalendarClock size={32} className="text-orange-400 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Schedule & Tasks</h2>
              <p className="text-gray-400 mb-8">A highly dense, Kanban-style task manager deeply integrated with your weekly academic timetable. See your assignment deadlines right next to your lecture schedule.</p>
              <Link href="/signup" className="text-sm font-bold text-white flex items-center gap-2 hover:text-orange-400 transition-colors">
                View Planner <ChevronRight size={16} />
              </Link>
            </div>

          </div>
        </section>

        {/* ─── Section 5: Testimonials ──────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-2xl font-bold text-white mb-12">Trusted by the IITM Chemistry Cohort</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-1 text-[var(--accent)] mb-4">
                  <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">"The past paper archive saved my End Sems. The fact that I don't have to scroll through WhatsApp groups to find notes is a game changer."</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/50" />
                  <div className="text-xs">
                    <div className="font-bold text-white">Rahul K.</div>
                    <div className="text-gray-500">Batch 2026</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-1 text-[var(--accent)] mb-4">
                  <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">"The Task Board is amazing. I have all my lab deadlines tracked right next to my class schedule. Linear-level quality."</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 border border-purple-500/50" />
                  <div className="text-xs">
                    <div className="font-bold text-white">Sneha P.</div>
                    <div className="text-gray-500">Batch 2025</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-1 text-[var(--accent)] mb-4">
                  <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">"Study Circles completely replaced Discord for our cohort. The UI is incredibly clean and fast."</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-500/20 border border-orange-500/50" />
                  <div className="text-xs">
                    <div className="font-bold text-white">Vikram S.</div>
                    <div className="text-gray-500">Batch 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-6">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <FlaskConical size={16} /> ChemSAGE © {new Date().getFullYear()}
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
        </footer>
        
      </main>
    </div>
  );
}
