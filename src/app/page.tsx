import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Users, MessageSquare, Zap, ShieldCheck, Star, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white selection:bg-[var(--accent)] selection:text-black overflow-hidden font-sans">
      {/* Deep Space Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
            <Link href="/login" className="rounded-xl bg-white/10 border border-white/10 px-5 py-2.5 text-sm md:text-base font-semibold text-white transition-all hover:bg-white/20">
              Sign In
            </Link>
            <Link href="/signup" className="hidden sm:flex rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm md:text-base font-bold text-black transition-all hover:scale-105 shadow-lg">
              Get Started
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-6 md:px-10 lg:px-16 pt-8 md:pt-12 pb-24 relative">
          
          {/* Floating decorative elements to fill empty void */}
          <div className="hidden lg:block absolute top-10 left-1/2 -translate-x-12 animate-pulse pointer-events-none opacity-60">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
               <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                 <FlaskConical size={20} className="text-emerald-400" />
               </div>
               <div>
                 <p className="text-xs text-gray-300 font-medium">New Lab Added</p>
                 <p className="text-sm font-bold text-white">Organic Synthesis Lab</p>
               </div>
            </div>
          </div>
          
          <div className="hidden lg:block absolute top-32 right-1/2 translate-x-20 animate-pulse pointer-events-none opacity-60" style={{ animationDelay: '2s' }}>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
               <div className="flex -space-x-2">
                 <div className="h-8 w-8 rounded-full bg-blue-500 border-2 border-[#050505]"></div>
                 <div className="h-8 w-8 rounded-full bg-purple-500 border-2 border-[#050505]"></div>
                 <div className="h-8 w-8 rounded-full bg-orange-500 border-2 border-[#050505]"></div>
               </div>
               <p className="text-xs font-bold text-white pr-2">12 online</p>
            </div>
          </div>

          <div className="mx-auto max-w-7xl mt-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 items-center">
              
              {/* Left Column: Hero Text */}
              <div className="flex flex-col max-w-2xl animate-fade-in z-10">
                <div className="mb-6 self-start inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                  </span>
                  ChemSAGE Portal v1.0
                </div>
                
                <h1 className="mb-6 text-[2.75rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  The central hub for <br />
                  <span className="text-[var(--accent)] drop-shadow-[0_0_20px_rgba(188,230,0,0.3)]">IITM Chemistry</span> students.
                </h1>
                
                <p className="mb-8 max-w-xl text-lg text-gray-200 sm:text-xl leading-relaxed font-light">
                  Manage coursework, lab submissions, notes, and study groups in one place. Your entire academic life, streamlined.
                </p>
                
                <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto mb-10">
                  <Link href="/signup" className="group flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-lg font-bold text-black transition-all hover:bg-[#bce600] hover:shadow-[0_0_30px_rgba(188,230,0,0.25)] hover:-translate-y-0.5 w-full sm:w-auto">
                    Start Learning
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1.5" />
                  </Link>
                </div>
                
                {/* Social Proof */}
                <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-[#050505] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold shadow-sm">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="h-10 w-10 rounded-full border-2 border-[#050505] bg-white/10 flex items-center justify-center text-xs font-bold backdrop-blur-md">
                      +
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1 text-[var(--accent)]">
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                      <Star size={14} fill="currentColor" />
                    </div>
                    <p className="text-sm font-medium text-gray-300">
                      Trusted by <span className="text-white font-bold">450+</span> IITM Chemistry students
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Clickable Bento Box Tiles */}
              <div className="relative mx-auto w-full animate-slide-up z-10" style={{ animationDelay: '100ms' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-[180px]">
                  
                  {/* Feature 1: Large Bento (Spans 2 rows) */}
                  <Link href="/signup" className="sm:row-span-2 group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-2xl transition-all hover:border-[var(--accent)]/50 hover:bg-white/[0.06] hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm cursor-pointer">
                    <div className="flex justify-between items-start w-full z-10">
                      <div className="inline-flex rounded-2xl bg-[var(--accent)]/15 p-4 text-[var(--accent)] w-fit backdrop-blur-md shadow-[0_0_20px_rgba(188,230,0,0.2)]">
                        <BookOpen size={32} />
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/20">
                        <Star size={12} fill="currentColor" /> Most Popular
                      </div>
                    </div>
                    <div className="z-10 mt-8">
                      <h3 className="mb-3 text-2xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-[var(--accent)] transition-colors">
                        Access 800+ Notes <ChevronRight size={20} className="opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0" />
                      </h3>
                      <p className="text-gray-300 leading-relaxed font-light text-sm">
                        Curated lecture notes, 250+ past papers, and 50+ lab resources at your fingertips.
                      </p>
                    </div>
                    <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--accent)]/20 blur-[80px] transition-opacity group-hover:opacity-100 opacity-50" />
                  </Link>
                  
                  {/* Feature 2: Wide Bento */}
                  <Link href="/signup" className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-xl transition-all hover:border-purple-500/50 hover:bg-white/[0.06] hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm cursor-pointer">
                    <div className="flex justify-between items-start z-10">
                      <div className="inline-flex rounded-xl bg-purple-500/15 p-3.5 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Users size={24} />
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 border border-purple-500/20">
                        <TrendingUp size={12} /> Active
                      </div>
                    </div>
                    <div className="z-10">
                      <h3 className="mb-1 text-lg font-bold text-white tracking-tight flex items-center gap-1 group-hover:text-purple-400 transition-colors">
                        Join 40+ Study Circles <ChevronRight size={16} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
                      </h3>
                      <p className="text-sm text-gray-300 font-light">Collaborate on assignments and exam prep.</p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-purple-500/20 blur-[50px] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>

                  {/* Feature 3 */}
                  <Link href="/signup" className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-xl transition-all hover:border-blue-500/50 hover:bg-white/[0.06] hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm cursor-pointer">
                    <div className="flex justify-between items-start z-10">
                      <div className="inline-flex rounded-xl bg-blue-500/15 p-3.5 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <MessageSquare size={24} />
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
                        <Sparkles size={12} /> Live
                      </div>
                    </div>
                    <div className="z-10">
                      <h3 className="mb-1 text-lg font-bold text-white tracking-tight flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                        Connect Globally <ChevronRight size={16} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
                      </h3>
                      <p className="text-sm text-gray-300 font-light">Real-time chat with chemistry peers.</p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/20 blur-[50px] opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>

                  {/* Feature 4: Wide Bento */}
                  <Link href="/signup" className="sm:col-span-2 group relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-r from-orange-500/5 to-white/[0.03] p-6 shadow-xl transition-all hover:border-orange-500/50 hover:bg-white/[0.06] hover:-translate-y-1 flex items-center justify-between backdrop-blur-sm cursor-pointer">
                    <div className="z-10 flex-1 pr-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/20 mb-3">
                        Required
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-white tracking-tight flex items-center gap-2 group-hover:text-orange-400 transition-colors">
                        Track Deadlines & Labs <ChevronRight size={20} className="opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0" />
                      </h3>
                      <p className="text-sm text-gray-300 font-light">Never miss a submission. 100% sync with coursework.</p>
                    </div>
                    <div className="inline-flex rounded-2xl bg-orange-500/15 p-5 text-orange-400 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.2)] z-10 transition-transform group-hover:scale-110">
                      <Zap size={32} />
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
