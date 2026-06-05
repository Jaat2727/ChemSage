"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock, Eye, EyeOff, Shield, FlaskConical } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { extractRollNo, parseRollNo, normalizeEmail } from "@/lib/rollno";
import type { RegisteredRollNo } from "@/lib/types";

const supabase = createClientComponentClient();
const inputClasses = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  if (success) {
    return (
      <div className="animate-scale-in w-full max-w-sm mx-auto">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center shadow-2xl">
          {isAutoApproved ? (
            <>
              <div className="mx-auto mb-4 w-fit rounded-full border border-emerald-800 bg-emerald-950/30 p-4 text-emerald-400">
                <Shield size={28} />
              </div>
              <h2 className="text-xl font-bold text-white">Account Active</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Your account is active and approved! You can now log in immediately.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-fit rounded-full border border-amber-800 bg-amber-950/30 p-4 text-amber-400">
                <Clock size={28} />
              </div>
              <h2 className="text-xl font-bold text-white">Access Requested</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Your account has been created and is pending admin verification. You&apos;ll be able to sign in once approved.
              </p>
            </>
          )}
          <Link href="/login" className="mt-6 block rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black hover:bg-[#bce600] transition-colors">
            Go to Login
          </Link>
        </div>
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
      if (registered) {
        setIsAutoApproved(true);
      } else {
        setIsAutoApproved(false);
      }

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
          setError(<span>This roll number is already registered. <Link href="/login" className="text-[var(--accent)] underline">Sign in instead</Link></span>);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to request access.");
      }

      await supabase.auth.signOut();
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to request access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-sm mx-auto">
      {/* Brand */}
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)]">
          <FlaskConical size={20} strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">ChemSAGE</h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">IITM BS Chemistry Workspace</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl shadow-black/40">
        <div className="px-6 pt-4 pb-1">
          <Link href="/login" className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)] hover:text-white transition-colors">
            <ArrowLeft size={12} /> Back to login
          </Link>
          <h2 className="text-base font-bold text-white">Request Access</h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Verify your IITM identity to join ChemSAGE.
          </p>
        </div>

        <div className="px-6 pt-3 pb-5">
          <form className="space-y-2.5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Your full name" required className={inputClasses} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">IITM Email or Roll Number</label>
              <input type="text" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="CY25B013 or rollno@smail.iitm.ac.in" required className={inputClasses} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} className={`${inputClasses} pr-11`} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))} placeholder="Confirm password" required minLength={6} className={`${inputClasses} pr-11`} />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-[11px] font-medium text-amber-300/90">
              Admin verification required before workspace access.
            </div>

            {error ? <div className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-xs font-medium text-red-300">{error}</div> : null}

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black transition-all hover:bg-[#bce600] disabled:opacity-60 active:scale-[0.98]">
              {loading ? "Submitting..." : "Request Access"}
            </button>
          </form>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-[var(--muted)]">
        <Shield size={12} className="text-[var(--accent)]" />
        <span>Only verified IITM Chemistry students can access ChemSAGE.</span>
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
