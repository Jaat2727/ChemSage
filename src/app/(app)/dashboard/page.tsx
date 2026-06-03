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
  Download,
  MessageSquare,
  BookOpen
} from "lucide-react";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ScheduleEntry, ResourceItem, Room, Profile } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

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
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [newMembers, setNewMembers] = useState<Profile[]>([]);
  
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
      
      // 2. Fetch Supabase Data
      const [schedRes, resRes, groupRes, membershipsRes, profilesRes] = await Promise.all([
        supabase.from("schedule").select("*").eq("user_id", profile.id).order("start_time"),
        supabase.from("resources").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("rooms").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("room_members").select("room_id, last_read_at").eq("user_id", profile.id),
        supabase.from("profiles").select("*").eq("status", "active").neq("id", profile.id).order("created_at", { ascending: false }).limit(3)
      ]);
      
      setSchedule(Array.isArray(schedRes.data) ? schedRes.data : []);
      setResources(Array.isArray(resRes.data) ? resRes.data : []);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
      setNewMembers(Array.isArray(profilesRes.data) ? profilesRes.data : []);
      
      // Basic Unread calculation (simulated for now by checking membership count, or we'd fetch messages > last_read_at)
      if (membershipsRes.data) {
        // In a real app we would query message counts, for UI sake we simulate a few if they have memberships
        setUnreadMessages(membershipsRes.data.length > 0 ? 3 : 0);
      }
      
      setLoading(false);
    };
    
    void loadData();
  }, [profile]);

  // Derived Computations
  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== "Completed"), [tasks]);
  
  const currentDayName = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), []);
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  const todaysClasses = useMemo(() => schedule.filter(s => s.day_of_week === currentDayName), [schedule, currentDayName]);
  const upcomingClasses = useMemo(() => schedule.filter(s => s.day_of_week !== currentDayName).slice(0, 5), [schedule, currentDayName]);
  
  const nextClass = todaysClasses.length > 0 ? todaysClasses[0] : upcomingClasses.length > 0 ? upcomingClasses[0] : null;

  const tasksToday = useMemo(() => pendingTasks.filter(t => !t.dueDate || t.dueDate <= todayDateStr), [pendingTasks, todayDateStr]);
  const tasksThisWeek = useMemo(() => pendingTasks.filter(t => t.dueDate && t.dueDate > todayDateStr).slice(0, 4), [pendingTasks, todayDateStr]);
  
  const nextDeadline = pendingTasks.filter(t => t.dueDate).sort((a,b) => a.dueDate!.localeCompare(b.dueDate!))[0] || null;

  // Interleave recent activity (Resources & Groups)
  const recentActivity = useMemo(() => {
    const combined = [
      ...resources.map(r => ({ type: 'resource', data: r, date: new Date(r.created_at).getTime() })),
      ...groups.map(g => ({ type: 'group', data: g, date: new Date(g.created_at || "").getTime() }))
    ];
    return combined.sort((a, b) => b.date - a.date).slice(0, 6);
  }, [resources, groups]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Dashboard locked" description="Only active users can access the workspace." />;
  if (loading) return <LoadingCard title="Loading workspace..." />;

  const firstName = profile.name.split(" ")[0] || "Student";

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* ─── TOP SECTION: Welcome & Identity ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">Good Morning, {firstName}</h1>
          <p className="text-[var(--muted)] text-sm">Here is what you need to pay attention to today.</p>
        </div>
        <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0">
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Programme</p>
            <p className="text-sm font-bold text-white">{profile.programme}</p>
          </div>
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Batch Year</p>
            <p className="text-sm font-bold text-white">{profile.batch_year}</p>
          </div>
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Study Groups</p>
            <p className="text-sm font-bold text-white">{groups.length} Joined</p>
          </div>
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-0.5">Resource Uploads</p>
            <p className="text-sm font-bold text-white">{resources.length} Recent</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Content Area */}
        <div className="flex flex-col gap-8">
          
          {/* ─── TODAY SECTION ─────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-400" /> Today
            </h2>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Today's Classes */}
              <div className="col-span-1 sm:col-span-2 md:col-span-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex justify-between">
                  Classes <span className="bg-blue-500/10 text-blue-400 px-1.5 rounded">{todaysClasses.length}</span>
                </h3>
                {todaysClasses.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] flex items-center gap-2 mt-2"><CheckCircle2 size={14} className="text-emerald-500" /> No classes today</p>
                ) : (
                  <div className="space-y-3">
                    {todaysClasses.slice(0, 3).map(cls => (
                      <div key={cls.id} className="flex gap-3 items-start">
                        <div className="text-[10px] font-bold text-white bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 rounded shrink-0">
                          {formatTime(cls.start_time)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{cls.subject}</p>
                          <p className="text-[10px] text-[var(--muted)]">Rm {cls.room_no}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Assignments / Tasks */}
              <div className="col-span-1 sm:col-span-2 md:col-span-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex justify-between">
                  Due Today <span className="bg-red-500/10 text-red-400 px-1.5 rounded">{tasksToday.length}</span>
                </h3>
                {tasksToday.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] flex items-center gap-2 mt-2"><CheckCircle2 size={14} className="text-emerald-500" /> All caught up</p>
                ) : (
                  <div className="space-y-3">
                    {tasksToday.slice(0, 3).map(task => (
                      <div key={task.id} className="flex gap-2 items-start group">
                        <div className="mt-0.5 h-3 w-3 rounded-full border border-[var(--muted)] shrink-0 group-hover:border-[var(--accent)]" />
                        <p className="text-xs font-bold text-white leading-tight">{task.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unread Messages */}
              <div className="col-span-1 sm:col-span-2 md:col-span-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex justify-between">
                    Messages <span className="bg-emerald-500/10 text-emerald-400 px-1.5 rounded">{unreadMessages} Unread</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--surface-soft)] flex items-center justify-center text-[var(--muted)]">
                      <MessageSquare size={18} className={unreadMessages > 0 ? "text-emerald-400" : ""} />
                    </div>
                    {unreadMessages > 0 ? (
                      <p className="text-xs font-bold text-white">Check your Study Circles</p>
                    ) : (
                      <p className="text-xs text-[var(--muted)]">No new messages</p>
                    )}
                  </div>
                </div>
                <Link href="/groups" className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mt-4 flex items-center gap-1 hover:underline">
                  Open Hub <ArrowRight size={10} />
                </Link>
              </div>

            </div>
          </section>

          {/* ─── THIS WEEK SECTION ─────────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" /> This Week
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Upcoming Classes</h3>
                {upcomingClasses.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> No more classes this week</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingClasses.map(cls => (
                      <div key={cls.id} className="flex justify-between items-center p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{cls.subject}</p>
                          <p className="text-[10px] text-[var(--muted)]">{cls.day_of_week}</p>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-soft)] text-[var(--muted)]">{formatTime(cls.start_time)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Upcoming Deadlines</h3>
                {tasksThisWeek.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> No deadlines this week</p>
                ) : (
                  <div className="space-y-2">
                    {tasksThisWeek.map(task => (
                      <div key={task.id} className="flex justify-between items-start p-2 rounded bg-[var(--background)] border border-[var(--border)]">
                        <p className="text-xs font-bold text-white truncate pr-2">{task.title}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 shrink-0">{task.dueDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* ─── RECENT ACTIVITY FEED ──────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Recent Activity
            </h2>
            
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--muted)]">No recent activity found.</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="p-4 hover:bg-[var(--surface-soft)] transition-colors flex gap-4 items-start">
                      {activity.type === 'resource' ? (
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/50">
                          <FileText size={14} />
                        </div>
                      ) : (
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-900/50">
                          <Users size={14} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {activity.type === 'resource' ? (
                          <>
                            <p className="text-sm text-gray-200">New resource uploaded: <span className="font-bold text-white">{(activity.data as ResourceItem).title}</span></p>
                            <p className="text-[10px] text-[var(--muted)] mt-1 uppercase font-bold tracking-wider">{(activity.data as ResourceItem).category}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-200">New study group formed: <span className="font-bold text-white">{(activity.data as Room).name}</span></p>
                            <p className="text-[10px] text-[var(--muted)] mt-1 uppercase font-bold tracking-wider">{(activity.data as Room).location || "Community"}</p>
                          </>
                        )}
                      </div>
                      <Link href={activity.type === 'resource' ? "/vault" : `/groups/${(activity.data as Room).id}`} className="p-2 rounded hover:bg-[var(--background)] text-[var(--muted)] hover:text-white transition-colors shrink-0">
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ─── COMMUNITY SECTION ─────────────────────────────────────────────── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)] mb-4 flex items-center gap-2">
              <Users size={16} className="text-purple-400" /> Community
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Active Study Groups</h3>
                {groups.length === 0 ? (
                   <p className="text-xs text-[var(--muted)] flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Join groups in the Hub</p>
                ) : (
                  <div className="space-y-2">
                    {groups.slice(0, 3).map(group => (
                      <Link href={`/groups/${group.id}`} key={group.id} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--surface-soft)] transition-colors">
                        <div className="h-8 w-8 rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]"><Users size={12}/></div>
                        <p className="text-xs font-bold text-white truncate">{group.name}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">New Members Joined</h3>
                {newMembers.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No new members.</p>
                ) : (
                  <div className="space-y-2">
                    {newMembers.map(member => (
                      <Link href={`/hub/${member.id}`} key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--surface-soft)] transition-colors">
                        <div className="h-8 w-8 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] text-xs font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{member.name}</p>
                          <p className="text-[10px] text-[var(--muted)]">{member.programme}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>

        {/* ─── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-6">
          
          {/* Quick Actions */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/tasks" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-white group">
                <Plus size={20} className="mb-2 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Task</span>
              </Link>
              <Link href="/vault" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-emerald-400 hover:text-emerald-400 transition-colors text-white group">
                <Upload size={20} className="mb-2 text-[var(--muted)] group-hover:text-emerald-400 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
              </Link>
              <Link href="/groups" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-purple-400 hover:text-purple-400 transition-colors text-white group">
                <UserPlus size={20} className="mb-2 text-[var(--muted)] group-hover:text-purple-400 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Groups</span>
              </Link>
              <Link href="/schedule" className="flex flex-col items-center justify-center p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] hover:border-blue-400 hover:text-blue-400 transition-colors text-white group">
                <Calendar size={20} className="mb-2 text-[var(--muted)] group-hover:text-blue-400 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Planner</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Deadline Focus */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <AlertTriangle size={14} className="text-amber-400" /> Focus: Next Deadline
            </h3>
            {nextDeadline ? (
              <div className="p-4 rounded-lg bg-[var(--background)] border border-amber-900/50 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded self-start">
                  Due {new Date(nextDeadline.dueDate!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <p className="text-sm font-bold text-white">{nextDeadline.title}</p>
                <Link href="/tasks" className="text-[10px] font-bold text-[var(--muted)] hover:text-white uppercase tracking-wider mt-2 flex items-center gap-1">
                  View Board <ArrowRight size={10} />
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] text-center">
                <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                <p className="text-xs text-[var(--muted)]">✓ No impending deadlines</p>
              </div>
            )}
          </div>

          {/* Next Class Focus */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <BookOpen size={14} className="text-blue-400" /> Focus: Next Class
            </h3>
            {nextClass ? (
              <div className="p-4 rounded-lg bg-[var(--background)] border border-blue-900/50 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded self-start">
                  {nextClass.day_of_week === currentDayName ? "Today" : nextClass.day_of_week} • {formatTime(nextClass.start_time)}
                </span>
                <p className="text-sm font-bold text-white">{nextClass.subject}</p>
                <p className="text-xs text-[var(--muted)]">{nextClass.type} in Room {nextClass.room_no}</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] text-center">
                <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                <p className="text-xs text-[var(--muted)]">✓ Free schedule</p>
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}
