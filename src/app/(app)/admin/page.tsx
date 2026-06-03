"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Download, Shield, Trash2, Upload, X } from "lucide-react";
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

interface AdminNotification {
  id: string;
  type: string;
  message: string;
  related_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

export default function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Users");
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterProgramme, setFilterProgramme] = useState("All");
  const [csvData, setCsvData] = useState<RegisteredRollNo[]>([]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;
    const load = async () => {
      const [{ data: p }, { data: r }, { data: e }, { data: n }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("resources").select("*").order("created_at", { ascending: false }),
        supabase.from("exam_papers").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }),
      ]);
      setAllProfiles(Array.isArray(p) ? p : []);
      setResources(Array.isArray(r) ? r : []);
      setPapers(Array.isArray(e) ? e : []);
      setNotifications(Array.isArray(n) ? n : []);
      setLoading(false);
    };
    void load();
  }, [profile]);

  const activeAndBannedUsers = useMemo(() => allProfiles.filter((p) => p.status === "active" || p.status === "banned"), [allProfiles]);
  const pendingUsers = useMemo(() => allProfiles.filter((p) => p.status === "pending"), [allProfiles]);
  const filteredUsers = useMemo(() => {
    return activeAndBannedUsers.filter((p) => {
      const matchProgramme = filterProgramme === "All" || p.programme === filterProgramme;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.roll_no || "").toLowerCase().includes(search.toLowerCase());
      return matchProgramme && matchSearch;
    });
  }, [activeAndBannedUsers, filterProgramme, search]);

  const markNotificationsRead = async (userId: string) => {
    const related = notifications.filter((n) => n.related_user_id === userId && !n.is_read);
    for (const n of related) {
      await supabase.from("admin_notifications").update({ is_read: true }).eq("id", n.id);
    }
    setNotifications((current) =>
      current.map((n) => (n.related_user_id === userId ? { ...n, is_read: true } : n))
    );
  };

  if (!profile) return <LoadingCard />;
  if (profile.role !== "admin") return <LockedScreen title="Admin only" description="This section is restricted to administrators." />;
  if (loading) return <LoadingCard title="> loading admin..." />;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <PageHeader title="Admin Panel" description="Manage users, approve sign-ups, import student rolls, and curate shared content." profile={profile} />

      <InlineAlert message={error} />
      <InlineAlert tone="success" message={success} />

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setError(null); setSuccess(null); }} className={`relative rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${activeTab === tab ? "bg-[var(--accent)] text-black" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-white"}`}>
            {tab}
            {tab === "Pending" && pendingUsers.length > 0 ? (
              <span className="ml-2.5 inline-flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {pendingUsers.length}
              </span>
            ) : null}
          </button>
        ))}

        {unreadCount > 0 ? (
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-400">
            <Bell size={16} className="animate-bounce" />
            <span>{unreadCount} new</span>
          </div>
        ) : null}
      </div>

      {/* Users Tab */}
      {activeTab === "Users" ? (
        <div className="animate-fade-in">
          <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]" />
            <select value={filterProgramme} onChange={(e) => setFilterProgramme(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]">
              <option value="All">All Programmes</option>
              <option value="BS">BS</option>
              <option value="MSc">MSc</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? <EmptyState title="No users found" description="Try adjusting your search or filter." /> : null}
            {filteredUsers.map((user) => (
              <div key={user.id} className="group flex flex-col justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/50 hover:shadow-sm sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-lg font-bold text-[var(--accent)]">{user.name?.[0]?.toUpperCase() || "?"}</div>
                  <div>
                    <p className="text-base font-bold text-white">{user.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{user.roll_no} • {user.programme} • {user.batch_year}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {user.role === "admin" ? <span className="flex items-center gap-1 rounded-md bg-red-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400"><Shield size={14} /> Admin</span> : null}
                  <span className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${user.status === "active" ? "bg-emerald-500/10 text-emerald-400" : user.status === "banned" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{user.status}</span>

                  <div className="mt-3 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:w-auto sm:ml-2">
                  {user.role !== "admin" ? (
                    <>
                      <button onClick={async () => {
                        const { error: updateError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
                        if (updateError) setError(updateError.message);
                        else {
                          setAllProfiles((current) => current.map((p) => p.id === user.id ? { ...p, role: "admin" } : p));
                          setSuccess(`${user.name} is now an admin.`);
                        }
                      }} className="rounded-lg border border-blue-800 bg-blue-950/20 px-4 py-2 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-950/40 active:scale-95">
                        Make Admin
                      </button>

                      <button onClick={async () => {
                        const newStatus = user.status === "banned" ? "active" : "banned";
                        const { error: updateError } = await supabase.from("profiles").update({ status: newStatus }).eq("id", user.id);
                        if (updateError) setError(updateError.message);
                        else setAllProfiles((current) => current.map((p) => p.id === user.id ? { ...p, status: newStatus } : p));
                      }} className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors active:scale-95 ${user.status === "banned" ? "border-emerald-800 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40" : "border-red-800 bg-red-950/20 text-red-400 hover:bg-red-950/40"}`}>
                        {user.status === "banned" ? "Unban User" : "Ban User"}
                      </button>
                    </>
                  ) : (
                    user.id !== profile.id && (
                      <button onClick={async () => {
                        const { error: updateError } = await supabase.from("profiles").update({ role: "student" }).eq("id", user.id);
                        if (updateError) setError(updateError.message);
                        else {
                          setAllProfiles((current) => current.map((p) => p.id === user.id ? { ...p, role: "student" } : p));
                          setSuccess(`${user.name} is no longer an admin.`);
                        }
                      }} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:text-white active:scale-95">
                        Revoke Admin
                      </button>
                    )
                  )}

                  {user.id !== profile.id && (
                    <button onClick={async () => {
                      if (!confirm(`Are you sure you want to completely delete ${user.name} from the database? This cannot be undone.`)) return;
                      const { error: deleteError } = await supabase.from("profiles").delete().eq("id", user.id);
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
                      setSuccess(`${user.name} has been completely deleted.`);
                    }} className="rounded-lg border border-red-900 bg-red-950/20 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-950/40 active:scale-95">
                      Delete
                    </button>
                  )}
                  </div>
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
            <div key={user.id} className="flex flex-col justify-between gap-4 rounded-xl border border-amber-800/40 bg-amber-950/20 px-5 py-4 sm:flex-row sm:items-center sm:gap-0">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-800 bg-[var(--background)] text-lg font-bold text-amber-400">{user.name?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <p className="text-base font-bold text-white">{user.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{user.roll_no} • {user.programme} • {user.batch_year}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  const { error: updateError } = await supabase.from("profiles").update({ status: "active" }).eq("id", user.id);
                  if (updateError) setError(updateError.message);
                  else {
                    setAllProfiles((current) => current.map((p) => p.id === user.id ? { ...p, status: "active" } : p));
                    setSuccess(`${user.name} approved successfully.`);
                    await markNotificationsRead(user.id);
                  }
                }} className="flex items-center gap-1.5 rounded-lg border border-emerald-800 bg-emerald-950/20 px-4 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-950/40 active:scale-[0.97]">
                  <Check size={16} /> Approve
                </button>
                <button onClick={async () => {
                  const { error: deleteError } = await supabase.from("profiles").delete().eq("id", user.id);
                  if (deleteError) { setError(deleteError.message); return; }
                  try {
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`;
                    await fetch(url, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
                      body: JSON.stringify({ user_id: user.id }),
                    });
                  } catch {}
                  await markNotificationsRead(user.id);
                  setAllProfiles((current) => current.filter((p) => p.id !== user.id));
                  setSuccess(`${user.name} rejected and removed.`);
                }} className="flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950/20 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-950/40 active:scale-[0.97]">
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
          <div className="mb-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
            <Upload size={32} className="mx-auto mb-4 text-[var(--muted)]" />
            <p className="mb-6 text-sm font-medium text-[var(--muted)]">Upload a CSV file with columns: <strong>roll_no, name</strong></p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#bce600] active:scale-[0.97]">
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
            <div className="animate-slide-up overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4">
                <p className="text-sm font-bold text-white">{csvData.length} records parsed</p>
                <button onClick={async () => {
                  setError(null);
                  const { error: upsertError } = await supabase.from("registered_rollnos").upsert(csvData, { onConflict: "roll_no" });
                  if (upsertError) setError(upsertError.message);
                  else {
                    setSuccess(`${csvData.length} roll numbers imported successfully.`);
                    setCsvData([]);
                  }
                }} className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-5 py-2 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-950/60 active:scale-[0.97]">
                  Import All
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-5">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--surface)]">
                    <tr className="border-b border-[var(--border)] text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                      <th className="pb-3">Roll No</th><th className="pb-3">Name</th><th className="pb-3">Programme</th><th className="pb-3">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 50).map((row) => (
                      <tr key={row.roll_no} className="border-b border-[var(--border)]/30 text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)]">
                        <td className="py-2.5 font-bold text-[var(--accent)]">{row.roll_no}</td>
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
        <div className="animate-fade-in space-y-10">
          <section>
            <h2 className="mb-5 text-lg font-bold text-white">Resources ({resources.length})</h2>
            {resources.length === 0 ? <EmptyState title="No resources uploaded" description="Upload files in the Study Vault." /> : null}
            <div className="space-y-3">
              {resources.map((item) => (
                <div key={item.id} className="group relative flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-lg">
                  {item.file_type?.startsWith("image/") ? (
                    <div className="pointer-events-none absolute bottom-0 left-[250px] z-20 w-48 origin-left scale-95 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 xl:left-[300px]">
                      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.file_url} alt={item.title} className="aspect-video w-full rounded-md object-cover" />
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-base font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--muted)]">{item.category} • {formatDateTime(item.created_at)}</p>
                  </div>
                  <button onClick={async () => {
                    const { error: deleteError } = await supabase.from("resources").delete().eq("id", item.id);
                    if (deleteError) setError(deleteError.message);
                    else setResources((current) => current.filter((r) => r.id !== item.id));
                  }} className="rounded-lg border border-red-900 bg-red-950/20 p-2.5 text-red-400 opacity-100 transition-colors hover:bg-red-950/40 active:scale-90 md:opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-5 text-lg font-bold text-white">Exam Papers ({papers.length})</h2>
            {papers.length === 0 ? <EmptyState title="No papers uploaded" description="Upload files in the Exam Archive." /> : null}
            <div className="space-y-3">
              {papers.map((item) => (
                <div key={item.id} className="group relative flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-lg">
                  {item.file_url.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i) ? (
                    <div className="pointer-events-none absolute bottom-0 left-[250px] z-20 w-48 origin-left scale-95 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 xl:left-[300px]">
                      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.file_url} alt={item.subject} className="aspect-video w-full rounded-md object-cover" />
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-base font-bold text-white">{item.subject}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--muted)]">{item.exam_type} • {item.semester} {item.year} • {formatDateTime(item.created_at)}</p>
                  </div>
                  <button onClick={async () => {
                    const { error: deleteError } = await supabase.from("exam_papers").delete().eq("id", item.id);
                    if (deleteError) setError(deleteError.message);
                    else setPapers((current) => current.filter((p) => p.id !== item.id));
                  }} className="rounded-lg border border-red-900 bg-red-950/20 p-2.5 text-red-400 opacity-100 transition-colors hover:bg-red-950/40 active:scale-90 md:opacity-0 group-hover:opacity-100">
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
