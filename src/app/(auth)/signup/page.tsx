"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock, Eye, EyeOff } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { extractRollNo, parseRollNo, normalizeEmail } from "@/lib/rollno";
import type { RegisteredRollNo } from "@/lib/types";

const supabase = createClientComponentClient();
const inputClasses = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  if (success) {
    return (
      <div className="glass-light glass-border animate-scale-in rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 w-fit rounded-full border border-slate-700 bg-slate-900 p-3 text-slate-200"><Clock size={24} /></div>
        <h2 className="text-xl font-semibold text-slate-100">Account Created</h2>
        <p className="mt-2 text-sm text-slate-400">Your account is pending admin approval.</p>
        <Link href="/login" className="mt-5 block rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900">Back to Login</Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (form.password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword) throw new Error("Passwords do not match.");

      const normalizedEmail = normalizeEmail(form.email);
      const rollNo = extractRollNo(normalizedEmail);
      const parsed = parseRollNo(rollNo);

      const { data: existingRollNo, error: rollError } = await supabase
        .from<RegisteredRollNo>("registered_rollnos")
        .select("roll_no, name, programme, batch_year")
        .eq("roll_no", rollNo)
        .single();
      if (rollError && !/0 rows/i.test(rollError.message)) throw rollError;

      const registered = (existingRollNo as RegisteredRollNo | null) ?? null;

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: form.password,
          name: registered?.name || form.name,
          rollNo,
          programme: registered?.programme || parsed.programme,
          batch_year: registered?.batch_year || parsed.batch_year,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("already registered") || data.error?.toLowerCase().includes("already exists")) {
          setError(<span>Account already exists. <Link href="/login" className="underline">Log in instead?</Link></span>);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to sign up");
      }

      await supabase.auth.signOut();
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-light glass-border animate-scale-in rounded-2xl p-6">
      <Link href="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"><ArrowLeft size={15} /> Back</Link>
      <h1 className="text-xl font-semibold text-slate-100">Create account</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Minimal, secure onboarding.</p>

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Full name" required className={inputClasses} />
        <input type="text" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email or roll number" required className={inputClasses} />

        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} placeholder="Password" required minLength={6} className={`${inputClasses} pr-11`} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>

        <div className="relative">
          <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))} placeholder="Confirm password" required minLength={6} className={`${inputClasses} pr-11`} />
          <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>

        <div className="rounded-xl border border-amber-900 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">After signup, admin approval is required before login.</div>
        {error ? <div className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div> : null}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60">{loading ? "Creating account..." : "Sign up"}</button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <Link href="/login" className="text-slate-200">Sign in</Link></p>
    </div>
  );
}
