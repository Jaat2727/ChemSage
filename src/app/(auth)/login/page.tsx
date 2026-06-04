"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Eye, EyeOff, ShieldX, FlaskConical, Shield } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { normalizeEmail } from "@/lib/rollno";

const supabase = createClientComponentClient();

const inputClasses =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [pendingMessage, setPendingMessage] = useState(false);
  const [bannedMessage, setBannedMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  if (pendingMessage || bannedMessage) {
    return (
      <div className="animate-scale-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 w-fit rounded-full border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--muted)]">
          {pendingMessage ? <Clock size={26} /> : <ShieldX size={26} />}
        </div>
        <h2 className="text-xl font-bold text-white">{pendingMessage ? "Approval Pending" : "Account Banned"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {pendingMessage
            ? "Your account is waiting for admin approval. You'll be notified once approved."
            : "This account was banned by an administrator. Contact support if you believe this is an error."}
        </p>
        <button
          onClick={() => { setPendingMessage(false); setBannedMessage(false); setError(null); }}
          className="mt-6 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--surface-soft)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = normalizeEmail(email);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("invalid login credentials")) {
        setError("Invalid credentials. Please check your roll number and password.");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    const profile = await refreshProfile();
    if (!profile) {
      setError(<span>No active account found. Your previous request may have been rejected. <Link href="/signup" className="text-[var(--accent)] underline">Request access again</Link></span>);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.status === "pending") {
      await supabase.auth.signOut();
      setPendingMessage(true);
      setLoading(false);
      return;
    }

    if (profile.status === "banned") {
      await supabase.auth.signOut();
      setBannedMessage(true);
      setLoading(false);
      return;
    }

    router.replace(searchParams.get("next") || "/dashboard");
  };

  return (
    <div className="animate-fade-in w-full max-w-sm mx-auto">
      {/* Brand */}
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)]">
          <FlaskConical size={20} strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">ChemSAGE</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">IITM BS Chemistry Workspace</p>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl shadow-black/40">
        <div className="px-6 pt-5 pb-1">
          <h2 className="text-base font-bold text-white">Student Login</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Access notes, schedules, past papers, study circles and academic resources.
          </p>
        </div>

        <div className="px-6 pt-4 pb-5">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                IITM Email or Roll Number
              </label>
              <input
                type="text"
                placeholder="CY25B013 or rollno@smail.iitm.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClasses} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <Link href="/forgot-password" className="text-[11px] font-medium text-[var(--accent)] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">{error}</div>
            ) : null}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black transition-all hover:bg-[#bce600] disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">New here?</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Link
            href="/signup"
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-[var(--border)] bg-transparent py-2 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-white"
          >
            Request Access
          </Link>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-[var(--muted)]">
        <Shield size={12} className="text-[var(--accent)]" />
        <span>Only verified IITM Chemistry students can access ChemSAGE.</span>
      </div>
    </div>
  );
}
