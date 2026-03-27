"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Eye, EyeOff, Hexagon, LogIn, ShieldX } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { normalizeEmail } from "@/lib/rollno";

const supabase = createClientComponentClient();

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

  // Show pending screen
  if (pendingMessage) {
    return (
      <div className="w-full max-w-sm animate-scale-in rounded-3xl glass-light glass-border p-8 text-center shadow-2xl shadow-blue-950/20">
        <div className="mb-6 flex justify-center">
          <div className="animate-scale-in rounded-full bg-amber-100 p-4 text-amber-600">
            <Clock size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          Pending Approval
        </h2>
        <p className="mb-8 leading-relaxed text-slate-500">
          Your account has been created but is still <span className="font-bold text-amber-600">waiting for admin approval</span>. You&apos;ll be able to log in once an administrator approves your account.
        </p>
        <button
          onClick={() => { setPendingMessage(false); setError(null); }}
          className="block w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 active:scale-[0.98]"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show banned screen
  if (bannedMessage) {
    return (
      <div className="w-full max-w-sm animate-scale-in rounded-3xl glass-light glass-border p-8 text-center shadow-2xl shadow-blue-950/20">
        <div className="mb-6 flex justify-center">
          <div className="animate-scale-in rounded-full bg-red-100 p-4 text-red-600">
            <ShieldX size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          Account Banned
        </h2>
        <p className="mb-8 leading-relaxed text-slate-500">
          This account has been <span className="font-bold text-red-600">banned by an administrator</span>. Please contact the chemistry department admin if you believe this is an error.
        </p>
        <button
          onClick={() => { setBannedMessage(false); setError(null); }}
          className="block w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 active:scale-[0.98]"
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
            Invalid email or password.{" "}
            <Link href="/signup" className="font-bold underline hover:text-red-900 transition-colors">
              Create an account
            </Link>
          </span>
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
    <div className="w-full max-w-sm animate-scale-in overflow-hidden rounded-3xl glass-light glass-border shadow-2xl shadow-blue-950/20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-8 py-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
            <Hexagon size={28} className="fill-current text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">ChemSAGE</h1>
            <p className="text-sm font-medium text-white/70">Chemistry workspace</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Email or Roll Number</label>
            <input
              type="text"
              placeholder="CY25B013 or rollno@smail.iitm.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <p className="text-xs text-slate-500">We automatically convert a roll number into its IITM smail email.</p>
          </div>

          <div className="relative space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 pr-12 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="animate-slide-down rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 backdrop-blur-sm">
              {error}
            </div>
          ) : null}

          <div className="pt-2">
            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:from-blue-500 hover:to-indigo-600 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  Login
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900">
              Create account
            </Link>
          </div>
        </form>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-blue-600 transition-colors hover:text-blue-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
