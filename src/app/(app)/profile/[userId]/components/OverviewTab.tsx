import { useMemo } from "react";
import { User, Activity, TrendingUp, CheckCircle2, ShieldAlert, Star } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function OverviewTab({ profile, isOwner }: { profile: Profile; isOwner: boolean }) {
  const calculateCompletion = () => {
    let score = 0;
    const fields = [
      profile.avatar_url,
      profile.banner_url,
      profile.bio,
      profile.academic_interests?.length,
      profile.preferred_subjects?.length
    ];
    fields.forEach(f => { if (f) score += 20; });
    return score;
  };
  
  const completion = calculateCompletion();
  const initials = profile.name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Account Overview</h2>
        <p className="text-sm text-[var(--muted)]">At-a-glance summary of your identity and community presence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Profile Completion Card (Owner Only) */}
        {isOwner && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profile Setup</h3>
            </div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black text-white">{completion}%</span>
              <span className="text-xs font-bold text-[var(--muted)]">{completion === 100 ? "Complete" : "Incomplete"}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--surface-soft)] overflow-hidden">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
        )}

        {/* Reputation Score Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Star size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reputation Score</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white">{profile.reputation_score || 0}</span>
            <span className="text-xs font-bold text-[var(--muted)] mb-1 pb-0.5">PTS</span>
          </div>
        </div>

        {/* Account Status Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldAlert size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Status</h3>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              profile.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
              profile.status === "pending" ? "bg-amber-500/10 text-amber-400" :
              "bg-red-500/10 text-red-400"
            }`}>
              {profile.status}
            </span>
          </div>
        </div>

      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Banner */}
        <div 
          className="h-32 w-full bg-[var(--surface-soft)] relative overflow-hidden bg-cover bg-center"
          style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : {}}
        />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-[var(--surface)] bg-[var(--background)] shadow-xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-[var(--accent)]">{initials}</span>
              )}
            </div>
            <div className="mb-1">
              <h1 className="text-xl font-bold text-white">{profile.name}</h1>
              <p className="text-xs font-mono text-[var(--muted)] mt-1">{profile.roll_no} • {profile.programme} '{profile.batch_year.toString().slice(2)}</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-300">
            {profile.bio || "No biography provided."}
          </div>
        </div>
      </div>

    </div>
  );
}
