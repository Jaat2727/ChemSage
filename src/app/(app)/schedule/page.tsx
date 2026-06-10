"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calendar, Clock, Download, Activity, AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
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
      const [scheduleRes, tasksRes] = await Promise.all([
        supabase.from("schedule").select("*, user:profiles(id, name)").order("start_time", { ascending: true }),
        supabase.from("tasks").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
      ]);
      if (scheduleRes.error) setError(scheduleRes.error.message);
      setEntries(Array.isArray(scheduleRes.data) ? scheduleRes.data : []);
      setTasks((tasksRes.data || []).map((r: any) => ({
        id: r.id, title: r.title, notes: r.notes || "",
        priority: r.priority, status: r.status,
        dueDate: r.due_date || null, createdAt: r.created_at,
      })));
      setLoading(false);
    };

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
    <div>
      <PageHeader
        title="Class Planner"
        description="Your academic timetable and upcoming deadlines mapped out clearly."
        profile={profile}
        action={
          <button onClick={() => setShowSheet(true)} className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-[0.8125rem] font-bold text-black transition-colors hover:bg-[var(--accent-hover)] active:scale-[0.97]">
            <Plus size={16} /> Add Class
          </button>
        }
      />

      <InlineAlert message={error} />

      <div className="grid gap-5 xl:grid-cols-[1fr_var(--panel-width)] items-start">
        
        {/* Main Content: Weekly Grid */}
        <Card padding="compact" className="overflow-hidden h-[calc(100vh-14rem)]">
          <div className="px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] flex items-center justify-between">
            <h2 className="text-h3 text-[var(--fg-default)] flex items-center gap-2">
              <Calendar size={15} className="text-[var(--accent)]" /> Weekly Timetable
            </h2>
            <button className="text-overline text-[var(--fg-faint)] hover:text-[var(--fg-default)] transition-colors flex items-center gap-1">
              <Download size={12} /> Export
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto h-[calc(100%-40px)]">
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
                    <div key={day} className={cn("flex-1 min-w-[150px] border-r border-[var(--border-subtle)] last:border-r-0 flex flex-col", isToday && "bg-[var(--accent-muted)]")}>
                      {/* Column Header */}
                      <div className={cn("sticky top-0 z-10 py-2.5 text-center border-b border-[var(--border-default)] backdrop-blur-md bg-[var(--bg-raised)]/90", isToday && "border-b-[var(--accent)]")}>
                        <p className={cn("text-overline", isToday ? "text-[var(--accent)]" : "text-[var(--fg-faint)]")}>
                          {day.substring(0, 3)}
                        </p>
                      </div>
                      
                      {/* Column Content */}
                      <div className="flex-1 p-2 space-y-2">
                        {dayEntries.map(entry => (
                          <div key={entry.id} className="group relative rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)] p-2.5 hover:border-[var(--border-strong)] transition-colors">
                            <div className="flex items-start justify-between mb-1">
                              <Badge 
                                variant={entry.type === 'Lecture' ? "info" : entry.type === 'Lab' ? "warning" : "success"}
                                size="sm"
                              >
                                {entry.type}
                              </Badge>
                              <button onClick={() => handleDeleteClass(entry.id)} className="text-[var(--fg-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--error)] transition-opacity">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <h4 className="text-h3 text-[var(--fg-default)] leading-tight mb-1">{entry.subject}</h4>
                            <div className="space-y-0.5">
                              <p className="text-caption text-[var(--fg-faint)] flex items-center gap-1"><Clock size={10} /> {formatTime(entry.start_time)} - {formatTime(entry.end_time)}</p>
                              <p className="text-caption text-[var(--fg-faint)] flex items-center gap-1"><BookOpen size={10} /> Room {entry.room_no}</p>
                              {entry.user && (
                                <p className="text-[9px] text-[var(--fg-muted)] mt-1.5 pt-1.5 border-t border-[var(--border-subtle)] truncate">
                                  Added by <span className="font-medium text-[var(--fg-default)]">{entry.user.name}</span>
                                </p>
                              )}
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
        </Card>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          
          {/* Today's Agenda */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Today's Agenda" icon={Clock} />
              <Badge variant="neutral">{currentDayName}</Badge>
            </div>
            
            {todaysClasses.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--bg-base)]">
                <CheckCircle2 size={22} className="mx-auto text-[var(--success)] mb-1.5 opacity-50" />
                <p className="text-caption">No classes scheduled for today.<br/>Enjoy your free time!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysClasses.map(cls => (
                  <div key={cls.id} className="flex gap-3 items-stretch relative">
                    <div className="w-11 shrink-0 flex flex-col items-end pt-0.5">
                      <span className="text-caption font-bold text-[var(--fg-default)]">{formatTime(cls.start_time)}</span>
                      <span className="text-caption text-[var(--fg-faint)]">{formatTime(cls.end_time)}</span>
                    </div>
                    <div className="w-0.5 bg-[var(--bg-subtle)] relative">
                      <div className="absolute top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-raised)]" />
                    </div>
                    <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)] p-2.5">
                      <p className="text-h3 text-[var(--fg-default)] mb-0.5">{cls.subject}</p>
                      <p className="text-caption text-[var(--fg-faint)]">{cls.type} • Rm {cls.room_no}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <SectionHeader title="Upcoming Deadlines" icon={AlertTriangle} />
            
            {pendingDeadlines.length === 0 ? (
              <p className="text-caption text-center py-4">No upcoming deadlines found in your Task Board.</p>
            ) : (
              <div className="space-y-2">
                {pendingDeadlines.slice(0, 5).map(task => {
                  const isHigh = task.priority === "High";
                  return (
                    <div key={task.id} className={cn("flex justify-between items-start gap-3 p-2.5 rounded-[var(--radius-md)] border", isHigh ? "bg-[var(--error-muted)] border-[var(--error-border)]" : "bg-[var(--bg-base)] border-[var(--border-default)]")}>
                      <div className="min-w-0 flex-1">
                        <p className="text-h3 text-[var(--fg-default)] truncate">{task.title}</p>
                        <p className={cn("text-caption mt-0.5", isHigh ? "text-[var(--error)]" : "text-[var(--warning)]")}>
                          Due {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {isHigh && <Badge variant="error">Urgent</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

        </aside>
      </div>

      {/* Add Class Modal */}
      <Modal open={showSheet} onClose={() => setShowSheet(false)} title="Add Class" sheet maxWidth="lg">
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
          <Input value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} placeholder="Subject Name" className="md:col-span-2" required />
          <Select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as ScheduleEntry['type'] }))}>
            <option>Lecture</option><option>Lab</option><option>Tutorial</option>
          </Select>
          <Input value={form.room_no} onChange={(e) => setForm((current) => ({ ...current, room_no: e.target.value }))} placeholder="Room number" required />
          <Select value={form.day_of_week} onChange={(e) => setForm((current) => ({ ...current, day_of_week: e.target.value }))}>
            {days.map((day) => <option key={day}>{day}</option>)}
          </Select>
          <Input type="time" value={form.start_time} onChange={(e) => setForm((current) => ({ ...current, start_time: e.target.value }))} required />
          <Input type="time" value={form.end_time} onChange={(e) => setForm((current) => ({ ...current, end_time: e.target.value }))} className="md:col-start-2" required />
          <button type="submit" disabled={saving} className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-3 font-bold text-black transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98] md:col-span-2 disabled:opacity-50">
            {saving ? "Saving..." : "Add to Schedule"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
