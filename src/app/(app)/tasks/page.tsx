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
    if (profile.status !== "active") {
      setLoading(false);
      return;
    }

    try {
      const saved = window.localStorage.getItem(storageKey(profile.id));
      if (!saved) {
        setTasks([]);
      } else {
        const parsed = JSON.parse(saved) as TaskItem[];
        setTasks(Array.isArray(parsed) ? parsed : []);
      }
      setError(null);
    } catch {
      setError("We could not load your saved tasks on this device.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
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
  if (loading) return <LoadingCard title="Loading tasks..." />;

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <PageHeader
        title="Task Terminal"
        description="A fast personal task board that stores your tasks locally per signed-in profile so the section opens instantly."
        profile={profile}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <TaskStatCard label="Pending" value={stats.pending} accent="text-amber-300" />
        <TaskStatCard label="Completed" value={stats.completed} accent="text-emerald-300" />
        <TaskStatCard label="High priority" value={stats.highPriority} accent="text-rose-300" />
      </div>

      <div className="mb-6 rounded-3xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-300">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add a task</h2>
            <p className="text-sm text-slate-400">Create quick reminders without leaving the dashboard flow.</p>
          </div>
        </div>

        <form
          className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const cleanTitle = title.trim();
            const cleanNotes = notes.trim();
            if (!cleanTitle) {
              setError("Please enter a task title before saving.");
              return;
            }

            setTasks((current) => [
              {
                id: `${Date.now()}`,
                title: cleanTitle,
                notes: cleanNotes,
                priority,
                done: false,
                createdAt: new Date().toISOString(),
              },
              ...current,
            ]);
            setTitle("");
            setNotes("");
            setPriority("Medium");
            setError(null);
          }}
        >
          <div className="grid gap-4 md:col-span-2 md:grid-cols-[1fr_1fr]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
              className="rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes or deadline"
              className="rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex gap-3 md:justify-end">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskItem["priority"])}
              className="rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item} priority
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-blue-700 active:scale-[0.98]"
            >
              <Plus size={16} />
              Add task
            </button>
          </div>
        </form>
      </div>

      <InlineAlert tone="error" message={error} />

      {!tasks.length ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task so this section becomes immediately useful instead of opening to a placeholder."
        />
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <article
              key={task.id}
              className={cn(
                "rounded-3xl border p-5 transition-all duration-200",
                task.done
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-slate-800/50 bg-slate-900/40 backdrop-blur-sm hover:border-slate-700/50 hover:bg-slate-900/60",
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        task.priority === "High" && "bg-rose-500/10 text-rose-300",
                        task.priority === "Medium" && "bg-amber-500/10 text-amber-300",
                        task.priority === "Low" && "bg-emerald-500/10 text-emerald-300",
                      )}
                    >
                      {task.priority} priority
                    </span>
                    {task.done ? (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Done</span>
                    ) : null}
                  </div>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{task.notes || "No extra notes added."}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTasks((current) =>
                        current.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)),
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]",
                      task.done
                        ? "bg-slate-800/70 text-slate-200 hover:bg-slate-700/70"
                        : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
                    )}
                  >
                    <CheckCircle2 size={16} />
                    {task.done ? "Mark pending" : "Mark done"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                    className="rounded-2xl bg-red-500/10 p-3 text-red-300 transition-all hover:bg-red-500/20 active:scale-[0.96]"
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

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-800/50 bg-slate-900/30 px-4 py-3 text-sm text-slate-400">
        <ListTodo size={16} className="text-indigo-300" />
        Tasks are stored on this device for the current signed-in profile to keep the page opening quickly without backend failures.
      </div>
    </div>
  );
}

function TaskStatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className={cn("mt-2 text-3xl font-extrabold", accent)}>{value}</p>
    </div>
  );
}
