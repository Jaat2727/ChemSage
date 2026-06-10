"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  CheckCircle2, 
  CalendarClock, 
  FileText, 
  Users, 
  Plus, 
  Upload, 
  UserPlus, 
  Calendar,
  ArrowRight,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  BadgeCheck,
  Search,
  BookOpen
} from "lucide-react";
import { LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClientComponentClient } from "@/lib/supabase";
import type { ScheduleEntry, Room } from "@/lib/types";
import { formatTime, timeAgo, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

interface TaskItem {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string | null;
}

interface ResourceItem {
  id: string;
  title: string;
  category: string;
  created_at: string;
  uploader?: {
    name: string;
  };
}

interface MessageItem {
  id: string;
  content: string;
  created_at: string;
  is_anon: boolean;
  sender?: {
    name: string;
  };
  room?: {
    name: string;
  };
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [groups, setGroups] = useState<Room[]>([]);
  
  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    
    const loadData = async () => {
      const [tasksRes, schedRes, resRes, msgRes, groupRes] = await Promise.all([
        supabase.from("tasks")
          .select("id, title, priority, status, due_date")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("schedule")
          .select("id, subject, room_no, start_time, end_time, day_of_week, user_id, type")
          .eq("user_id", profile.id)
          .order("start_time"),
        supabase.from("resources")
          .select("id, title, category, created_at, uploaded_by, uploader:profiles!uploaded_by(name)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("messages")
          .select("id, content, created_at, sender_id, room_id, is_anon, sender:profiles!sender_id(name), room:rooms!room_id(name)")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.from("rooms")
          .select("id, name, description, created_at, created_by, is_public")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);
      
      setSchedule(Array.isArray(schedRes.data) ? schedRes.data : []);
      setResources(Array.isArray(resRes.data) ? (resRes.data as any) : []);
      setMessages(Array.isArray(msgRes.data) ? (msgRes.data as any) : []);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
      
      if (tasksRes.data && Array.isArray(tasksRes.data)) {
        setTasks(tasksRes.data.map((row: any) => ({
          id: row.id,
          title: row.title,
          priority: row.priority,
          status: row.status,
          dueDate: row.due_date || null
        })));
      }
      
      setLoading(false);
    };
    
    void loadData();
  }, [profile]);

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== "Completed"), [tasks]);
  const currentDayName = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()), []);
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  const todaysClasses = useMemo(() => schedule.filter(s => s.day_of_week === currentDayName), [schedule, currentDayName]);
  const upcomingClasses = useMemo(() => schedule.filter(s => s.day_of_week !== currentDayName).slice(0, 5), [schedule, currentDayName]);
  const nextClass = todaysClasses.length > 0 ? todaysClasses[0] : upcomingClasses.length > 0 ? upcomingClasses[0] : null;
  
  const tasksToday = useMemo(() => pendingTasks.filter(t => !t.dueDate || t.dueDate <= todayDateStr), [pendingTasks, todayDateStr]);
  const nextDeadline = pendingTasks.filter(t => t.dueDate).sort((a,b) => a.dueDate!.localeCompare(b.dueDate!))[0] || null;

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Dashboard locked" description="Only active users can access the workspace." />;
  if (loading) return <LoadingCard title="Loading workspace..." />;

  const firstName = profile.name.split(" ")[0] || "Student";

  return (
    <div className="flex flex-col gap-6 pb-8">
      
      {/* ─── Welcome Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-5">
        <div>
          <h1 className="text-h1 mb-1 font-black tracking-tight text-[var(--fg-default)]">Welcome back, {firstName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-caption text-[var(--fg-muted)]">
            <span className="font-mono text-[var(--accent)]">{profile.roll_no}</span>
            <span>•</span>
            <span>{profile.programme} Chemistry</span>
            <span>•</span>
            <span>Batch of {profile.batch_year}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[var(--success)] font-semibold bg-[var(--success-muted)] px-1.5 py-0.5 rounded text-[10px] border border-[var(--success-border)]">
              <BadgeCheck size={11} /> Verified Account
            </span>
          </div>
        </div>

        {/* Search bar helper */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--fg-faint)]">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            placeholder="Search Vault..."
            onClick={() => window.location.href = "/vault"}
            className="w-full pl-9 pr-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-[var(--fg-default)] placeholder-[var(--fg-faint)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            readOnly
          />
        </div>
      </div>

      {/* ─── Metric Overview Tiles ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Today's Classes" 
          value={String(todaysClasses.length)}
          subtext={todaysClasses.length === 1 ? "1 lecture scheduled" : `${todaysClasses.length} lectures scheduled`}
        />
        <StatCard 
          label="Pending Tasks" 
          value={String(pendingTasks.length)}
          subtext={pendingTasks.length === 1 ? "1 deadline remaining" : `${pendingTasks.length} deadlines remaining`}
        />
        <StatCard 
          label="Vault Resources" 
          value={String(resources.length)}
          subtext="Recently uploaded materials"
        />
        <StatCard 
          label="Joined Circles" 
          value={String(groups.length)}
          subtext="Active discussion hubs"
        />
      </div>

      {/* ─── Main Content Grid ─────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_var(--panel-width)]">
        
        {/* Left column: Simulated widgets using live connections */}
        <div className="grid gap-6 md:grid-cols-2 min-w-0">
          
          {/* 1. Today's Lectures */}
          <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-xl)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-4">
                <span className="font-bold text-[var(--fg-default)] text-xs uppercase tracking-wider text-[var(--info)] flex items-center gap-2">
                  <CalendarClock size={14} /> Today's Schedule
                </span>
                <span className="text-[10px] text-[var(--fg-muted)] font-mono uppercase font-bold">{currentDayName.substring(0, 3)}</span>
              </div>
              
              {todaysClasses.length === 0 ? (
                <div className="py-8 text-center text-caption text-[var(--fg-muted)] flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={24} className="text-[var(--success)] opacity-40" />
                  <p>No classes scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysClasses.map(cls => (
                    <div key={cls.id} className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-md)] flex justify-between items-center transition-colors hover:border-[var(--border-strong)]">
                      <div>
                        <span className="font-bold text-[var(--fg-default)] block text-xs leading-tight">{cls.subject}</span>
                        <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">
                          {cls.type} • Room {cls.room_no}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--accent)] shrink-0 bg-[var(--accent-muted)] px-2 py-1 rounded border border-[rgba(212,255,0,0.1)]">
                        {formatTime(cls.start_time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Link href="/schedule" className="text-caption text-[var(--accent)] mt-5 flex items-center gap-1 hover:underline select-none">
              Open Class Planner <ArrowRight size={12} />
            </Link>
          </div>
          
          {/* 2. Recent Vault Uploads */}
          <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-xl)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-4">
                <span className="font-bold text-[var(--fg-default)] text-xs uppercase tracking-wider text-[var(--success)] flex items-center gap-2">
                  <FolderOpen size={14} /> Resource Vault
                </span>
                <span className="text-[10px] text-[var(--fg-muted)]">Recent Files</span>
              </div>
              
              {resources.length === 0 ? (
                <div className="py-8 text-center text-caption text-[var(--fg-muted)] flex flex-col items-center justify-center gap-2">
                  <FolderOpen size={24} className="text-[var(--fg-faint)]" />
                  <p>No files uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {resources.map(res => (
                    <div key={res.id} className="flex items-center justify-between hover:bg-white/[0.01] p-2 rounded border border-transparent hover:border-[var(--border-subtle)] transition-colors">
                      <div className="min-w-0 pr-3">
                        <span className="truncate block text-xs font-semibold text-[var(--fg-default)] leading-tight">📄 {res.title}</span>
                        <p className="text-[9px] text-[var(--fg-faint)] mt-0.5">
                          By {res.uploader?.name || "Verified Student"} • {timeAgo(res.created_at)}
                        </p>
                      </div>
                      <span className="text-[9px] rounded bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success-border)] px-1.5 py-0.5 shrink-0 font-semibold font-mono">
                        {res.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Link href="/vault" className="text-caption text-[var(--accent)] mt-5 flex items-center gap-1 hover:underline select-none">
              Browse Vault Repository <ArrowRight size={12} />
            </Link>
          </div>
          
          {/* 3. Active Tasks / Deadlines */}
          <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-xl)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-4">
                <span className="font-bold text-[var(--fg-default)] text-xs uppercase tracking-wider text-[var(--warning)] flex items-center gap-2">
                  <ClipboardList size={14} /> Active Deadlines
                </span>
                <span className="text-[10px] text-[var(--fg-muted)] font-mono">{pendingTasks.length} Pending</span>
              </div>
              
              {pendingTasks.length === 0 ? (
                <div className="py-8 text-center text-caption text-[var(--fg-muted)] flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={24} className="text-[var(--success)] opacity-40" />
                  <p>All laboratory and assignment tasks completed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 3).map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "bg-[var(--bg-base)] border-l-2 p-3 rounded-[var(--radius-sm)] flex justify-between items-center transition-colors hover:bg-white/[0.01]",
                        task.priority === "High" ? "border-red-500" : task.priority === "Medium" ? "border-amber-500" : "border-blue-500"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-[var(--fg-default)] text-xs leading-tight truncate">{task.title}</p>
                        <p className="text-[9px] text-[var(--fg-muted)] mt-0.5 font-mono">Status: {task.status}</p>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 border",
                        task.priority === "High" ? "bg-[var(--error-muted)] text-red-400 border-[var(--error-border)]" :
                        task.priority === "Medium" ? "bg-[var(--warning-muted)] text-amber-400 border-[var(--warning-border)]" :
                        "bg-[var(--info-muted)] text-blue-400 border-[var(--info-border)]"
                      )}>
                        {task.dueDate ? `Due ${task.dueDate}` : "No Date"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Link href="/tasks" className="text-caption text-[var(--accent)] mt-5 flex items-center gap-1 hover:underline select-none">
              Manage Kanban Board <ArrowRight size={12} />
            </Link>
          </div>
          
          {/* 4. Study Circle Chats */}
          <div className="border border-[var(--border-default)] bg-[var(--bg-raised)] rounded-[var(--radius-xl)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-4">
                <span className="font-bold text-[var(--fg-default)] text-xs uppercase tracking-wider text-purple-400 flex items-center gap-2">
                  <MessageSquare size={14} /> Study Circle Chats
                </span>
                <span className="text-[10px] text-[var(--fg-muted)]">Live Activity</span>
              </div>
              
              {messages.length === 0 ? (
                <div className="py-8 text-center text-caption text-[var(--fg-muted)] flex flex-col items-center justify-center gap-2">
                  <MessageSquare size={24} className="text-[var(--fg-faint)]" />
                  <p>No chat messages yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                  {messages.map(msg => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center justify-between select-none">
                        <span className="text-[10px] font-bold text-purple-300">
                          {msg.is_anon ? "Anonymous Student" : (msg.sender?.name || "Classmate")}
                        </span>
                        <div className="flex items-center gap-1.5 text-[8px] font-mono text-[var(--fg-faint)]">
                          <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1 rounded">
                            {msg.room?.name || "Global"}
                          </span>
                          <span>{timeAgo(msg.created_at)}</span>
                        </div>
                      </div>
                      <p className="bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 rounded-[var(--radius-sm)] text-caption text-[var(--fg-default)] leading-snug">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Link href="/groups" className="text-caption text-[var(--accent)] mt-5 flex items-center gap-1 hover:underline select-none">
              Open Discussion Hub <ArrowRight size={12} />
            </Link>
          </div>

        </div>

        {/* Right column: Sidebar panel (Quick Actions & Focus Widgets) */}
        <aside className="flex flex-col gap-4">
          
          {/* Quick Actions Card */}
          <Card>
            <p className="text-overline text-[var(--fg-faint)] mb-4 select-none">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/tasks", icon: Plus, label: "Add Task", hoverColor: "hover:border-[var(--accent)] hover:text-[var(--accent)]" },
                { href: "/vault", icon: Upload, label: "Upload Resource", hoverColor: "hover:border-[var(--success)] hover:text-[var(--success)]" },
                { href: "/groups", icon: UserPlus, label: "Join Circles", hoverColor: "hover:border-purple-500 hover:text-purple-300" },
                { href: "/schedule", icon: Calendar, label: "View Planner", hoverColor: "hover:border-[var(--info)] hover:text-[var(--info)]" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)] transition-colors text-[var(--fg-default)] group select-none text-center",
                    item.hoverColor,
                  )}
                >
                  <item.icon size={18} className="mb-1.5 text-[var(--fg-faint)] group-hover:text-inherit transition-colors" />
                  <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>
          
          {/* Next Deadline focus widget */}
          <Card>
            <p className="text-overline text-[var(--fg-faint)] mb-3 flex items-center gap-1.5 select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" /> Focus: Next Deadline
            </p>
            {nextDeadline ? (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--warning-border)] flex flex-col gap-2">
                <Badge variant="warning">
                  Due {new Date(nextDeadline.dueDate!).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Badge>
                <p className="text-h3 font-bold text-[var(--fg-default)] leading-tight">{nextDeadline.title}</p>
                <Link href="/tasks" className="text-overline text-[var(--fg-faint)] hover:text-[var(--fg-default)] mt-1 flex items-center gap-1 hover:underline select-none">
                  View Task Board <ArrowRight size={10} />
                </Link>
              </div>
            ) : (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)] text-center select-none">
                <CheckCircle2 size={18} className="mx-auto mb-1.5 text-[var(--success)] opacity-50" />
                <p className="text-caption text-[var(--fg-muted)]">No deadlines remaining</p>
              </div>
            )}
          </Card>

          {/* Next Class focus widget */}
          <Card>
            <p className="text-overline text-[var(--fg-faint)] mb-3 flex items-center gap-1.5 select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--info)]" /> Focus: Next Class
            </p>
            {nextClass ? (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--info-border)] flex flex-col gap-2">
                <Badge variant="info">
                  {nextClass.day_of_week === currentDayName ? "Today" : nextClass.day_of_week} • {formatTime(nextClass.start_time)}
                </Badge>
                <p className="text-h3 font-bold text-[var(--fg-default)] leading-tight">{nextClass.subject}</p>
                <p className="text-caption text-[var(--fg-muted)]">{nextClass.type} in Room {nextClass.room_no}</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-base)] border border-[var(--border-default)] text-center select-none">
                <CheckCircle2 size={18} className="mx-auto mb-1.5 text-[var(--success)] opacity-50" />
                <p className="text-caption text-[var(--fg-muted)]">No lectures remaining</p>
              </div>
            )}
          </Card>

        </aside>
        
      </div>
    </div>
  );
}
