import Link from "next/link";
import { ArrowRight, BookOpen, FlaskConical, Users, MessageSquare, Zap, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-white selection:bg-[var(--accent)] selection:text-black overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] h-[40vh] w-[40vw] rounded-full bg-[var(--accent)]/10 blur-[100px] sm:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[40vw] rounded-full bg-blue-500/10 blur-[100px] sm:blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="flex w-full items-center justify-between px-6 py-6 md:px-12 md:py-8 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-lg shadow-[var(--accent)]/5">
              <FlaskConical size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight">ChemSAGE</span>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <Link href="/login" className="hidden sm:inline-block text-sm md:text-base font-medium text-[var(--muted)] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="rounded-full bg-[var(--accent)] px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-bold text-black transition-transform hover:scale-105 hover:bg-[#bce600]">
              Get Started
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 md:px-12 lg:px-16 pb-20 pt-10 md:pt-16 lg:pt-24 flex items-center">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
              
              {/* Left Column: Hero Text */}
              <div className="flex flex-col max-w-2xl animate-fade-in order-2 lg:order-1">
                <div className="mb-6 lg:mb-8 self-start inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-[var(--accent)] backdrop-blur-md">
                  <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[var(--accent)]"></span>
                  </span>
                  Portal v1.0 Live
                </div>
                
                <h1 className="mb-6 lg:mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
                  The ultimate <br />
                  <span className="bg-gradient-to-r from-[var(--accent)] to-emerald-400 bg-clip-text text-transparent">chemistry</span> workspace.
                </h1>
                
                <p className="mb-8 lg:mb-10 max-w-xl text-lg text-[var(--muted)] sm:text-xl leading-relaxed">
                  Everything you need for chemistry coursework, collaboration, and planning—all in one unified student portal. Log in to access your vault, classes, and peers.
                </p>
                
                <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
                  <Link href="/login" className="group flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 sm:px-8 sm:py-4.5 text-base sm:text-lg font-bold text-black transition-all hover:bg-[#bce600] hover:shadow-lg hover:shadow-[var(--accent)]/20 w-full sm:w-auto">
                    Enter Portal
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/signup" className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm px-6 py-4 sm:px-8 sm:py-4.5 text-base sm:text-lg font-semibold text-white transition-all hover:bg-[var(--surface-soft)] w-full sm:w-auto">
                    Create Account
                  </Link>
                </div>
                
                <div className="mt-8 flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  Secure access for registered students only.
                </div>
              </div>

              {/* Right Column: Feature Tiles */}
              <div className="relative mx-auto w-full max-w-md sm:max-w-xl lg:max-w-none animate-slide-up order-1 lg:order-2" style={{ animationDelay: '150ms' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Tile 1 */}
                  <div className="sm:translate-y-12 group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-gradient-to-b from-[var(--surface)]/80 to-[var(--background)]/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-[var(--accent)]/50 hover:-translate-y-2 hover:shadow-[var(--accent)]/10 flex flex-col justify-between h-[220px] sm:h-[260px]">
                    <div className="mb-4 inline-flex rounded-2xl bg-blue-500/10 p-3.5 sm:p-4 text-blue-400 w-fit">
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl sm:text-2xl font-bold text-white">Resource Vault</h3>
                      <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">Access curated notes, lab references, and past papers.</p>
                    </div>
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-[50px] transition-all group-hover:bg-blue-500/20" />
                  </div>
                  
                  {/* Tile 2 */}
                  <div className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-gradient-to-b from-[var(--surface)]/80 to-[var(--background)]/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-[var(--accent)]/50 hover:-translate-y-2 hover:shadow-[var(--accent)]/10 flex flex-col justify-between h-[220px] sm:h-[260px]">
                    <div className="mb-4 inline-flex rounded-2xl bg-[var(--accent)]/10 p-3.5 sm:p-4 text-[var(--accent)] w-fit">
                      <MessageSquare size={28} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl sm:text-2xl font-bold text-white">Community Hub</h3>
                      <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">Connect with peers in global and direct chats.</p>
                    </div>
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-[50px] transition-all group-hover:bg-[var(--accent)]/20" />
                  </div>

                  {/* Tile 3 */}
                  <div className="sm:translate-y-12 group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-gradient-to-b from-[var(--surface)]/80 to-[var(--background)]/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-[var(--accent)]/50 hover:-translate-y-2 hover:shadow-[var(--accent)]/10 flex flex-col justify-between h-[220px] sm:h-[260px]">
                    <div className="mb-4 inline-flex rounded-2xl bg-purple-500/10 p-3.5 sm:p-4 text-purple-400 w-fit">
                      <Users size={28} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl sm:text-2xl font-bold text-white">Study Circles</h3>
                      <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">Join focused groups for assignments and exam prep.</p>
                    </div>
                    <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-500/10 blur-[50px] transition-all group-hover:bg-purple-500/20" />
                  </div>
                  
                  {/* Tile 4 */}
                  <div className="group relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-gradient-to-b from-[var(--surface)]/80 to-[var(--background)]/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-[var(--accent)]/50 hover:-translate-y-2 hover:shadow-[var(--accent)]/10 flex flex-col justify-between h-[220px] sm:h-[260px]">
                    <div className="mb-4 inline-flex rounded-2xl bg-orange-500/10 p-3.5 sm:p-4 text-orange-400 w-fit">
                      <Zap size={28} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl sm:text-2xl font-bold text-white">Task Board</h3>
                      <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">Stay on top of deadlines and lab submissions.</p>
                    </div>
                    <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-500/10 blur-[50px] transition-all group-hover:bg-orange-500/20" />
                  </div>
                </div>
                
                {/* Center decorative element behind tiles */}
                <div className="absolute left-1/2 top-1/2 -z-10 h-full w-full max-w-[300px] max-h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/5 blur-[80px]" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
