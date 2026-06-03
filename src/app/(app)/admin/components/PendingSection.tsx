import { useMemo, useState } from "react";
import { Check, X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import { fileToText } from "@/lib/utils";
import { parseRollNo } from "@/lib/rollno";
import type { Profile, RegisteredRollNo } from "@/lib/types";

interface PendingProps {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  logAdminAction: (action: string, targetType: string, targetId?: string, details?: any) => Promise<void>;
}

export default function PendingSection({ profiles, setProfiles, logAdminAction }: PendingProps) {
  const supabase = createClientComponentClient();
  const [csvData, setCsvData] = useState<RegisteredRollNo[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingUsers = useMemo(() => profiles.filter((p) => p.status === "pending"), [profiles]);

  const handleApprove = async (user: Profile) => {
    const { error: updateError } = await supabase.from("profiles").update({ status: "active" }).eq("id", user.id);
    if (!updateError) {
      setProfiles((cur) => cur.map((p) => p.id === user.id ? { ...p, status: "active" } : p));
      await logAdminAction("approve_user", "user", user.id);
    }
  };

  const handleReject = async (user: Profile) => {
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", user.id);
    if (!deleteError) {
      try {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`;
        await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` 
          },
          body: JSON.stringify({ user_id: user.id }),
        });
      } catch {}
      setProfiles((cur) => cur.filter((p) => p.id !== user.id));
      await logAdminAction("reject_user", "user", user.id);
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const text = await fileToText(file);
      const lines = text.trim().split("\n").slice(1);
      const parsed: RegisteredRollNo[] = lines.map((line) => {
        const parts = line.split(",").map((i) => i.trim().replace(/^"|"$/g, ""));
        const rollNo = parts[0] || "";
        const name = parts[1] || "";
        const p = parseRollNo(rollNo);
        return { roll_no: rollNo, name, programme: p.programme, batch_year: p.batch_year };
      }).filter((item) => item.roll_no);
      setCsvData(parsed);
    } catch (err: any) {
      setError("Failed to parse CSV file.");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    const { error: upsertError } = await supabase.from("registered_rollnos").upsert(csvData, { onConflict: "roll_no" });
    if (upsertError) {
      setError(upsertError.message);
    } else {
      await logAdminAction("import_roll_numbers", "system", undefined, { count: csvData.length });
      setCsvData([]);
    }
    setImporting(false);
  };

  return (
    <div className="space-y-10">
      {/* Approval Queue */}
      <section>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Approval Queue</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Review pending sign-ups. Ensure details match official records.</p>
        </div>

        <div className="space-y-3">
          {pendingUsers.length === 0 ? (
            <EmptyState title="No pending approvals" description="All sign-ups have been reviewed." />
          ) : (
            pendingUsers.map((user) => (
              <div key={user.id} className="flex flex-col justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-lg font-bold text-amber-400">
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{user.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{user.roll_no} • {user.programme} • {user.batch_year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(user)} className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 active:scale-[0.97]">
                    <Check size={16} /> Approve
                  </button>
                  <button onClick={() => handleReject(user)} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20 active:scale-[0.97]">
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <hr className="border-[var(--border)]" />

      {/* CSV Import */}
      <section>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Import Registered Roll Numbers</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Upload a CSV containing verified IITM chemistry students.</p>
        </div>

        <div className="mb-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center transition-colors hover:bg-[var(--surface-soft)]">
          <FileSpreadsheet size={32} className="mx-auto mb-4 text-[var(--muted)]" />
          <p className="mb-2 text-sm font-medium text-white">Upload a CSV file</p>
          <p className="mb-6 text-xs text-[var(--muted)]">Required columns: <strong>roll_no, name</strong></p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#bce600] active:scale-[0.97]">
            <Upload size={16} /> Choose File
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
        </div>

        {error && <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm font-medium text-red-400 border border-red-500/20">{error}</div>}

        {csvData.length > 0 && (
          <div className="animate-fade-in overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4">
              <p className="text-sm font-bold text-white">{csvData.length} records ready to import</p>
              <button 
                onClick={handleImport} 
                disabled={importing}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 active:scale-[0.97] disabled:opacity-50"
              >
                {importing ? "Importing..." : "Confirm Import"}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[var(--surface)] shadow-sm">
                  <tr className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-5 py-3">Roll No</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Programme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {csvData.slice(0, 100).map((row) => (
                    <tr key={row.roll_no} className="hover:bg-[var(--surface-soft)]">
                      <td className="px-5 py-2.5 font-mono text-xs text-[var(--accent)]">{row.roll_no}</td>
                      <td className="px-5 py-2.5 text-[var(--muted)]">{row.name}</td>
                      <td className="px-5 py-2.5 text-[var(--muted)]">{row.programme} '{row.batch_year.toString().slice(2)}</td>
                    </tr>
                  ))}
                  {csvData.length > 100 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-center text-xs text-[var(--muted)] italic">
                        ... and {csvData.length - 100} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
