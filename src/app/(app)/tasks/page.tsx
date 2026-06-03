"use client";

import { useEffect, useMemo, useState } from "react";
import { ListTodo, Plus, Trash2, Activity, AlertTriangle, Edit3, Calendar as CalendarIcon, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

interface TaskItem {
  id: string;
  title: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string | null;
  createdAt: string;
}

const priorities: Array<TaskItem["priority"]> = ["High", "Medium", "Low"];
const storageKey = (profileId: string) => `chemsage.tasks.${profileId}`;

const inputClasses = "rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export default function TaskTerminalPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskItem["priority"]>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.status !== "active") { setLoading(false); return; }
    try {
      const saved = window.localStorage.getItem(storageKey(profile.id));
      if (!saved) { setTasks([]); }
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = JSON.parse(saved) as any[];
        // Migration
        const migrated: TaskItem[] = parsed.map(p => ({
          id: p.id,
          title: p.title || "",
          notes: p.notes || "",
          priority: p.priority || "Medium",
          status: p.status || (p.done ? "Completed" : "Pending"),
          dueDate: p.dueDate || null,
          createdAt: p.createdAt || new Date().toISOString()
        }));
        setTasks(Array.isArray(migrated) ? migrated : []);
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
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const pending = tasks.filter((task) => task.status === "Pending").length;
    const inProgress = tasks.filter((task) => task.status === "In Progress").length;
    const highPriority = tasks.filter((task) => task.status !== "Completed" && task.priority === "High").length;
    return { completed, pending, inProgress, highPriority, total: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, searchQuery]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setTasks((current) => [{ id: `${Date.now()}`, title: cleanTitle, notes: "", priority, status: "Pending", dueDate: dueDate || null, createdAt: new Date().toISOString() }, ...current]);
    setTitle("");
    setDueDate("");
    setPriority("Medium");
  };

  const updateTaskStatus = (id: string, newStatus: TaskItem["status"]) => {
    setTasks(current => current.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };
  const deleteTask = (id: string) => {
    setTasks(current => current.filter(t => t.id !== id));
  };

  const addTemplate = (type: string) => {
    const now = new Date().toISOString();
    let newTasks: TaskItem[] = [];
    if (type === "study") {
      newTasks = [
        { id: `${Date.now()}-1`, title: "Review Chapter 4 Notes", notes: "Focus on thermodynamics", priority: "High", status: "Pending", dueDate: null, createdAt: now },
        { id: `${Date.now()}-2`, title: "Complete Practice Set 2", notes: "Questions 1-15", priority: "Medium", status: "Pending", dueDate: null, createdAt: now }
      ];
    } else if (type === "lab") {
      newTasks = [
        { id: `${Date.now()}-3`, title: "Draft Lab Report", notes: "Include data tables and graphs", priority: "High", status: "In Progress", dueDate: null, createdAt: now },
        { id: `${Date.now()}-4`, title: "Submit Prelab", notes: "Due before next Tuesday", priority: "High", status: "Pending", dueDate: null, createdAt: now }
      ];
    }
    setTasks(current => [...newTasks, ...current]);
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Task Terminal locked" description="Only active users can manage personal tasks." />;
  if (loading) return <LoadingCard title="> loading tasks..." />;

  const pendingTasks = filteredTasks.filter(t => t.status === "Pending");
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress");
  const completedTasks = filteredTasks.filter(t => t.status === "Completed");

  return (
    <div className="pb-20">
      <PageHeader title="Task Board" description="A fast personal Kanban board stored locally per signed-in profile." profile={profile} />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Kanban Content */}
        <div className="flex flex-col gap-6 min-w-0">
          
          {/* Compact Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task..." className={`${inputClasses} flex-1 min-w-[150px]`} required />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputClasses} w-36`} />
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskItem["priority"])} className={inputClasses}>
                <option value="Low">Low</option><option value="Medium">Med</option><option value="High">High</option>
              </select>
              <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#bce600]">
                Add
              </button>
            </form>
            
            <div className="flex items-center gap-3 w-full xl:w-64 shrink-0 relative">
              <Search size={16} className="absolute left-3 text-[var(--muted)]" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className={`${inputClasses} w-full pl-9`} />
            </div>
          </div>

          <InlineAlert tone="error" message={error} />

          {/* Kanban Board */}
          {!tasks.length && !searchQuery ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <ListTodo size={48} className="mx-auto mb-4 text-[var(--muted)] opacity-50" />
              <h2 className="text-xl font-bold text-white mb-2">Welcome to your Task Board</h2>
              <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">Organize your study sessions, assignments, and projects visually using this Kanban board.</p>
              
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button onClick={() => addTemplate("study")} className="flex flex-col items-center p-6 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50 hover:shadow-lg transition-all group text-left">
                  <Activity size={24} className="mb-3 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white mb-1">Study Plan Template</span>
                  <span className="text-xs text-[var(--muted)] text-center">Add standard study routine tasks</span>
                </button>
                <button onClick={() => addTemplate("lab")} className="flex flex-col items-center p-6 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50 hover:shadow-lg transition-all group text-left">
                  <AlertTriangle size={24} className="mb-3 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-white mb-1">Lab Report Template</span>
                  <span className="text-xs text-[var(--muted)] text-center">Add checklist for lab submissions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Pending Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Pending</h3>
                  <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-xs font-bold text-white">{pendingTasks.length}</span>
                </div>
                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTaskStatus} onDelete={deleteTask} />
                ))}
              </div>

              {/* In Progress Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500/80">In Progress</h3>
                  <span className="rounded-full bg-amber-500/10 text-amber-500 px-2.5 py-0.5 text-xs font-bold">{inProgressTasks.length}</span>
                </div>
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTaskStatus} onDelete={deleteTask} />
                ))}
              </div>

              {/* Completed Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500/80">Completed</h3>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 text-xs font-bold">{completedTasks.length}</span>
                </div>
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTaskStatus} onDelete={deleteTask} />
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Productivity Stats */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <Activity size={16} /> Productivity
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--muted)] mb-1">
                  <span>Completion Rate</span>
                  <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xl font-bold text-white">{stats.inProgress}</p>
                  <p className="text-[10px] uppercase font-bold text-[var(--muted)]">In Progress</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.completed}</p>
                  <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent / Overdue preview */}
          {stats.highPriority > 0 && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-400">
                <AlertTriangle size={16} /> Needs Attention
              </h3>
              <div className="space-y-3">
                {tasks.filter(t => t.status !== "Completed" && t.priority === "High").slice(0,3).map(t => (
                  <div key={t.id} className="flex gap-3 items-start">
                    <div className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{t.title}</p>
                      {t.dueDate && <p className="text-[10px] font-bold text-red-400 mt-0.5">Due {t.dueDate}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Notes Scratchpad */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <Edit3 size={16} /> Quick Notes
            </h3>
            <textarea
              placeholder="Jot down quick thoughts here..."
              className="w-full h-32 resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function TaskCard({ task, onUpdate, onDelete }: { task: TaskItem, onUpdate: (id: string, s: TaskItem["status"]) => void, onDelete: (id: string) => void }) {
  return (
    <article className={cn("group relative flex flex-col rounded-xl border bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/50 hover:shadow-lg active:scale-[0.99]", task.status === "Completed" ? "border-emerald-900/50 opacity-80" : "border-[var(--border)]")}>
      
      {/* Priority Badge */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={cn(
          "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          task.priority === "High" && "bg-red-500/10 text-red-400",
          task.priority === "Medium" && "bg-amber-500/10 text-amber-400",
          task.priority === "Low" && "bg-[var(--surface-soft)] text-[var(--muted)]",
        )}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--muted)]">
            <CalendarIcon size={12} /> {task.dueDate}
          </span>
        )}
      </div>
      
      <h4 className={cn("text-sm font-bold text-white mb-1", task.status === "Completed" && "line-through text-[var(--muted)]")}>{task.title}</h4>
      {task.notes && <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3">{task.notes}</p>}

      {/* Action Buttons */}
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-[var(--border)]">
        <div className="flex items-center gap-1">
          {task.status !== "Pending" && (
            <button onClick={() => onUpdate(task.id, task.status === "Completed" ? "In Progress" : "Pending")} className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white transition-colors" title="Move back">
              <ArrowLeft size={14} />
            </button>
          )}
          {task.status !== "Completed" && (
            <button onClick={() => onUpdate(task.id, task.status === "Pending" ? "In Progress" : "Completed")} className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white transition-colors" title="Move forward">
              <ArrowRight size={14} />
            </button>
          )}
          {task.status === "Completed" && (
            <button onClick={() => onUpdate(task.id, "Pending")} className="p-1.5 rounded-md text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white transition-colors" title="Restart task">
              <Activity size={14} />
            </button>
          )}
        </div>
        <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-md text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <Trash2 size={14} />
        </button>
      </div>

    </article>
  );
}
