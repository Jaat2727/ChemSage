"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Eye, EyeOff, ShieldX } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { normalizeEmail } from "@/lib/rollno";

const supabase = createClientComponentClient();

const inputClasses =
  "w-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [pendingMessage, setPendingMessage] = useState(false);
  const [bannedMessage, setBannedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  if (pendingMessage || bannedMessage) {
    return (
      <div className="animate-scale-in border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <div className="mx-auto mb-4 w-fit border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--muted)]">
          {pendingMessage ? <Clock size={26} /> : <ShieldX size={26} />}
        </div>
        <h2 className="font-mono text-xl font-bold text-white">{pendingMessage ? "pending_approval" : "account_banned"}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {pendingMessage
            ? "Your account is waiting for admin approval."
            : "This account was banned by an administrator."}
        </p>
        <button
          onClick={() => {
            setPendingMessage(false);
            setBannedMessage(false);
            setError(null);
          }}
          className="mt-5 w-full border border-[var(--border)] bg-[var(--background)] py-2.5 font-mono text-sm text-white transition-colors hover:bg-[var(--surface)]"
        >
          tryAgain()
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
        setError(
          <span>
            Invalid email or password. <Link href="/signup" className="text-[var(--accent)] underline">Create an account</Link>
          </span>,
        );
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    const profile = await refreshProfile();
    if (!profile) {
      setError("Profile setup is incomplete. Please contact an administrator.");
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

    router.replace(searchParams.get("next") || "/");
  };

  return (
    <div className="animate-scale-in border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* MacOS-style window header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">chemsage_auth.ts</span>
        <div className="w-12" />
      </div>

      <div className="px-6 pt-5 pb-2">
        <p className="font-mono text-sm text-[var(--muted)]">{`// ChemSAGE - Student Portal`}</p>
      </div>

      {/* Tab switcher */}
      <div className="flex px-6 pt-2 pb-4">
        <button
          onClick={() => setActiveTab("login")}
          className={`flex-1 border py-2.5 font-mono text-sm font-bold transition-all ${
            activeTab === "login"
              ? "border-[var(--accent)] bg-[var(--accent)] text-black"
              : "border-[var(--border)] text-[var(--muted)] hover:text-white"
          }`}
        >
          login()
        </button>
        <button
          onClick={() => { setActiveTab("signup"); router.push("/signup"); }}
          className={`flex-1 border border-l-0 py-2.5 font-mono text-sm font-bold transition-all ${
            activeTab === "signup"
              ? "border-[var(--accent)] bg-[var(--accent)] text-black"
              : "border-[var(--border)] text-[var(--muted)] hover:text-white"
          }`}
        >
          signUp()
        </button>
      </div>

      <div className="px-6 pb-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-[var(--muted)]">
              <span>✉</span> email
            </label>
            <input
              type="text"
              placeholder="CY25B013 or rollno@smail.iitm.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 font-mono text-xs text-[var(--muted)]">
              <span>🔒</span> password
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-[var(--muted)]">
            <span>☐ rememberMe</span>
            <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">forgotPassword()</Link>
          </div>

          {error ? <div className="border border-red-800 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-300">{`> `}{error}</div> : null}

          <button disabled={loading} className="flex w-full items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] py-2.5 font-mono text-sm font-bold text-black transition-opacity disabled:opacity-60">
            {loading ? "await signIn() ○" : "await signIn()"}
          </button>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="font-mono text-xs text-[var(--muted)]">{`/* or */`}</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <p className="text-center font-mono text-xs text-[var(--muted)]">
            {`// By continuing, you agree to our `}
            <span className="text-[var(--accent)]">Terms</span>
            {` && `}
            <span className="text-[var(--accent)]">Privacy</span>
          </p>
        </form>
      </div>
    </div>
  );
}
