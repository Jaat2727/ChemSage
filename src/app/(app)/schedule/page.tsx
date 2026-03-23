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

const formInputClasses = "rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-white outline-none transition-all focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20";

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
      const { data, error: fetchError } = await supabase.from<ScheduleEntry>("schedule").select("*").eq("user_id", profile.id).order("start_time", { ascending: true });
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
      <PageHeader title="Schedule Manager" description="Every schedule row is scoped to the current Supabase user and grouped by weekday on the client." profile={profile} action={<button onClick={() => setShowSheet(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-700 active:scale-[0.97]"><Plus size={16} /> Add class</button>} />

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 backdrop-blur-sm">
        {days.map((day) => (
          <button key={day} onClick={() => setSelectedDay(day)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${selectedDay === day ? "bg-orange-500 text-white shadow-md shadow-orange-500/25" : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"}`}>
            {day}
          </button>
        ))}
      </div>

      <InlineAlert message={error} />
      {loading ? <LoadingCard title="Loading schedule..." /> : null}
      {!loading && !(grouped[selectedDay]?.length) ? <EmptyState title={`No classes on ${selectedDay}`} description="Use the Add class button to create your first schedule item for this day." /> : null}

      <div className="space-y-4">
        {(grouped[selectedDay] || []).map((entry) => (
          <div key={entry.id} className="group flex animate-fade-in items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-700/50 hover:bg-slate-900/60">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-300">{entry.type}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{entry.subject}</h3>
              <p className="mt-1 text-sm text-slate-400">{formatTime(entry.start_time)} – {formatTime(entry.end_time)} • Room {entry.room_no}</p>
            </div>
            <button onClick={async () => {
              const previous = entries;
              setEntries((current) => current.filter((item) => item.id !== entry.id));
              const { error: deleteError } = await supabase.from<ScheduleEntry>("schedule").delete().eq("id", entry.id);
              if (deleteError) {
                setEntries(previous);
                setError(deleteError.message);
              }
            }} className="rounded-full bg-red-500/10 p-3 text-red-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 active:scale-90">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {showSheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-backdrop-enter bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg animate-sheet-up rounded-t-3xl border border-slate-800/60 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add class</h2>
              <button onClick={() => setShowSheet(false)} className="text-sm font-semibold text-slate-400 transition-colors hover:text-white">Close</button>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={async (event) => {
              event.preventDefault();
              if (!profile) return;
              setSaving(true);
              setError(null);
              const { data, error: insertError } = await supabase.from<ScheduleEntry>("schedule").insert({ ...form, user_id: profile.id });
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
              <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] md:col-span-2">{saving ? "Saving..." : "Save schedule row"}</button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
