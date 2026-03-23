"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import { fileToText, formatDateTime } from "@/lib/utils";
import { parseRollNo } from "@/lib/rollno";
import type { ExamPaper, Profile, RegisteredRollNo, ResourceItem } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

const tabs = ["Users", "Pending", "Upload CSV", "Content"] as const;
const programmeFilters = ["All", "BS", "MSc", "PhD"] as const;
const supabase = createClientComponentClient();

interface ParsedCsvRow extends RegisteredRollNo {
  skipped?: boolean;
}

export default function AdminPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Users");
  const [users, setUsers] = useState<Profile[]>([]);
  const [pending, setPending] = useState<Profile[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState<(typeof programmeFilters)[number]>("All");
  const [csvRows, setCsvRows] = useState<ParsedCsvRow[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      router.replace("/");
      return;
    }
    if (!profile || profile.role !== "admin") {
      return;
    }

    const load = async () => {
      const [profilesResponse, resourcesResponse, papersResponse] = await Promise.all([
        supabase.from<Profile>("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from<ResourceItem>("resources").select("*").order("created_at", { ascending: false }),
        supabase.from<ExamPaper>("exam_papers").select("*").order("created_at", { ascending: false }),
      ]);
      if (profilesResponse.error) setError(profilesResponse.error.message);
      if (resourcesResponse.error) setError(resourcesResponse.error.message);
      if (papersResponse.error) setError(papersResponse.error.message);
      const allProfiles = Array.isArray(profilesResponse.data) ? profilesResponse.data : [];
      setUsers(allProfiles);
      setPending(allProfiles.filter((item) => item.status === "pending"));
      setResources(Array.isArray(resourcesResponse.data) ? resourcesResponse.data : []);
      setPapers(Array.isArray(papersResponse.data) ? papersResponse.data : []);
      setLoading(false);
    };
    void load();
  }, [profile, router]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesProgramme = programmeFilter === "All" || user.programme === programmeFilter;
    const query = search.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(query) || user.roll_no.toLowerCase().includes(query);
    return matchesProgramme && matchesSearch;
  }), [programmeFilter, search, users]);

  const updateUserStatus = async (userId: string, status: Profile["status"]) => {
    const { error: updateError } = await supabase.from<Profile>("profiles").update({ status }).eq("id", userId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status } : user)));
    setPending((current) => current.filter((user) => user.id !== userId || status === "pending"));
  };

  if (!profile) return <LoadingCard />;
  if (profile.role !== "admin") return <LockedScreen title="Admin only" description="This route is protected by the profile role check and redirects non-admins back to the dashboard in production." />;

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <PageHeader title="Admin Panel" description="Manage users, roll number imports, and storage-backed content without exposing the service role key to the client." profile={profile} action={<div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300"><Shield size={16} /> Admin access</div>} />
      <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        {tabs.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === item ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
            {item}
          </button>
        ))}
      </div>
      <InlineAlert tone={result ? "success" : "error"} message={result || error} />
      {loading ? <LoadingCard title="Loading admin data..." /> : null}

      {!loading && tab === "Users" ? (
        <section>
          <div className="mb-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number" className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-500" />
            <div className="flex flex-wrap gap-2">
              {programmeFilters.map((item) => (
                <button key={item} onClick={() => setProgrammeFilter(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${programmeFilter === item ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300"}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-[#0f172a]/80 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <p className="text-sm text-slate-400">{user.roll_no} • {user.programme} {user.batch_year} • {user.role}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{user.status}</p>
                </div>
                <div className="flex gap-2">
                  {user.status === "banned" ? (
                    <button onClick={() => void updateUserStatus(user.id, "active")} className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">Unban</button>
                  ) : (
                    <button onClick={() => void updateUserStatus(user.id, "banned")} className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">Ban</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && tab === "Pending" ? (
        <section className="space-y-4">
          {!pending.length ? <EmptyState title="No pending accounts" description="Every signup has already been reviewed." /> : null}
          {pending.map((user) => (
            <div key={user.id} className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-[#0f172a]/80 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-sm text-slate-400">{user.roll_no} • {user.programme} {user.batch_year}</p>
                <p className="mt-1 text-xs text-slate-500">Created {formatDateTime(user.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void updateUserStatus(user.id, "active")} className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">Approve</button>
                <button onClick={async () => {
                  const { error: deleteProfileError } = await supabase.from<Profile>("profiles").delete().eq("id", user.id);
                  if (deleteProfileError) {
                    setError(deleteProfileError.message);
                    return;
                  }
                  const { error: invokeError } = await supabase.functions.invoke("delete-user", { body: { user_id: user.id } });
                  if (invokeError) {
                    setError(invokeError.message);
                    return;
                  }
                  setPending((current) => current.filter((item) => item.id !== user.id));
                  setUsers((current) => current.filter((item) => item.id !== user.id));
                }} className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">Reject</button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {!loading && tab === "Upload CSV" ? (
        <section className="rounded-3xl border border-slate-800 bg-[#0f172a]/80 p-6">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><Upload size={16} /> Choose CSV<input type="file" accept=".csv" className="hidden" onChange={async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const text = await fileToText(file);
            const lines = text.trim().split(/\r?\n/);
            const [, ...rows] = lines;
            const parsed = rows.map((line) => {
              const [roll_no, name] = line.split(",").map((item) => item.trim());
              const meta = parseRollNo(roll_no);
              return { roll_no: meta.roll_no, name, programme: meta.programme, batch_year: meta.batch_year } as ParsedCsvRow;
            });
            setCsvRows(parsed);
            setResult(null);
          }} /></label>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400"><tr><th className="px-4 py-3">Roll No</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Programme</th><th className="px-4 py-3">Batch</th></tr></thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-200">
                {csvRows.map((row) => <tr key={row.roll_no}><td className="px-4 py-3">{row.roll_no}</td><td className="px-4 py-3">{row.name}</td><td className="px-4 py-3">{row.programme}</td><td className="px-4 py-3">{row.batch_year}</td></tr>)}
              </tbody>
            </table>
          </div>
          {csvRows.length ? <button onClick={async () => {
            const { data, error: upsertError } = await supabase.from<RegisteredRollNo>("registered_rollnos").upsert(csvRows, { onConflict: "roll_no" });
            if (upsertError) {
              setError(upsertError.message);
              return;
            }
            const imported = Array.isArray(data) ? data.length : csvRows.length;
            setResult(`${imported} imported, ${Math.max(csvRows.length - imported, 0)} skipped.`);
          }} className="mt-6 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Confirm import</button> : null}
        </section>
      ) : null}

      {!loading && tab === "Content" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-[#0f172a]/80 p-6">
            <h2 className="text-xl font-semibold text-white">Study vault uploads</h2>
            <div className="mt-4 space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <div><p className="font-semibold text-white">{resource.title}</p><p className="text-xs text-slate-500">{resource.category}</p></div>
                  <button onClick={async () => {
                    const path = resource.file_url.split("study-vault/")[1];
                    if (path) await supabase.storage.from("study-vault").remove([path]);
                    await supabase.from<ResourceItem>("resources").delete().eq("id", resource.id);
                    setResources((current) => current.filter((item) => item.id !== resource.id));
                  }} className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">Delete</button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-[#0f172a]/80 p-6">
            <h2 className="text-xl font-semibold text-white">Exam archive uploads</h2>
            <div className="mt-4 space-y-3">
              {papers.map((paper) => (
                <div key={paper.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <div><p className="font-semibold text-white">{paper.subject}</p><p className="text-xs text-slate-500">{paper.exam_type}</p></div>
                  <button onClick={async () => {
                    const path = paper.file_url.split("exam-archive/")[1];
                    if (path) await supabase.storage.from("exam-archive").remove([path]);
                    await supabase.from<ExamPaper>("exam_papers").delete().eq("id", paper.id);
                    setPapers((current) => current.filter((item) => item.id !== paper.id));
                  }} className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
