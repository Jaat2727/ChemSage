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
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-900 shadow-xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-4 text-green-600">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#0f172a]">
          {successState === "pending" ? "Account pending approval" : "Account activated"}
        </h2>
        <p className="mb-8 leading-relaxed text-slate-500">
          {successState === "pending"
            ? "Your profile was created and is waiting for admin approval. We’ll notify you on your smail email once approved."
            : "Your profile is active because your roll number was already registered. You can sign in immediately."}
        </p>
        <Link href="/login" className="block w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800">
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
      const status = registered ? "active" : "pending";
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

  return (
    <div className="relative my-8 w-full max-w-sm rounded-2xl border border-slate-100 bg-white px-8 pb-6 pt-12 text-slate-900 shadow-xl">
      <Link href="/login" className="absolute left-6 top-6 flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-[#0f172a]">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="mb-8 mt-2 flex flex-col items-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Account</h1>
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 inline-block rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <InlineAlert message={error} />

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-60">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
