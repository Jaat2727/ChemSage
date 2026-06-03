"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calendar, Clock, Download, Activity, AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ScheduleEntry } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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

interface TaskItem {
  id: string;
  title: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string | null;
  createdAt: string;
}

export default function ScheduleManagerPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    
    const loadSchedule = async () => {
      const { data, error: fetchError } = await supabase.from("schedule").select("*").eq("user_id", profile.id).order("start_time", { ascending: true });
      if (fetchError) setError(fetchError.message);
      setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    
    try {
      const savedTasks = window.localStorage.getItem(`chemsage.tasks.${profile.id}`);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch {
      console.error("Failed to load tasks");
    }

    void loadSchedule();
  }, [profile]);

  const groupedByDay = useMemo(() => {
    const acc: Record<string, ScheduleEntry[]> = {};
    days.forEach(d => acc[d] = []); 
    entries.forEach(entry => {
      if (acc[entry.day_of_week]) {
        acc[entry.day_of_week].push(entry);
      }
    });
    return acc;
  }, [entries]);

  const currentDayName = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), []);
  const todaysClasses = useMemo(() => groupedByDay[currentDayName] || [], [groupedByDay, currentDayName]);
  
  const pendingDeadlines = useMemo(() => {
    return tasks
      .filter(t => t.status !== "Completed" && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [tasks]);

  const handleDeleteClass = async (id: string) => {
    const previous = entries;
    setEntries((current) => current.filter((item) => item.id !== id));
    const { error: deleteError } = await supabase.from("schedule").delete().eq("id", id);
    if (deleteError) { 
      setEntries(previous); 
      setError(deleteError.message); 
    }
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Schedule Manager locked" description="Only active users can manage their schedule." />;

  return (
    <div className="pb-12">
      <PageHeader
        title="Class Planner"
        description="Your academic timetable and upcoming deadlines mapped out clearly."
        profile={profile}
        action={
          <button onClick={() => setShowSheet(true)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#bce600] active:scale-[0.97] shadow-[0_0_15px_rgba(188,230,0,0.2)]">
            <Plus size={16} /> Add Class
          </button>
        }
      />

      <InlineAlert message={error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        
        {/* Main Content: Weekly Grid */}
        <div className="flex flex-col min-w-0 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden h-[calc(100vh-14rem)]">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-soft)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-[var(--accent)]" /> Weekly Timetable
            </h2>
            <button className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] hover:text-white transition-colors flex items-center gap-1">
              <Download size={12} /> Export
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            {loading ? (
              <div className="p-8"><LoadingCard title="Loading schedule..." /></div>
            ) : entries.length === 0 ? (
              <div className="p-12 h-full flex items-center justify-center">
                <EmptyState title="No classes scheduled" description="Click 'Add Class' to start building your academic timetable." />
              </div>
            ) : (
              <div className="flex min-w-[1000px] h-full">
                {days.map(day => {
                  const isToday = day === currentDayName;
                  const dayEntries = groupedByDay[day];
                  
                  return (
                    <div key={day} className={cn("flex-1 min-w-[150px] border-r border-[var(--border)] last:border-r-0 flex flex-col", isToday && "bg-[var(--accent)]/5")}>
                      {/* Column Header */}
                      <div className={cn("sticky top-0 z-10 py-3 text-center border-b border-[var(--border)] backdrop-blur-md bg-[var(--surface)]/90", isToday && "border-b-[var(--accent)]")}>
                        <p className={cn("text-xs font-bold uppercase tracking-wider", isToday ? "text-[var(--accent)]" : "text-[var(--muted)]")}>
                          {day.substring(0, 3)}
                        </p>
                      </div>
                      
                      {/* Column Content */}
                      <div className="flex-1 p-2 space-y-2 relative">
                        {dayEntries.map(entry => (
                          <div key={entry.id} className="group relative rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 hover:border-[var(--accent)]/50 transition-all shadow-sm">
                            <div className="flex items-start justify-between mb-1">
                              <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", 
                                entry.type === 'Lecture' ? "bg-blue-500/10 text-blue-400" : 
                                entry.type === 'Lab' ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                              )}>
                                {entry.type}
                              </span>
                              <button onClick={() => handleDeleteClass(entry.id)} className="text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <h4 className="text-sm font-bold text-white leading-tight mb-1">{entry.subject}</h4>
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-[var(--muted)] flex items-center gap-1"><Clock size={10} /> {formatTime(entry.start_time)} - {formatTime(entry.end_time)}</p>
                              <p className="text-[10px] text-[var(--muted)] flex items-center gap-1"><BookOpen size={10} /> Room {entry.room_no}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          
          {/* Today's Agenda */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                <Clock size={16} /> Today's Agenda
              </h3>
              <span className="text-[10px] font-bold bg-[var(--surface-soft)] text-white px-2 py-0.5 rounded-full">{currentDayName}</span>
            </div>
            
            {todaysClasses.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-lg bg-[var(--background)]">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-50" />
                <p className="text-xs text-[var(--muted)]">No classes scheduled for today.<br/>Enjoy your free time!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysClasses.map(cls => (
                  <div key={cls.id} className="flex gap-3 items-stretch relative">
                    <div className="w-12 shrink-0 flex flex-col items-end pt-0.5">
                      <span className="text-[10px] font-bold text-white">{formatTime(cls.start_time)}</span>
                      <span className="text-[9px] font-medium text-[var(--muted)]">{formatTime(cls.end_time)}</span>
                    </div>
                    <div className="w-0.5 bg-[var(--surface-soft)] relative">
                      <div className="absolute top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)]" />
                    </div>
                    <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                      <p className="text-xs font-bold text-white mb-0.5">{cls.subject}</p>
                      <p className="text-[10px] text-[var(--muted)]">{cls.type} • Rm {cls.room_no}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments / Tasks Integration */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <AlertTriangle size={16} /> Upcoming Deadlines
            </h3>
            
            {pendingDeadlines.length === 0 ? (
              <p className="text-xs text-center text-[var(--muted)] py-4">No upcoming deadlines found in your Task Board.</p>
            ) : (
              <div className="space-y-2">
                {pendingDeadlines.slice(0, 5).map(task => {
                  const isHigh = task.priority === "High";
                  return (
                    <div key={task.id} className={cn("flex justify-between items-start gap-3 p-3 rounded-lg border", isHigh ? "bg-red-950/10 border-red-900/50" : "bg-[var(--background)] border-[var(--border)]")}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{task.title}</p>
                        <p className={cn("text-[10px] font-bold mt-1", isHigh ? "text-red-400" : "text-amber-400")}>
                          Due {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {isHigh && <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold uppercase">Urgent</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </aside>
      </div>

      {/* Add Class Modal */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in sm:items-center">
          <div className="w-full max-w-lg animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl shadow-black/40">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Class</h2>
              <button onClick={() => setShowSheet(false)} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-white">
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
              <input value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Subject Name" className={`${formInputClasses} md:col-span-2`} required />
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
                {saving ? "Saving..." : "Add to Schedule"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
