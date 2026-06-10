"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListTodo, Plus, Trash2, Activity, AlertTriangle, Edit3, Calendar as CalendarIcon, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { Card, SectionHeader } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { createClientComponentClient } from "@/lib/supabase";

interface TaskItem {
  id: string;
  title: string;
  notes: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string | null;
  createdAt: string;
}

// Map Supabase row → local TaskItem shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(row: any): TaskItem {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || "",
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date || null,
    createdAt: row.created_at,
  };
}

const priorities: Array<TaskItem["priority"]> = ["High", "Medium", "Low"];
const localStorageKey = (profileId: string) => `chemsage.tasks.${profileId}`;
const supabase = createClientComponentClient();

export default function TaskTerminalPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskItem["priority"]>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from Supabase, and migrate localStorage data if present
  useEffect(() => {
    if (!profile) return;
    if (profile.status !== "active") { setLoading(false); return; }

    const loadTasks = async () => {
      try {
        // Migrate any leftover localStorage tasks to Supabase (one-time)
        const lsKey = localStorageKey(profile.id);
        const localData = window.localStorage.getItem(lsKey);
        if (localData) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed = JSON.parse(localData) as any[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              const rowsToInsert = parsed.map(p => ({
                user_id: profile.id,
                title: p.title || "Untitled",
                notes: p.notes || "",
                priority: p.priority || "Medium",
                status: p.status || (p.done ? "Completed" : "Pending"),
                due_date: p.dueDate || null,
              }));
              await supabase.from("tasks").insert(rowsToInsert);
            }
          } catch { /* ignore parse errors */ }
          // Remove localStorage data after migration attempt
          window.localStorage.removeItem(lsKey);
        }

        // Fetch tasks from Supabase
        const { data, error: fetchError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setTasks((data || []).map(rowToTask));
        }
      } catch (e) {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    void loadTasks();
  }, [profile]);

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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !profile) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticTask: TaskItem = {
      id: tempId, title: cleanTitle, notes: "", priority,
      status: "Pending", dueDate: dueDate || null, createdAt: new Date().toISOString()
    };
    setTasks(current => [optimisticTask, ...current]);
    setTitle("");
    setDueDate("");
    setPriority("Medium");

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        user_id: profile.id, title: cleanTitle, notes: "",
        priority, status: "Pending", due_date: dueDate || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setTasks(current => current.filter(t => t.id !== tempId));
    } else if (data) {
      setTasks(current => current.map(t => t.id === tempId ? rowToTask(data) : t));
    }
  };

  const updateTaskStatus = async (id: string, newStatus: TaskItem["status"]) => {
    const previous = tasks;
    setTasks(current => current.map(t => t.id === id ? { ...t, status: newStatus } : t));

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setTasks(previous);
    }
  };

  const deleteTask = async (id: string) => {
    const previous = tasks;
    setTasks(current => current.filter(t => t.id !== id));

    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      setTasks(previous);
    }
  };

  const addTemplate = async (type: string) => {
    if (!profile) return;
    const rows: Array<{ user_id: string; title: string; notes: string; priority: string; status: string; due_date: null }> = [];
    if (type === "study") {
      rows.push(
        { user_id: profile.id, title: "Review Chapter 4 Notes", notes: "Focus on thermodynamics", priority: "High", status: "Pending", due_date: null },
        { user_id: profile.id, title: "Complete Practice Set 2", notes: "Questions 1-15", priority: "Medium", status: "Pending", due_date: null }
      );
    } else if (type === "lab") {
      rows.push(
        { user_id: profile.id, title: "Draft Lab Report", notes: "Include data tables and graphs", priority: "High", status: "In Progress", due_date: null },
        { user_id: profile.id, title: "Submit Prelab", notes: "Due before next Tuesday", priority: "High", status: "Pending", due_date: null }
      );
    }
    if (!rows.length) return;

    const { data, error: insertError } = await supabase.from("tasks").insert(rows).select();
    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setTasks(current => [...data.map(rowToTask), ...current]);
    }
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Task Terminal locked" description="Only active users can manage personal tasks." />;
  if (loading) return <LoadingCard title="Loading tasks..." />;

  const pendingTasks = filteredTasks.filter(t => t.status === "Pending");
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress");
  const completedTasks = filteredTasks.filter(t => t.status === "Completed");

  return (
    <div>
      <PageHeader title="Task Board" description="A personal Kanban board for organizing your academic work." profile={profile} />

      <div className="grid gap-6 xl:grid-cols-[1fr_var(--panel-width)]">
        {/* Main Kanban Content */}
        <div className="flex flex-col gap-5 min-w-0">
          
          {/* Compact Toolbar */}
          <Card padding="compact" className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <form onSubmit={handleCreateTask} className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task..." className="flex-1 min-w-[150px]" required />
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-36" />
              <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskItem["priority"])} className="w-24">
                <option value="Low">Low</option><option value="Medium">Med</option><option value="High">High</option>
              </Select>
              <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-[0.8125rem] font-bold text-black transition-colors hover:bg-[var(--accent-hover)] active:scale-[0.98]">
                Add
              </button>
            </form>
            
            <div className="flex items-center gap-3 w-full xl:w-56 shrink-0 relative">
              <Search size={15} className="absolute left-3 text-[var(--fg-faint)]" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="pl-9" />
            </div>
          </Card>

          <InlineAlert tone="error" message={error} />

          {/* Kanban Board */}
          {!tasks.length && !searchQuery ? (
            <Card className="text-center">
              <ListTodo size={44} className="mx-auto mb-3 text-[var(--fg-faint)] opacity-50" />
              <h2 className="text-h2 mb-2">Welcome to your Task Board</h2>
              <p className="text-body mb-6 max-w-md mx-auto">Organize your study sessions, assignments, and projects visually using this Kanban board.</p>
              
              <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <button onClick={() => addTemplate("study")} className="flex flex-col items-center p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-base)] hover:border-[var(--accent)] transition-colors group text-left">
                  <Activity size={22} className="mb-2 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                  <span className="text-h3 text-[var(--fg-default)] mb-1">Study Plan Template</span>
                  <span className="text-caption text-center">Add standard study routine tasks</span>
                </button>
                <button onClick={() => addTemplate("lab")} className="flex flex-col items-center p-5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-base)] hover:border-[var(--warning)] transition-colors group text-left">
                  <AlertTriangle size={22} className="mb-2 text-[var(--warning)] group-hover:scale-110 transition-transform" />
                  <span className="text-h3 text-[var(--fg-default)] mb-1">Lab Report Template</span>
                  <span className="text-caption text-center">Add checklist for lab submissions</span>
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              
              {/* Pending Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-overline text-[var(--fg-muted)]">Pending</h3>
                  <span className="rounded-[var(--radius-full)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-caption font-bold text-[var(--fg-default)]">{pendingTasks.length}</span>
                </div>
                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTaskStatus} onDelete={deleteTask} />
                ))}
              </div>

              {/* In Progress Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-overline text-[var(--warning)]">In Progress</h3>
                  <span className="rounded-[var(--radius-full)] bg-[var(--warning-muted)] text-[var(--warning)] px-2.5 py-0.5 text-caption font-bold">{inProgressTasks.length}</span>
                </div>
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTaskStatus} onDelete={deleteTask} />
                ))}
              </div>

              {/* Completed Column */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-overline text-[var(--success)]">Completed</h3>
                  <span className="rounded-[var(--radius-full)] bg-[var(--success-muted)] text-[var(--success)] px-2.5 py-0.5 text-caption font-bold">{completedTasks.length}</span>
                </div>
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onUpdate={updateTaskStatus} onDelete={deleteTask} />
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Productivity Stats */}
          <Card>
            <SectionHeader title="Productivity" icon={Activity} />
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-caption mb-1.5">
                  <span>Completion Rate</span>
                  <span className="font-bold text-[var(--fg-default)]">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--bg-subtle)]">
                  <div className="h-full rounded-[var(--radius-full)] bg-[var(--success)] transition-all duration-500" style={{ width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-h1 text-[var(--fg-default)]">{stats.inProgress}</p>
                  <p className="text-overline text-[var(--fg-faint)]">In Progress</p>
                </div>
                <div>
                  <p className="text-h1 text-[var(--fg-default)]">{stats.completed}</p>
                  <p className="text-overline text-[var(--fg-faint)]">Completed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Urgent / Overdue */}
          {stats.highPriority > 0 && (
            <Card className="border-[var(--error-border)] bg-[var(--error-muted)]">
              <SectionHeader title="Needs Attention" icon={AlertTriangle} iconColor="text-[var(--error)]" />
              <div className="space-y-3">
                {tasks.filter(t => t.status !== "Completed" && t.priority === "High").slice(0,3).map(t => (
                  <div key={t.id} className="flex gap-3 items-start">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-[var(--error)] shrink-0" />
                    <div>
                      <p className="text-h3 text-[var(--fg-default)]">{t.title}</p>
                      {t.dueDate && <p className="text-caption text-[var(--error)] mt-0.5">Due {t.dueDate}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Notes */}
          <Card>
            <SectionHeader title="Quick Notes" icon={Edit3} />
            <Textarea placeholder="Jot down quick thoughts here..." className="h-28" />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function TaskCard({ task, onUpdate, onDelete }: { task: TaskItem, onUpdate: (id: string, s: TaskItem["status"]) => void, onDelete: (id: string) => void }) {
  return (
    <article className={cn("group relative flex flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-raised)] p-4 transition-colors duration-[var(--duration-default)] hover:border-[var(--border-strong)]", task.status === "Completed" ? "border-[var(--success-border)] opacity-80" : "border-[var(--border-default)]")}>
      
      {/* Priority Badge */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="flex items-center gap-1 text-caption text-[var(--fg-faint)]">
            <CalendarIcon size={12} /> {task.dueDate}
          </span>
        )}
      </div>
      
      <h4 className={cn("text-h3 text-[var(--fg-default)] mb-1", task.status === "Completed" && "line-through text-[var(--fg-faint)]")}>{task.title}</h4>
      {task.notes && <p className="text-caption text-[var(--fg-faint)] line-clamp-2 mb-2.5">{task.notes}</p>}

      {/* Action Buttons */}
      <div className="mt-auto pt-2.5 flex items-center justify-between border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1">
          {task.status !== "Pending" && (
            <button onClick={() => onUpdate(task.id, task.status === "Completed" ? "In Progress" : "Pending")} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-faint)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)] transition-colors" title="Move back">
              <ArrowLeft size={14} />
            </button>
          )}
          {task.status !== "Completed" && (
            <button onClick={() => onUpdate(task.id, task.status === "Pending" ? "In Progress" : "Completed")} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-faint)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)] transition-colors" title="Move forward">
              <ArrowRight size={14} />
            </button>
          )}
          {task.status === "Completed" && (
            <button onClick={() => onUpdate(task.id, "Pending")} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-faint)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)] transition-colors" title="Restart task">
              <Activity size={14} />
            </button>
          )}
        </div>
        <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--fg-faint)] opacity-0 group-hover:opacity-100 hover:bg-[var(--error-muted)] hover:text-[var(--error)] transition-all">
          <Trash2 size={14} />
        </button>
      </div>

    </article>
  );
}
