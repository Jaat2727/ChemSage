"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListTodo, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

interface TaskItem {
  id: string;
  title: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
  createdAt: string;
}

const priorities: Array<TaskItem["priority"]> = ["High", "Medium", "Low"];
const storageKey = (profileId: string) => `chemsage.tasks.${profileId}`;

const inputClasses = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export default function TaskTerminalPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<TaskItem["priority"]>("Medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.status !== "active") { setLoading(false); return; }
    try {
      const saved = window.localStorage.getItem(storageKey(profile.id));
      if (!saved) { setTasks([]); }
      else {
        const parsed = JSON.parse(saved) as TaskItem[];
        setTasks(Array.isArray(parsed) ? parsed : []);
      }
      setError(null);
    } catch { setError("We could not load your saved tasks on this device."); setTasks([]); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => {
    if (!profile || profile.status !== "active" || loading) return;
    window.localStorage.setItem(storageKey(profile.id), JSON.stringify(tasks));
  }, [loading, profile, tasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.done).length;
    const pending = tasks.length - completed;
    const highPriority = tasks.filter((task) => !task.done && task.priority === "High").length;
    return { completed, pending, highPriority };
  }, [tasks]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Task Terminal locked" description="Only active users can manage personal tasks." />;
  if (loading) return <LoadingCard title="> loading tasks..." />;

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <PageHeader title="Task Terminal" description="A fast personal task board stored locally per signed-in profile." profile={profile} />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-[var(--muted)] uppercase">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-[var(--muted)] uppercase">Completed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-red-500/80 uppercase">High Priority</p>
          <p className="mt-2 text-3xl font-bold text-red-400">{stats.highPriority}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-2 text-[var(--accent)]"><Plus size={20} /></div>
          <div>
            <h2 className="text-lg font-bold text-white">Add Task</h2>
            <p className="text-sm font-medium text-[var(--muted)]">Create quick personal reminders</p>
          </div>
        </div>

        <form
          className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const cleanTitle = title.trim();
            const cleanNotes = notes.trim();
            if (!cleanTitle) { setError("Please enter a task title before saving."); return; }
            setTasks((current) => [{ id: `${Date.now()}`, title: cleanTitle, notes: cleanNotes, priority, done: false, createdAt: new Date().toISOString() }, ...current]);
            setTitle(""); setNotes(""); setPriority("Medium"); setError(null);
          }}
        >
          <div className="grid gap-4 md:col-span-2 md:grid-cols-[1fr_1fr]">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" className={inputClasses} required />
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes or deadline" className={inputClasses} />
          </div>
          <div className="flex gap-3 md:justify-end">
            <select value={priority} onChange={(event) => setPriority(event.target.value as TaskItem["priority"])} className={`${inputClasses} bg-[var(--background)]`}>
              {priorities.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#bce600] active:scale-[0.98]">
              <Plus size={16} /> Add Task
            </button>
          </div>
        </form>
      </div>

      <InlineAlert tone="error" message={error} />

      {!tasks.length ? (
        <EmptyState title="No tasks yet" description="Create your first task above." />
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <article
              key={task.id}
              className={cn(
                "rounded-xl border p-5 transition-all duration-300",
                task.done
                  ? "border-emerald-800/40 bg-emerald-950/20"
                  : "border-[var(--border)] bg-[var(--surface)] hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-lg",
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                      task.priority === "High" && "bg-red-500/10 text-red-400",
                      task.priority === "Medium" && "bg-amber-500/10 text-amber-400",
                      task.priority === "Low" && "bg-emerald-500/10 text-emerald-400",
                    )}>
                      {task.priority} Priority
                    </span>
                    {task.done ? <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-emerald-400">DONE</span> : null}
                  </div>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                  <p className="mt-2 text-sm font-medium text-[var(--muted)]">{task.notes || "No extra notes added."}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)))}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-all active:scale-[0.98]",
                      task.done
                        ? "border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:text-white"
                        : "border-emerald-800 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40",
                    )}
                  >
                    <CheckCircle2 size={16} />
                    {task.done ? "Undo" : "Mark Done"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-[var(--muted)] transition-all hover:border-red-800 hover:bg-red-950/40 hover:text-red-400 active:scale-[0.96]"
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm font-medium text-[var(--muted)]">
        <ListTodo size={18} className="text-[var(--accent)]" />
        Tasks are stored securely on this device for the current signed-in profile.
      </div>
    </div>
  );
}
