"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, Shield, Trash2, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ExamPaper, Profile, RegisteredRollNo, ResourceItem } from "@/lib/types";
import { fileToText, formatDateTime } from "@/lib/utils";
import { parseRollNo } from "@/lib/rollno";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();
const tabs = ["Users", "Pending", "Upload CSV", "Content"] as const;
type Tab = (typeof tabs)[number];

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Users");
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterProgramme, setFilterProgramme] = useState("All");
  const [csvData, setCsvData] = useState<RegisteredRollNo[]>([]);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;
    const load = async () => {
      const [{ data: p }, { data: r }, { data: e }] = await Promise.all([
        supabase.from<Profile>("profiles").select("*"),
        supabase.from<ResourceItem>("resources").select("*").order("created_at", { ascending: false }),
        supabase.from<ExamPaper>("exam_papers").select("*").order("created_at", { ascending: false }),
      ]);
      setAllProfiles(Array.isArray(p) ? p : []);
      setResources(Array.isArray(r) ? r : []);
      setPapers(Array.isArray(e) ? e : []);
      setLoading(false);
    };
    void load();
  }, [profile]);

  const activeUsers = useMemo(() => allProfiles.filter((p) => p.status === "active"), [allProfiles]);
  const pendingUsers = useMemo(() => allProfiles.filter((p) => p.status === "pending"), [allProfiles]);
  const filteredUsers = useMemo(() => {
    return activeUsers.filter((p) => {
      const matchProgramme = filterProgramme === "All" || p.programme === filterProgramme;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.roll_no || "").toLowerCase().includes(search.toLowerCase());
      return matchProgramme && matchSearch;
    });
  }, [activeUsers, filterProgramme, search]);

  if (!profile) return <LoadingCard />;
  if (profile.role !== "admin") return <LockedScreen title="Admin only" description="This section is restricted to administrators." />;
  if (loading) return <LoadingCard title="Loading admin panel..." />;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <PageHeader title="Admin Panel" description="Manage users, approve sign-ups, import student rolls, and curate shared content." profile={profile} />

      <InlineAlert message={error} />
      <InlineAlert tone="success" message={success} />

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-2 backdrop-blur-sm">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setError(null); setSuccess(null); }} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === tab ? "bg-red-500/10 text-red-300 shadow-sm" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`}>
            {tab}
            {tab === "Pending" && pendingUsers.length > 0 ? <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{pendingUsers.length}</span> : null}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "Users" ? (
        <div className="animate-fade-in">
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
            <select value={filterProgramme} onChange={(e) => setFilterProgramme(e.target.value)} className="rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20">
              <option value="All">All Programmes</option>
              <option value="BS">BS</option>
              <option value="MSc">MSc</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="group flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 px-5 py-4 backdrop-blur-sm transition-all hover:bg-slate-900/60">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-sm font-bold text-blue-300">{user.name?.[0]?.toUpperCase() || "?"}</div>
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-xs font-medium text-slate-400">{user.roll_no} • {user.programme} • {user.batch_year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === "admin" ? <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300"><Shield size={12} /> Admin</span> : null}
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${user.status === "active" ? "bg-emerald-500/10 text-emerald-300" : user.status === "banned" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>{user.status}</span>
                  {user.role !== "admin" ? (
                    <button onClick={async () => {
                      const newStatus = user.status === "banned" ? "active" : "banned";
                      const { error: updateError } = await supabase.from<Profile>("profiles").update({ status: newStatus }).eq("id", user.id);
                      if (updateError) setError(updateError.message);
                      else setAllProfiles((current) => current.map((p) => p.id === user.id ? { ...p, status: newStatus } : p));
                    }} className={`rounded-xl px-4 py-2 text-xs font-semibold opacity-0 transition-all group-hover:opacity-100 ${user.status === "banned" ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-300 hover:bg-red-500/20"}`}>
                      {user.status === "banned" ? "Unban" : "Ban"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Pending Tab */}
      {activeTab === "Pending" ? (
        <div className="animate-fade-in space-y-3">
          {pendingUsers.length === 0 ? <EmptyState title="No pending users" description="All sign-ups have been reviewed." /> : null}
          {pendingUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-300">{user.name?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-xs font-medium text-slate-400">{user.roll_no} • {user.programme} • {user.batch_year}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  const { error: updateError } = await supabase.from<Profile>("profiles").update({ status: "active" }).eq("id", user.id);
                  if (updateError) setError(updateError.message);
                  else {
                    setAllProfiles((current) => current.map((p) => p.id === user.id ? { ...p, status: "active" } : p));
                    setSuccess(`${user.name} approved successfully.`);
                  }
                }} className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-[0.97]">
                  <Check size={16} /> Approve
                </button>
                <button onClick={async () => {
                  const { error: deleteError } = await supabase.from<Profile>("profiles").delete().eq("id", user.id);
                  if (deleteError) { setError(deleteError.message); return; }
                  try {
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`;
                    await fetch(url, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
                      body: JSON.stringify({ user_id: user.id }),
                    });
                  } catch {}
                  setAllProfiles((current) => current.filter((p) => p.id !== user.id));
                  setSuccess(`${user.name} rejected and removed.`);
                }} className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 active:scale-[0.97]">
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Upload CSV Tab */}
      {activeTab === "Upload CSV" ? (
        <div className="animate-fade-in">
          <div className="mb-6 rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/30 p-8 text-center backdrop-blur-sm">
            <Upload size={32} className="mx-auto mb-3 text-slate-500" />
            <p className="mb-4 text-sm font-medium text-slate-400">Upload a CSV file with columns: roll_no, name</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-600 hover:to-blue-700 active:scale-[0.97]">
              <Download size={16} /> Choose CSV
              <input type="file" accept=".csv" className="hidden" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
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
              }} />
            </label>
          </div>
          {csvData.length > 0 ? (
            <div className="animate-slide-up rounded-2xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-800/50 px-5 py-3">
                <p className="text-sm font-bold text-white">{csvData.length} records parsed</p>
                <button onClick={async () => {
                  setError(null);
                  const { error: upsertError } = await supabase.from<RegisteredRollNo>("registered_rollnos").upsert(csvData, { onConflict: "roll_no" });
                  if (upsertError) setError(upsertError.message);
                  else {
                    setSuccess(`${csvData.length} roll numbers imported successfully.`);
                    setCsvData([]);
                  }
                }} className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-green-700 active:scale-[0.97]">
                  Import all
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-5">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800/50 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                      <th className="pb-3">Roll No</th><th className="pb-3">Name</th><th className="pb-3">Programme</th><th className="pb-3">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 50).map((row) => (
                      <tr key={row.roll_no} className="border-b border-slate-800/30 text-slate-300 transition-colors hover:bg-white/[0.02]">
                        <td className="py-2.5 font-mono font-semibold text-blue-300">{row.roll_no}</td>
                        <td className="py-2.5">{row.name}</td>
                        <td className="py-2.5">{row.programme}</td>
                        <td className="py-2.5">{row.batch_year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Content Tab */}
      {activeTab === "Content" ? (
        <div className="animate-fade-in space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-bold text-white">Resources ({resources.length})</h2>
            {resources.length === 0 ? <EmptyState title="No resources uploaded" description="Upload files in the Study Vault." /> : null}
            <div className="space-y-2">
              {resources.map((item) => (
                <div key={item.id} className="group flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 px-5 py-4 backdrop-blur-sm transition-all hover:bg-slate-900/60">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-xs font-medium text-slate-400">{item.category} • {formatDateTime(item.created_at)}</p>
                  </div>
                  <button onClick={async () => {
                    const { error: deleteError } = await supabase.from<ResourceItem>("resources").delete().eq("id", item.id);
                    if (deleteError) setError(deleteError.message);
                    else setResources((current) => current.filter((r) => r.id !== item.id));
                  }} className="rounded-full bg-red-500/10 p-2.5 text-red-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 active:scale-90">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-bold text-white">Exam Papers ({papers.length})</h2>
            {papers.length === 0 ? <EmptyState title="No papers uploaded" description="Upload files in the Exam Archive." /> : null}
            <div className="space-y-2">
              {papers.map((item) => (
                <div key={item.id} className="group flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 px-5 py-4 backdrop-blur-sm transition-all hover:bg-slate-900/60">
                  <div>
                    <p className="font-semibold text-white">{item.subject}</p>
                    <p className="text-xs font-medium text-slate-400">{item.exam_type} • {item.semester} {item.year} • {formatDateTime(item.created_at)}</p>
                  </div>
                  <button onClick={async () => {
                    const { error: deleteError } = await supabase.from<ExamPaper>("exam_papers").delete().eq("id", item.id);
                    if (deleteError) setError(deleteError.message);
                    else setPapers((current) => current.filter((p) => p.id !== item.id));
                  }} className="rounded-full bg-red-500/10 p-2.5 text-red-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 active:scale-90">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
