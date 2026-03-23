"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Hexagon } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { InlineAlert } from "@/components/ui/Feedback";

const supabase = createClientComponentClient();

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
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

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const profile = await refreshProfile();
    if (!profile) {
      setError("Profile setup is incomplete. Please contact an administrator.");
      setLoading(false);
      return;
    }

    if (profile.status === "pending") {
      router.replace("/");
      return;
    }

    if (profile.status === "banned") {
      setError("This account is currently banned. Please contact the department admin.");
      setLoading(false);
      return;
    }

    router.replace(searchParams.get("next") || "/");
  };

  return (
    <div className="w-full max-w-sm animate-scale-in overflow-hidden rounded-3xl glass-light glass-border shadow-2xl shadow-blue-950/20">
      <div className="p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 animate-float rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3.5 text-white shadow-lg shadow-blue-600/30">
            <Hexagon size={28} className="fill-current" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">ChemSAGE</h1>
          <p className="text-sm font-medium tracking-wide text-slate-500">Chemistry workspace</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              placeholder="rollno@smail.iitm.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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

          <InlineAlert message={error} />

          <div className="pt-2">
            <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 py-3.5 font-semibold text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl hover:shadow-slate-900/40 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100">
              {loading ? "Signing in..." : "Login"}
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
