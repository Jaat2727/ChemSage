import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { ShieldCheck, Mail, Key, LogIn, AlertTriangle } from "lucide-react";
import type { Profile } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export default function SecurityTab({ profile }: { profile: Profile }) {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState<string>("Loading...");
  const [lastLogin, setLastLogin] = useState<string>("Unknown");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    const fetchAuthDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "Unknown");
        if (user.last_sign_in_at) {
          const date = new Date(user.last_sign_in_at);
          setLastLogin(`${date.toLocaleDateString()} at ${formatTime(user.last_sign_in_at)}`);
        }
        setIsVerified(!!user.email_confirmed_at);
      }
    };
    void fetchAuthDetails();
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Security & Access</h2>
        <p className="text-sm text-[var(--muted)]">Review your account's security status and active sessions.</p>
      </div>

      <div className="space-y-4">
        {/* Email & Verification */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Email Address</p>
              <p className="text-sm font-bold text-white">{email}</p>
            </div>
          </div>
          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={14} /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                <AlertTriangle size={14} /> Unverified
              </span>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
              <Key size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Password</p>
              <p className="text-sm font-bold text-white">••••••••••••</p>
            </div>
          </div>
          <button className="text-xs font-bold text-black bg-[var(--accent)] hover:opacity-90 px-4 py-2 rounded-lg transition-colors">
            Reset Password
          </button>
        </div>

        {/* Last Login */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
              <LogIn size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Last Login Session</p>
              <p className="text-sm font-bold text-white">{lastLogin}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
