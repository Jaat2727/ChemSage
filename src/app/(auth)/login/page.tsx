"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Hexagon, ShieldCheck, Sparkles } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { normalizeSmailIdentifier, rollNoToSmailEmail } from "@/lib/rollno";
import { useAuth } from "@/providers/AuthProvider";
import { InlineAlert } from "@/components/ui/Feedback";

const supabase = createClientComponentClient();
const exampleRollNo = "CY25B013";
const exampleEmail = rollNoToSmailEmail(exampleRollNo);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = normalizeSmailIdentifier(identifier);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }

      const profile = await refreshProfile();
      if (!profile) {
        throw new Error("Profile setup is incomplete. Please contact an administrator.");
      }

      if (profile.status === "pending") {
        router.replace("/");
        return;
      }

      if (profile.status === "banned") {
        throw new Error("This account is currently banned. Please contact the department admin.");
      }

      router.replace(searchParams.get("next") || "/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-[#0f172a] p-10 text-white md:block">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg">
            <Hexagon size={28} className="fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ChemSAGE</h1>
            <p className="text-sm text-slate-300">IIT Madras Chemistry portal</p>
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">
              <Sparkles size={14} /> Quick login tip
            </p>
            <h2 className="text-3xl font-semibold leading-tight">You can sign in using your roll number or your full smail email.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Example: if your roll number is <span className="font-semibold text-white">{exampleRollNo}</span>, just enter
              <span className="font-semibold text-white"> {exampleRollNo}</span> or
              <span className="font-semibold text-white"> {exampleEmail}</span> with your password.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck size={18} />
              <p className="text-sm font-semibold">What happens after login?</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Active profiles go straight to the dashboard.</li>
              <li>• Pending profiles see the approval-locked screen.</li>
              <li>• Banned profiles are blocked with a clear error.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="p-6 sm:p-8 md:p-10">
        <div className="mb-8 flex flex-col items-center text-center md:hidden">
          <div className="mb-4 rounded-xl bg-[#0f172a] p-3 text-white shadow-md">
            <Hexagon size={28} className="fill-current text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">ChemSAGE</h1>
          <p className="text-sm font-medium tracking-wide text-slate-500">IIT Madras Chemistry portal</p>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter <span className="font-semibold text-slate-700">{exampleRollNo}</span> or
            <span className="font-semibold text-slate-700"> {exampleEmail}</span> with your password.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Smail email or roll number</label>
            <input
              type="text"
              placeholder={`${exampleRollNo} or ${exampleEmail}`}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">We automatically convert a roll number like CY25B013 into its IITM smail email.</p>
          </div>

          <div className="relative space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <InlineAlert message={error} />

          <button disabled={loading} className="w-full rounded-2xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-60">
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="flex items-center justify-between gap-3 text-sm">
            <Link href="/forgot-password" className="font-semibold text-blue-600 transition-colors hover:text-blue-800">
              Forgot password?
            </Link>
            <Link href="/signup" className="font-semibold text-slate-600 transition-colors hover:text-slate-900">
              Create account
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
