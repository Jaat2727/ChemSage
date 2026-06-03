import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Users, MessageSquare, Zap, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[var(--accent)] selection:text-black overflow-hidden font-sans">
      {/* Deep Space Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Soft grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" style={{ opacity: 0.03 }}></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[150px] opacity-70 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] opacity-60 transform -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="relative z-10 flex flex-col">
        {/* Navigation */}
        <header className="w-full flex items-center justify-between px-6 py-6 md:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-xl shadow-[var(--accent)]/10">
              <FlaskConical size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight">ChemSAGE</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-block text-sm md:text-base font-semibold text-[var(--muted)] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="rounded-xl bg-white px-5 py-2.5 text-sm md:text-base font-bold text-black transition-all hover:bg-gray-100 hover:scale-105 shadow-lg">
              Get Started
            </Link>
          </div>
        </header>

        {/* Main Content - No more vertical centering, using fixed top padding */}
        <main className="w-full px-6 md:px-10 lg:px-16 pt-8 md:pt-16 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 items-start">
              
              {/* Left Column: Hero Text */}
              <div className="flex flex-col max-w-2xl animate-fade-in pt-4 lg:pt-8">
                <div className="mb-6 self-start inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                  </span>
                  Portal v1.0 Live
                </div>
                
                <h1 className="mb-6 text-[2.75rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  The ultimate <br />
                  <span className="text-[var(--accent)] drop-shadow-[0_0_20px_rgba(188,230,0,0.3)]">chemistry</span> workspace.
                </h1>
                
                <p className="mb-10 max-w-xl text-lg text-gray-400 sm:text-xl leading-relaxed font-light">
                  Everything you need for chemistry coursework, collaboration, and planning—all in one unified student portal.
                </p>
                
                <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
                  <Link href="/login" className="group flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-bold text-black transition-all hover:bg-[#bce600] hover:shadow-[0_0_30px_rgba(188,230,0,0.25)] hover:-translate-y-0.5 w-full sm:w-auto">
                    Enter Portal
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1.5" />
                  </Link>
                </div>
                
                <div className="mt-8 flex items-center gap-3 text-sm font-medium text-gray-500">
                  <ShieldCheck size={18} className="text-emerald-500/80" />
                  Secure access for registered students only.
                </div>
              </div>

              {/* Right Column: Bento Box Tiles */}
              <div className="relative mx-auto w-full animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-[160px]">
                  
                  {/* Feature 1: Large Bento (Spans 2 rows) */}
                  <div className="md:row-span-2 group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-8 shadow-2xl transition-all hover:border-[var(--accent)]/40 hover:bg-white/[0.04] flex flex-col justify-end backdrop-blur-sm">
                    <div className="absolute top-8 left-8 inline-flex rounded-2xl bg-[var(--accent)]/10 p-4 text-[var(--accent)] w-fit backdrop-blur-md">
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-2xl font-bold text-white tracking-tight">Resource Vault</h3>
                      <p className="text-gray-400 leading-relaxed font-light">Curated notes, references, and an extensive past paper archive at your fingertips.</p>
                    </div>
                    <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-[80px] transition-opacity group-hover:opacity-100 opacity-0" />
                  </div>
                  
                  {/* Feature 2: Wide Bento */}
                  <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-6 shadow-xl transition-all hover:border-purple-500/40 hover:bg-white/[0.04] flex flex-col justify-center backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="mb-1 text-xl font-bold text-white tracking-tight">Study Circles</h3>
                        <p className="text-sm text-gray-400 font-light">Join focused groups.</p>
                      </div>
                      <div className="inline-flex rounded-xl bg-purple-500/10 p-3 text-purple-400">
                        <Users size={22} />
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-6 shadow-xl transition-all hover:border-blue-500/40 hover:bg-white/[0.04] flex flex-col justify-center backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="mb-1 text-xl font-bold text-white tracking-tight">Global Hub</h3>
                        <p className="text-sm text-gray-400 font-light">Connect with peers.</p>
                      </div>
                      <div className="inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-400">
                        <MessageSquare size={22} />
                      </div>
                    </div>
                  </div>

                  {/* Feature 4: Wide Bento */}
                  <div className="md:col-span-2 group relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-r from-orange-500/5 to-white/[0.02] p-6 shadow-xl transition-all hover:border-orange-500/40 flex items-center justify-between backdrop-blur-sm">
                    <div>
                      <h3 className="mb-1 text-xl font-bold text-white tracking-tight">Task Board</h3>
                      <p className="text-sm text-gray-400 font-light">Stay on top of deadlines and lab submissions.</p>
                    </div>
                    <div className="inline-flex rounded-2xl bg-orange-500/10 p-4 text-orange-400 shrink-0">
                      <Zap size={26} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
