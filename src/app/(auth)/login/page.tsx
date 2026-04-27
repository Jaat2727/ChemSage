"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Eye, EyeOff, Hexagon, LogIn, ShieldX } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { normalizeEmail } from "@/lib/rollno";

const supabase = createClientComponentClient();

const inputClasses =
  "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none";

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
      <div className="glass-light glass-border animate-scale-in rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 w-fit rounded-full border border-slate-700 bg-slate-900 p-3 text-slate-200">
          {pendingMessage ? <Clock size={26} /> : <ShieldX size={26} />}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">{pendingMessage ? "Pending Approval" : "Account Banned"}</h2>
        <p className="mt-2 text-sm text-slate-400">
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
          className="mt-5 w-full rounded-xl border border-slate-600 bg-slate-900 py-2.5 text-sm text-slate-100"
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
            Invalid email or password. <Link href="/signup" className="underline">Create an account</Link>
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
    <div className="glass-light glass-border animate-scale-in overflow-hidden rounded-2xl">
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-100">
            <Hexagon size={20} className="fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">ChemSAGE</h1>
            <p className="text-xs text-slate-500">Sign in to continue</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Email or Roll Number</label>
            <input
              type="text"
              placeholder="CY25B013 or rollno@smail.iitm.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Password</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? <div className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div> : null}

          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60">
            {loading ? "Signing in..." : <><LogIn size={16} /> Login</>}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-slate-400 hover:text-slate-200">Forgot password?</Link>
            <Link href="/signup" className="text-slate-300 hover:text-slate-100">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
