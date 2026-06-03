"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  CheckCircle2, 
  CalendarClock, 
  FileText, 
  Users, 
  AlertTriangle, 
  Plus, 
  Upload, 
  UserPlus, 
  Calendar,
  Activity,
  ArrowRight,
  Clock,
  Download
} from "lucide-react";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ScheduleEntry, ResourceItem, Room } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { PageHeader } from "@/components/PageHeader";

const supabase = createClientComponentClient();

interface TaskItem {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string | null;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [groups, setGroups] = useState<Room[]>([]);
  
  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    
    const loadData = async () => {
      // 1. Load Local Tasks
      try {
        const savedTasks = window.localStorage.getItem(`chemsage.tasks.${profile.id}`);
        if (savedTasks) setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
      
      // 2. Fetch Supabase Data (Parallel)
      const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
      
      const [schedRes, resRes, groupRes] = await Promise.all([
        supabase.from("schedule").select("*").eq("user_id", profile.id).eq("day_of_week", currentDay).order("start_time"),
        supabase.from("resources").select("*").order("created_at", { ascending: false }).limit(3),
        supabase.from("rooms").select("*").order("created_at", { ascending: false }).limit(3)
      ]);
      
      setSchedule(Array.isArray(schedRes.data) ? schedRes.data : []);
      setResources(Array.isArray(resRes.data) ? resRes.data : []);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
      
      setLoading(false);
    };
    
    void loadData();
  }, [profile]);

  // Derived Computations
  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== "Completed"), [tasks]);
  const completedTasksCount = useMemo(() => tasks.filter(t => t.status === "Completed").length, [tasks]);
  
  const urgentDeadlines = useMemo(() => {
    return pendingTasks
      .filter(t => t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 3);
  }, [pendingTasks]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Dashboard locked" description="Only active users can access the workspace." />;
  if (loading) return <LoadingCard title="Loading workspace..." />;

  const firstName = profile.name.split(" ")[0] || "Student";

  return (
    <div className="pb-20 max-w-7xl mx-auto">
      
      {/* ─── Row 1: Welcome & Quick Stats ──────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white mb-6">Good Morning, {firstName}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col hover:border-[var(--accent)]/50 transition-colors">
            <div className="text-[var(--muted)] flex items-center gap-2 mb-2"><CheckCircle2 size={16} className="text-[var(--accent)]"/> <span className="text-xs font-bold uppercase tracking-wider">Tasks</span></div>
            <div className="text-2xl font-bold text-white">{pendingTasks.length} <span className="text-sm font-medium text-[var(--muted)]">Pending</span></div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col hover:border-blue-500/50 transition-colors">
            <div className="text-[var(--muted)] flex items-center gap-2 mb-2"><CalendarClock size={16} className="text-blue-400"/> <span className="text-xs font-bold uppercase tracking-wider">Classes</span></div>
            <div className="text-2xl font-bold text-white">{schedule.length} <span className="text-sm font-medium text-[var(--muted)]">Today</span></div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col hover:border-emerald-500/50 transition-colors">
            <div className="text-[var(--muted)] flex items-center gap-2 mb-2"><FileText size={16} className="text-emerald-400"/> <span className="text-xs font-bold uppercase tracking-wider">Resources</span></div>
            <div className="text-2xl font-bold text-white">12+ <span className="text-sm font-medium text-[var(--muted)]">New</span></div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col hover:border-purple-500/50 transition-colors">
            <div className="text-[var(--muted)] flex items-center gap-2 mb-2"><Users size={16} className="text-purple-400"/> <span className="text-xs font-bold uppercase tracking-wider">Groups</span></div>
            <div className="text-2xl font-bold text-white">{groups.length} <span className="text-sm font-medium text-[var(--muted)]">Active</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          
          {/* ─── Row 2: Today's Schedule ────────────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                <CalendarClock size={16} /> Today's Schedule
              </h2>
              <Link href="/schedule" className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1">Open Planner <ArrowRight size={12}/></Link>
            </div>
            
            {schedule.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-lg bg-[var(--background)]">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500/50 mb-2" />
                <p className="text-xs text-[var(--muted)]">No classes scheduled for today.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Horizontal Timeline Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[var(--surface-soft)] -translate-y-1/2 z-0 hidden md:block" />
                
                <div className="flex flex-col md:flex-row gap-4 relative z-10 overflow-x-auto pb-2">
                  {schedule.map((cls, i) => (
                    <div key={cls.id} className="min-w-[200px] flex-1 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--accent)]/50 transition-colors">
                      <div className="text-xs font-bold text-white shrink-0 bg-[var(--background)] border border-[var(--border)] px-2 py-1 rounded">
                        {formatTime(cls.start_time)}
                      </div>
                      <div className="hidden md:block w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--surface)] absolute left-6 top-1/2 -translate-y-1/2 mt-[2px]" style={{ left: `calc(${i * 100 / schedule.length}% + 24px)` }} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-0.5">{cls.subject}</p>
                        <p className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded uppercase font-bold",
                            cls.type === "Lecture" ? "bg-blue-500/10 text-blue-400" :
                            cls.type === "Lab" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                          )}>{cls.type}</span> 
                          • Rm {cls.room_no}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Row 3: Upcoming Deadlines ──────────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" /> Upcoming Deadlines
              </h2>
              <Link href="/tasks" className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1">Task Board <ArrowRight size={12}/></Link>
            </div>
            
            {urgentDeadlines.length === 0 ? (
               <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-lg bg-[var(--background)]">
                <p className="text-xs text-[var(--muted)]">No pending deadlines in your Task Board.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {urgentDeadlines.map(task => {
                  const isHigh = task.priority === "High";
                  return (
                    <div key={task.id} className={cn("p-3 rounded-lg border", isHigh ? "bg-red-950/10 border-red-900/50" : "bg-[var(--background)] border-[var(--border)]")}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", isHigh ? "bg-red-500/20 text-red-400" : "bg-[var(--surface-soft)] text-[var(--muted)]")}>
                          {task.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white truncate mb-1">{task.title}</p>
                      <p className={cn("text-[10px] font-bold flex items-center gap-1", isHigh ? "text-red-400" : "text-amber-400")}>
                        <Clock size={10} /> Due {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* ─── Row 4: Recent Resources ──────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" /> Recent Resources
                </h2>
                <Link href="/vault" className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1">Vault <ArrowRight size={12}/></Link>
              </div>
              <div className="space-y-3 flex-1">
                {resources.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] text-center py-4">No recent resources.</p>
                ) : resources.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50 transition-colors">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-bold text-white truncate">{res.title}</p>
                      <p className="text-[10px] text-[var(--muted)] uppercase font-bold mt-1">{res.category}</p>
                    </div>
                    <a href={res.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-[var(--surface-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-colors shrink-0">
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Row 5: Community Activity ──────────────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
                  <Users size={16} className="text-purple-400" /> New Study Groups
                </h2>
                <Link href="/groups" className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1">Groups <ArrowRight size={12}/></Link>
              </div>
              <div className="space-y-3 flex-1">
                {groups.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] text-center py-4">No active groups.</p>
                ) : groups.map(group => (
                  <Link href={`/groups/${group.id}`} key={group.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-purple-500/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{group.name}</p>
                      <p className="text-[10px] text-[var(--muted)] truncate mt-1">{group.description || "No description"}</p>
                    </div>
                    <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 shrink-0 ml-3">
                      <ArrowRight size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ─── Right Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-6">
          
          {/* Quick Actions */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/tasks" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-white group">
                <Plus size={20} className="mb-2 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
                <span className="text-xs font-bold">Add Task</span>
              </Link>
              <Link href="/vault" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-emerald-400 hover:text-emerald-400 transition-colors text-white group">
                <Upload size={20} className="mb-2 text-[var(--muted)] group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs font-bold">Upload</span>
              </Link>
              <Link href="/groups" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-purple-400 hover:text-purple-400 transition-colors text-white group">
                <UserPlus size={20} className="mb-2 text-[var(--muted)] group-hover:text-purple-400 transition-colors" />
                <span className="text-xs font-bold">Join Group</span>
              </Link>
              <Link href="/schedule" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-blue-400 hover:text-blue-400 transition-colors text-white group">
                <Calendar size={20} className="mb-2 text-[var(--muted)] group-hover:text-blue-400 transition-colors" />
                <span className="text-xs font-bold">Planner</span>
              </Link>
            </div>
          </div>

          {/* Academic Insights */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <Activity size={16} /> Academic Insights
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--muted)] mb-1">
                  <span>Tasks Completed</span>
                  <span className="text-white font-bold">{completedTasksCount} / {tasks.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--background)]">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--muted)] mb-1">
                  <span>Study Group Activity</span>
                  <span className="text-white font-bold">{groups.length} Joined</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--background)]">
                  <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(groups.length * 20, 100)}%` }} />
                </div>
              </div>
            </div>
            
            <div className="mt-5 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-start gap-3">
               <div className="p-1.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                 <CheckCircle2 size={14} />
               </div>
               <p className="text-xs text-[var(--muted)] leading-relaxed">
                 You have <span className="font-bold text-white">{pendingTasks.length}</span> pending tasks. Keep up the momentum!
               </p>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
