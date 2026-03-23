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
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-xl">
      <div className="p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-xl bg-[#0f172a] p-3 text-white shadow-md">
            <Hexagon size={28} className="fill-current text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">ChemSAGE</h1>
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="pt-2">
            <button disabled={loading} className="w-full rounded-xl bg-[#0f172a] py-3.5 font-semibold text-white shadow-md transition-colors hover:bg-slate-800 disabled:opacity-60">
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>

          <div className="pt-2 text-center">
            <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800">
              Forgot password?
            </Link>
            <Link href="/signup" className="font-semibold text-slate-600 transition-colors hover:text-slate-900">
              Create account
            </Link>
          </div>
        </form>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-6 text-center">
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
