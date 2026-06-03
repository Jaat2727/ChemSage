import { useMemo } from "react";
import { Users, FileText, Database, MessageSquare, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { Profile, ResourceItem, ExamPaper, Room, AdminAuditLog } from "@/lib/types";

interface OverviewProps {
  profiles: Profile[];
  resources: ResourceItem[];
  papers: ExamPaper[];
  rooms: Room[];
  auditLogs: AdminAuditLog[];
}

export default function OverviewSection({ profiles, resources, papers, rooms, auditLogs }: OverviewProps) {
  const stats = useMemo(() => {
    const students = profiles.filter((p) => p.role === "student" && p.status === "active").length;
    const activeUsers = profiles.filter((p) => p.status === "active").length;
    const pending = profiles.filter((p) => p.status === "pending").length;
    
    // Calculate storage
    const resourceBytes = resources.reduce((acc, r) => acc + (r.file_size || 0), 0);
    const paperBytes = papers.reduce((acc, p) => acc + (p.file_size || 0), 0);
    const totalBytes = resourceBytes + paperBytes;
    const storageGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);

    return [
      { label: "Active Students", value: students, icon: Users, color: "text-blue-400" },
      { label: "Total Approved Users", value: activeUsers, icon: Users, color: "text-emerald-400" },
      { label: "Pending Approvals", value: pending, icon: Users, color: pending > 0 ? "text-amber-400" : "text-[var(--muted)]" },
      { label: "Resources Uploaded", value: resources.length, icon: Database, color: "text-[var(--accent)]" },
      { label: "Past Papers", value: papers.length, icon: FileText, color: "text-purple-400" },
      { label: "Active Study Circles", value: rooms.length, icon: MessageSquare, color: "text-pink-400" },
      { label: "Total Storage", value: `${storageGB} GB`, icon: Activity, color: "text-indigo-400" },
    ];
  }, [profiles, resources, papers, rooms]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Platform Overview</h2>
        <p className="text-sm text-[var(--muted)]">High-level metrics for the ChemSAGE workspace.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/30 hover:shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--background)] border border-[var(--border)] ${stat.color}`}>
                  <Icon size={16} />
                </div>
                <span className="text-xs font-semibold text-[var(--muted)]">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-base font-bold text-white mb-4">Recent Administrator Activity</h3>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted)]">No recent activity logged.</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--surface-soft)] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{log.admin?.name || "System"}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
                        {log.action_type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1">Target: {log.target_type} ({log.target_id || "N/A"})</p>
                  </div>
                  <div className="text-xs font-medium text-[var(--muted)] whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
