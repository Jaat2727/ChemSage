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
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";

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
      <div className="animate-scale-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 w-fit rounded-full border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--muted)]">
          {pendingMessage ? <Clock size={26} /> : <ShieldX size={26} />}
        </div>
        <h2 className="text-xl font-bold text-white">{pendingMessage ? "Approval Pending" : "Account Banned"}</h2>
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

    router.replace(searchParams.get("next") || "/dashboard");
  };

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <span className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">Authentication</span>
        <div className="w-12" />
      </div>

      <div className="px-6 pt-6 pb-2 text-center">
        <h2 className="text-2xl font-bold text-white">ChemSAGE</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Student Portal</p>
      </div>

      {/* Tab switcher */}
      <div className="flex px-6 pt-3 pb-5">
        <button
          onClick={() => setActiveTab("login")}
          className={`flex-1 rounded-l-lg border py-2.5 text-sm font-semibold transition-all ${
            activeTab === "login"
              ? "border-[var(--accent)] bg-[var(--accent)] text-black"
              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => { setActiveTab("signup"); router.push("/signup"); }}
          className={`flex-1 rounded-r-lg border border-l-0 py-2.5 text-sm font-semibold transition-all ${
            activeTab === "signup"
              ? "border-[var(--accent)] bg-[var(--accent)] text-black"
              : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="px-6 pb-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
              Email Address
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
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm font-medium text-[var(--muted)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <span>Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">Forgot password?</Link>
          </div>

          {error ? <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">{error}</div> : null}

          <button disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] py-3 text-sm font-bold text-black transition-opacity hover:bg-[#bce600] disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">Or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <p className="text-center text-xs font-medium text-[var(--muted)]">
            By continuing, you agree to our{" "}
            <Link href="#" className="text-[var(--accent)] hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
