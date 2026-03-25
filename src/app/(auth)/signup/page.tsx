"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { extractRollNo, parseRollNo } from "@/lib/rollno";
import type { Profile, RegisteredRollNo } from "@/lib/types";
import { InlineAlert } from "@/components/ui/Feedback";

const supabase = createClientComponentClient();

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successState, setSuccessState] = useState<"pending" | "active" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (successState) {
    return (
      <div className="mx-auto w-full max-w-sm animate-scale-in rounded-3xl glass-light glass-border p-8 text-center shadow-2xl shadow-blue-950/20">
        <div className="mb-6 flex justify-center">
          <div className="animate-scale-in rounded-full bg-green-100 p-4 text-green-600">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          Account created successfully
        </h2>
        <p className="mb-8 leading-relaxed text-slate-500">
          Your profile is now active. You can sign in immediately to access your workspace.
        </p>
        <Link href="/login" className="block w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 active:scale-[0.98]">
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
      if (form.password !== form.confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const rollNo = extractRollNo(form.email);
      const parsed = parseRollNo(rollNo);

      const { data: existingRollNo, error: rollError } = await supabase
        .from<RegisteredRollNo>("registered_rollnos")
        .select("roll_no, name, programme, batch_year")
        .eq("roll_no", rollNo)
        .single();
      if (rollError && !/0 rows/i.test(rollError.message)) {
        throw rollError;
      }

      const registered = (existingRollNo as RegisteredRollNo | null) ?? null;
      const status = "active";
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (signUpError) throw signUpError;
      const userId = authData?.user?.id ?? authData?.session?.user?.id;
      if (!userId) {
        throw new Error("Account with this email already exists. Please try logging in instead.");
      }

      const profile: Partial<Profile> = {
        id: userId,
        roll_no: rollNo,
        name: registered?.name || form.name,
        programme: registered?.programme || parsed.programme,
        batch_year: registered?.batch_year || parsed.batch_year,
        status,
        role: "student",
      };

      const { error: profileError } = await supabase.from<Profile>("profiles").insert(profile);
      if (profileError) throw profileError;

      setSuccessState(status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <div className="relative my-8 w-full max-w-sm animate-scale-in rounded-3xl glass-light glass-border px-8 pb-6 pt-12 shadow-2xl shadow-blue-950/20">
      <Link href="/login" className="absolute left-6 top-6 flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="mb-8 mt-2 flex flex-col items-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Account</h1>
        <p className="text-sm font-medium tracking-wide text-slate-500">Join ChemSAGE</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            placeholder="John Doe"
            required
            className={inputClasses}
          />
        </div>

        <div className="relative space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
            placeholder="rollno@smail.iitm.ac.in"
            required
            className={inputClasses}
          />
          <p className="mt-1 inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
            Only @smail.iitm.ac.in emails are allowed
          </p>
        </div>

        <div className="relative space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              placeholder="••••••••"
              required
              className={`${inputClasses} pr-12`}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="relative space-y-1.5 pb-2">
          <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm((current) => ({ ...current, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              required
              className={`${inputClasses} pr-12`}
            />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <InlineAlert message={error} />

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
