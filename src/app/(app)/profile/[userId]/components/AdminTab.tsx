import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, Key, Clock, Shield } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import { LoadingCard, EmptyState } from "@/components/ui/Feedback";
import type { Profile, AdminAuditLog } from "@/lib/types";

export default function AdminTab({ profile }: { profile: Profile }) {
  const supabase = createClientComponentClient();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      // Find logs where target_id is this user
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*, admin:admin_id(name)")
        .eq("target_type", "user")
        .eq("target_id", profile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLogs(data as AdminAuditLog[]);
      }
      setLoading(false);
    };

    void fetchLogs();
  }, [profile.id]);

  if (loading) return <LoadingCard />;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
        <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-bold text-amber-400">Moderator Access</p>
          <p className="text-xs text-amber-400/80 mt-1">
            This tab is only visible to administrators. It contains raw account metadata and moderation history.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-4">Account Security</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] flex items-center gap-2"><Key size={14} /> ID</span>
              <span className="text-xs font-mono text-white bg-[var(--background)] px-2 py-1 rounded">{profile.id}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] flex items-center gap-2"><Shield size={14} /> Role</span>
              <span className={`text-xs font-bold uppercase ${profile.role === 'admin' ? 'text-amber-400' : 'text-gray-300'}`}>
                {profile.role}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] flex items-center gap-2"><AlertTriangle size={14} /> Status</span>
              <span className={`text-xs font-bold uppercase ${profile.status === 'active' ? 'text-emerald-400' : profile.status === 'banned' ? 'text-red-400' : 'text-amber-400'}`}>
                {profile.status}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2">
              <span className="text-xs text-[var(--muted)] flex items-center gap-2"><Clock size={14} /> Registered At</span>
              <span className="text-xs font-mono text-white">{formatDateTime(profile.created_at || "")}</span>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col">
          <h3 className="text-sm font-bold text-white mb-4">Moderation History</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 max-h-[300px] scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {logs.length === 0 ? (
              <EmptyState title="Clean record" description="No moderation actions have been taken against this user." />
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">
                        {log.action_type}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-xs text-white">Action performed by <strong className="text-white">{(log.admin as any)?.name || "Unknown Admin"}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
