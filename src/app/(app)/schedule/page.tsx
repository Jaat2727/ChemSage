"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ScheduleEntry } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const supabase = createClientComponentClient();

const initialForm: Pick<ScheduleEntry, "subject" | "type" | "room_no" | "day_of_week" | "start_time" | "end_time"> = {
  subject: "",
  type: "Lecture",
  room_no: "",
  day_of_week: "Monday",
  start_time: "09:00",
  end_time: "09:55",
};

const formInputClasses = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export default function ScheduleManagerPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [showSheet, setShowSheet] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const load = async () => {
      const { data, error: fetchError } = await supabase.from("schedule").select("*").eq("user_id", profile.id).order("start_time", { ascending: true });
      if (fetchError) setError(fetchError.message);
      setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    void load();
  }, [profile]);

  const grouped = useMemo(() => {
    return entries.reduce<Record<string, ScheduleEntry[]>>((acc, entry) => {
      acc[entry.day_of_week] = [...(acc[entry.day_of_week] || []), entry];
      return acc;
    }, {});
  }, [entries]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Schedule Manager locked" description="Only active users can manage their schedule." />;

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <PageHeader
        title="Schedule Manager"
        description="Every schedule row is scoped to the current Supabase user and grouped by weekday."
        profile={profile}
        action={
          <button onClick={() => setShowSheet(true)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#bce600] active:scale-[0.97]">
            <Plus size={16} /> Add Class
          </button>
        }
      />

      <div className="mb-8 flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
        {days.map((day) => (
          <button key={day} onClick={() => setSelectedDay(day)} className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${selectedDay === day ? "bg-[var(--accent)] text-black shadow-md shadow-[var(--accent)]/20" : "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"}`}>
            {day}
          </button>
        ))}
      </div>

      <InlineAlert message={error} />
      {loading ? <LoadingCard title="Loading schedule..." /> : null}
      {!loading && !(grouped[selectedDay]?.length) ? <EmptyState title={`No classes on ${selectedDay}`} description="Use the addClass button to create your first schedule item for this day." /> : null}

      <div className="space-y-4">
        {(grouped[selectedDay] || []).map((entry) => (
          <div key={entry.id} className="group flex animate-fade-in items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-lg active:scale-[0.99]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">{entry.type}</p>
              <h3 className="mt-2 text-xl font-bold text-white">{entry.subject}</h3>
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">{formatTime(entry.start_time)} – {formatTime(entry.end_time)} • Room {entry.room_no}</p>
            </div>
            <button onClick={async () => {
              const previous = entries;
              setEntries((current) => current.filter((item) => item.id !== entry.id));
              const { error: deleteError } = await supabase.from("schedule").delete().eq("id", entry.id);
              if (deleteError) { setEntries(previous); setError(deleteError.message); }
            }} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--muted)] opacity-0 transition-all hover:border-red-800 hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100 active:scale-95">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {showSheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in sm:items-center">
          <div className="w-full max-w-lg animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl shadow-black/40">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Class</h2>
              <button onClick={() => setShowSheet(false)} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-white">
                <Trash2 className="hidden" /> {/* Dummy to keep import used or we can use X, I'll use text */}
                Cancel
              </button>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={async (event) => {
              event.preventDefault();
              if (!profile) return;
              setSaving(true);
              setError(null);
              const { data, error: insertError } = await supabase.from("schedule").insert({ ...form, user_id: profile.id }).select();
              if (insertError) {
                setError(insertError.message);
              } else {
                const inserted = Array.isArray(data) ? data[0] : null;
                if (inserted) setEntries((current) => [...current, inserted as ScheduleEntry]);
                setShowSheet(false);
                setForm({ ...initialForm });
              }
              setSaving(false);
            }}>
              <input value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Subject" className={`${formInputClasses} md:col-span-2`} required />
              <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as ScheduleEntry['type'] }))} className={formInputClasses}>
                <option>Lecture</option><option>Lab</option><option>Tutorial</option>
              </select>
              <input value={form.room_no} onChange={(e) => setForm((current) => ({ ...current, room_no: e.target.value }))} placeholder="Room number" className={formInputClasses} required />
              <select value={form.day_of_week} onChange={(e) => setForm((current) => ({ ...current, day_of_week: e.target.value }))} className={formInputClasses}>
                {days.map((day) => <option key={day}>{day}</option>)}
              </select>
              <input type="time" value={form.start_time} onChange={(e) => setForm((current) => ({ ...current, start_time: e.target.value }))} className={formInputClasses} required />
              <input type="time" value={form.end_time} onChange={(e) => setForm((current) => ({ ...current, end_time: e.target.value }))} className={`${formInputClasses} md:col-start-2`} required />
              <button type="submit" disabled={saving} className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 font-bold text-black transition-all hover:bg-[#bce600] active:scale-[0.98] md:col-span-2 disabled:opacity-50">
                {saving ? "Saving..." : "Save Class"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
