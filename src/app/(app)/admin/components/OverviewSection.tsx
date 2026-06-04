import { Users, FileText, Database, MessageSquare, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { AdminAuditLog } from "@/lib/types";

interface OverviewProps {
  stats: any;
  auditLogs: AdminAuditLog[];
}

export default function OverviewSection({ stats, auditLogs }: OverviewProps) {
  const storageGB = stats ? (stats.total_storage_bytes / (1024 * 1024 * 1024)).toFixed(2) : "0.00";

  const statCards = [
    { label: "Active Students", value: stats?.active_students || 0, icon: Users, color: "text-blue-400" },
    { label: "Total Approved Users", value: stats?.active_users || 0, icon: Users, color: "text-emerald-400" },
    { label: "Pending Approvals", value: stats?.pending_users || 0, icon: Users, color: (stats?.pending_users || 0) > 0 ? "text-amber-400" : "text-[var(--muted)]" },
    { label: "Resources Uploaded", value: stats?.total_resources || 0, icon: Database, color: "text-[var(--accent)]" },
    { label: "Past Papers", value: stats?.total_papers || 0, icon: FileText, color: "text-purple-400" },
    { label: "Active Study Circles", value: stats?.total_rooms || 0, icon: MessageSquare, color: "text-pink-400" },
    { label: "Total Storage", value: `${storageGB} GB`, icon: Activity, color: "text-indigo-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Platform Overview</h2>
        <p className="text-sm text-[var(--muted)]">High-level metrics for the ChemSAGE workspace.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
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
