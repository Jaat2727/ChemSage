"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock, Eye, EyeOff, UserPlus } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { extractRollNo, parseRollNo, normalizeEmail } from "@/lib/rollno";
import type { RegisteredRollNo } from "@/lib/types";

const supabase = createClientComponentClient();

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  if (success) {
    return (
      <div className="mx-auto w-full max-w-sm animate-scale-in rounded-3xl glass-light glass-border p-8 text-center shadow-2xl shadow-blue-950/20">
        <div className="mb-6 flex justify-center">
          <div className="animate-scale-in rounded-full bg-amber-100 p-4 text-amber-600">
            <Clock size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          Account Created!
        </h2>
        <p className="mb-2 leading-relaxed text-slate-500">
          Your account is now <span className="font-bold text-amber-600">pending admin approval</span>.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-slate-400">
          An administrator will review and approve your account. Once approved, you&apos;ll be able to sign in and access ChemSAGE.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 active:scale-[0.98]"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (form.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }
      if (form.password !== form.confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const normalizedEmail = normalizeEmail(form.email);
      const rollNo = extractRollNo(normalizedEmail);
      const parsed = parseRollNo(rollNo);

      // Check registered roll numbers
      const { data: existingRollNo, error: rollError } = await supabase
        .from<RegisteredRollNo>("registered_rollnos")
        .select("roll_no, name, programme, batch_year")
        .eq("roll_no", rollNo)
        .single();
      if (rollError && !/0 rows/i.test(rollError.message)) {
        throw rollError;
      }

      const registered = (existingRollNo as RegisteredRollNo | null) ?? null;

      // Call internal API to queue user via Admin API (bypasses rate limits and email confirmation)
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: form.password,
          name: registered?.name || form.name,
          rollNo: rollNo,
          programme: registered?.programme || parsed.programme,
          batch_year: registered?.batch_year || parsed.batch_year,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("already registered") || data.error?.toLowerCase().includes("already exists")) {
          setError(
            <span>
              Account already exists.{" "}
              <Link href="/login" className="font-bold underline hover:text-red-900 transition-colors">
                Log in instead?
              </Link>
            </span>
          );
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to sign up");
      }

      // Ensure local session is cleared just in case
      await supabase.auth.signOut();

      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <div className="relative my-8 w-full max-w-sm animate-scale-in rounded-3xl glass-light glass-border shadow-2xl shadow-blue-950/20 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-8 pb-8 pt-6">
        <Link
          href="/login"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
            <UserPlus size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Create Account</h1>
            <p className="text-sm font-medium text-white/70">Join ChemSAGE</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-8 pb-6 pt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="John Doe"
              required
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Email or Roll Number</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
              placeholder="CY25B013 or rollno@smail.iitm.ac.in"
              required
              className={inputClasses}
            />
            <p className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
              We automatically convert a roll number into IITM smail email
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                className={`${inputClasses} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                className={`${inputClasses} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="animate-slide-down rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 backdrop-blur-sm">
              {error}
            </div>
          ) : null}

          {/* Info badge about approval */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-700 backdrop-blur-sm">
            <Clock size={14} className="mr-1.5 inline-block" />
            After signing up, an admin will review and approve your account before you can log in.
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:from-blue-500 hover:to-indigo-600 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                "Sign up"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50/80 p-5 text-center">
        <p className="text-sm font-medium text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 transition-colors hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
