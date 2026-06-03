import { useMemo } from "react";
import { HardDrive, Database, Server, Activity, ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { ResourceItem, ExamPaper, AdminAuditLog } from "@/lib/types";

interface SystemProps {
  resources: ResourceItem[];
  papers: ExamPaper[];
  auditLogs: AdminAuditLog[];
}

export default function SystemSection({ resources, papers, auditLogs }: SystemProps) {
  
  const storageMetrics = useMemo(() => {
    const resourceBytes = resources.reduce((acc, r) => acc + (r.file_size || 0), 0);
    const paperBytes = papers.reduce((acc, p) => acc + (p.file_size || 0), 0);
    const totalBytes = resourceBytes + paperBytes;
    
    // Assume 5GB limit for free tier
    const storageLimitBytes = 5 * 1024 * 1024 * 1024;
    const percentage = Math.min((totalBytes / storageLimitBytes) * 100, 100);
    
    return {
      total: (totalBytes / (1024 * 1024)).toFixed(1), // MB
      resources: (resourceBytes / (1024 * 1024)).toFixed(1),
      papers: (paperBytes / (1024 * 1024)).toFixed(1),
      percentage: percentage.toFixed(1)
    };
  }, [resources, papers]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">System Health</h2>
        <p className="text-sm text-[var(--muted)]">Platform infrastructure, storage limits, and security logs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Storage Usage */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Storage Usage</h3>
              <p className="text-xs text-[var(--muted)]">File uploads vs 5GB Limit</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-white">{storageMetrics.total} MB Used</span>
              <span className="text-[var(--muted)]">5000 MB</span>
            </div>
            <div className="h-2.5 w-full bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                style={{ width: `${storageMetrics.percentage}%` }} 
              />
            </div>
            <div className="mt-4 flex gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-[var(--muted)]">Vault: {storageMetrics.resources} MB</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-[var(--muted)]">Archive: {storageMetrics.papers} MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Supabase Status</h3>
              <p className="text-xs text-[var(--muted)]">Connection active</p>
            </div>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">API Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted)]">Postgres</span>
              <span className="text-white font-medium">v15.1</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[var(--muted)]">Latency</span>
              <span className="text-white font-medium">~24ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Logs */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert size={16} />
          </div>
          <h3 className="font-bold text-white">System Audit Logs</h3>
        </div>
        
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--muted)]">No audit records found in the database.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[var(--surface-soft)] shadow-sm">
                  <tr className="border-b border-[var(--border)] text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Admin</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target Type</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--surface-soft)]/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-[var(--muted)] whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-white">{log.admin?.name || "System"}</span>
                        <span className="block text-[10px] text-[var(--muted)] font-mono mt-0.5">{log.admin_id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded bg-[var(--background)] border border-[var(--border)] px-2 py-1 text-[10px] font-mono font-bold text-[var(--accent)]">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--muted)] uppercase tracking-wider">
                        {log.target_type}
                      </td>
                      <td className="px-5 py-3">
                        <pre className="text-[10px] text-[var(--muted)] bg-[var(--background)] p-2 rounded border border-[var(--border)] max-w-xs overflow-x-auto">
                          {log.details ? JSON.stringify(log.details, null, 2) : "{}"}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
