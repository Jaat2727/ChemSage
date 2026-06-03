"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock, Eye, EyeOff } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { extractRollNo, parseRollNo, normalizeEmail } from "@/lib/rollno";
import type { RegisteredRollNo } from "@/lib/types";

const supabase = createClientComponentClient();
const inputClasses = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  if (success) {
    return (
      <div className="animate-scale-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 w-fit rounded-full border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--muted)]"><Clock size={24} /></div>
        <h2 className="text-xl font-bold text-white">Account Created</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Your account is pending admin approval.</p>
        <Link href="/login" className="mt-6 block rounded-lg border border-[var(--accent)] bg-[var(--accent)] py-2.5 text-sm font-bold text-black hover:bg-[#bce600] transition-colors">Back to Login</Link>
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
        .from("registered_rollnos")
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
          setError(<span>Account already exists. <Link href="/login" className="text-[var(--accent)] underline">Log in instead?</Link></span>);
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
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <span className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">Registration</span>
        <div className="w-12" />
      </div>

      <div className="p-6">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to login
        </Link>
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="mb-6 mt-1 text-sm text-[var(--muted)]">Join the ChemSAGE student portal.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Your full name" required className={inputClasses} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">Email Address</label>
            <input type="text" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="Email or roll number" required className={inputClasses} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} className={`${inputClasses} pr-11`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">Confirm Password</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))} placeholder="Confirm password" required minLength={6} className={`${inputClasses} pr-11`} />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-300">Admin approval is required before you can log in.</div>
          {error ? <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">{error}</div> : null}

          <button type="submit" disabled={loading} className="mt-2 w-full rounded-lg border border-[var(--accent)] bg-[var(--accent)] py-3 text-sm font-bold text-black transition-opacity hover:bg-[#bce600] disabled:opacity-60">{loading ? "Creating Account..." : "Create Account"}</button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-[var(--muted)]">Already have an account? <Link href="/login" className="text-[var(--accent)] hover:underline">Log in</Link></p>
      </div>
    </div>
  );
}
