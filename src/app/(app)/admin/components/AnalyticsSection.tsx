import { useMemo } from "react";
import { Trophy, Download, MessageSquare, Activity, User, FileBox } from "lucide-react";
import type { Profile, ResourceItem, ExamPaper, Room } from "@/lib/types";

interface AnalyticsProps {
  profiles: Profile[];
  resources: ResourceItem[];
  papers: ExamPaper[];
  rooms: Room[];
}

export default function AnalyticsSection({ profiles, resources, papers, rooms }: AnalyticsProps) {
  
  // Calculate top contributors
  const topContributors = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach(r => { counts[r.uploaded_by] = (counts[r.uploaded_by] || 0) + 1; });
    papers.forEach(p => { counts[p.uploaded_by] = (counts[p.uploaded_by] || 0) + 1; });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => {
        const profile = profiles.find(p => p.id === userId);
        return { user: profile, count };
      })
      .filter(item => item.user);
  }, [profiles, resources, papers]);

  // Calculate most downloaded files
  const topDownloads = useMemo(() => {
    const r = resources.map(res => ({ id: res.id, title: res.title, type: "Resource", downloads: res.download_count || 0 }));
    const p = papers.map(pap => ({ id: pap.id, title: pap.subject, type: "Exam Paper", downloads: pap.download_count || 0 }));
    
    return [...r, ...p]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5);
  }, [resources, papers]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Platform Analytics</h2>
        <p className="text-sm text-[var(--muted)]">Insights into user engagement and resource utilization.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Top Contributors */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Top Contributors</h3>
              <p className="text-xs text-[var(--muted)]">Users with the most uploads</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topContributors.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No data available.</p>
            ) : (
              topContributors.map((item, index) => (
                <div key={item.user!.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)] border border-[var(--border)] text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.user!.name}</p>
                      <p className="text-xs text-[var(--muted)]">{item.user!.programme} '{item.user!.batch_year.toString().slice(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--accent)]">{item.count}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Uploads</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Downloaded */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Most Downloaded</h3>
              <p className="text-xs text-[var(--muted)]">Highest engagement files</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {topDownloads.length === 0 || topDownloads.every(d => d.downloads === 0) ? (
              <p className="text-sm text-[var(--muted)]">No download data available.</p>
            ) : (
              topDownloads.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 max-w-[70%]">
                    <FileBox size={16} className="text-[var(--muted)] shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-bold text-white truncate">{item.title}</p>
                      <p className="text-xs text-[var(--muted)]">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{item.downloads}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Downloads</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Study Circles */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Study Circles</h3>
              <p className="text-xs text-[var(--muted)]">Active collaborative rooms</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No study circles created.</p>
            ) : (
              rooms.slice(0, 5).map((room) => (
                <div key={room.id} className="flex flex-col border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-bold text-white">{room.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">{room.description || "No description"}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Activity (Mocked graph area) */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Weekly Activity</h3>
              <p className="text-xs text-[var(--muted)]">Uploads and logins past 7 days</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[150px] flex items-center justify-center border border-dashed border-[var(--border)] rounded-lg bg-[var(--background)]">
            <p className="text-xs text-[var(--muted)]">Chart integration pending</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
