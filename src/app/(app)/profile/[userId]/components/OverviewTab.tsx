import { useEffect, useState } from "react";
import { 
  FileText, Database, Download, Star, Users, CheckSquare, 
  TrendingUp, Award, Trophy
} from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { LoadingCard } from "@/components/ui/Feedback";
import type { Profile } from "@/lib/types";

export default function OverviewTab({ profile }: { profile: Profile }) {
  const supabase = createClientComponentClient();
  const [stats, setStats] = useState({
    resources: 0,
    papers: 0,
    downloads: 0,
    starred: 0,
    groups: 0,
    tasks: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Run queries in parallel
      const [
        { data: resources },
        { data: papers },
        { count: starred },
        { count: groups },
      ] = await Promise.all([
        supabase.from("resources").select("created_at, download_count").eq("uploaded_by", profile.id),
        supabase.from("exam_papers").select("created_at, download_count").eq("uploaded_by", profile.id),
        supabase.from("stars").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("room_members").select("*", { count: "exact", head: true }).eq("user_id", profile.id)
      ]);

      let totalDownloads = 0;
      let contributionsThisMonth = 0;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      if (resources) {
        resources.forEach(r => {
          totalDownloads += (r.download_count || 0);
          if (new Date(r.created_at) >= monthStart) contributionsThisMonth++;
        });
      }
      
      if (papers) {
        papers.forEach(p => {
          totalDownloads += (p.download_count || 0);
          if (new Date(p.created_at) >= monthStart) contributionsThisMonth++;
        });
      }

      setStats({
        resources: resources?.length || 0,
        papers: papers?.length || 0,
        downloads: totalDownloads,
        starred: starred || 0,
        groups: groups || 0,
        tasks: 0, // Mocked until Tasks module is fully integrated globally
        thisMonth: contributionsThisMonth,
      });
      setLoading(false);
    };

    void fetchStats();
  }, [profile.id]);

  if (loading) return <LoadingCard />;

  const statCards = [
    { label: "Resources", value: stats.resources, icon: Database, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" },
    { label: "Past Papers", value: stats.papers, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Downloads", value: stats.downloads, icon: Download, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Starred", value: stats.starred, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Study Circles", value: stats.groups, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Tasks Done", value: stats.tasks, icon: CheckSquare, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column - Academic Stats */}
      <div className="md:col-span-2 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Academic Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-white/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interests Section */}
        {(profile.academic_interests?.length || profile.preferred_subjects?.length) ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Academic Focus</h3>
            <div className="space-y-4">
              {profile.preferred_subjects && profile.preferred_subjects.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">Preferred Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferred_subjects.map(s => (
                      <span key={s} className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.academic_interests && profile.academic_interests.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">Research Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.academic_interests.map(i => (
                      <span key={i} className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Right Column - Community */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Community Status</h2>
          
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6 mb-4 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Trophy size={100} className="text-amber-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Reputation</span>
              </div>
              <p className="text-4xl font-extrabold text-white">
                {stats.downloads + (stats.resources + stats.papers) * 5}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">Earn reputation by uploading resources that get downloaded.</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">This Month</p>
                <p className="text-xs text-[var(--muted)]">New Contributions</p>
              </div>
            </div>
            <span className="text-xl font-bold text-[var(--accent)]">+{stats.thisMonth}</span>
          </div>

          {/* Simple contribution rank (Mocked for now since it requires complex aggregations across all users) */}
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Contribution Rank</p>
            <p className="text-sm text-gray-300">
              Top {(Math.max(1, 100 - (stats.resources + stats.papers) * 2))}% Contributor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
