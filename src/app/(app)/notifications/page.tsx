"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  BellRing, Check, CheckSquare, FileText, FolderOpen, 
  MessageSquare, Shield, Trash2, X, Filter 
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, LoadingCard } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn, formatDateTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

// Category configuration matches portal
const CATEGORIES = ["All", "Resources", "Past Papers", "Study Circles", "Tasks", "Messages", "Admin", "System"] as const;
type FilterCategory = typeof CATEGORIES[number];

const getCategoryDetails = (type: string) => {
  switch (type.toLowerCase()) {
    case "resources":
      return { icon: FolderOpen, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" };
    case "past papers":
      return { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" };
    case "study circles":
      return { icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" };
    case "tasks":
      return { icon: CheckSquare, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "messages":
      return { icon: MessageSquare, color: "text-pink-400", bg: "bg-pink-500/10" };
    case "admin":
      return { icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10" };
    default:
      return { icon: BellRing, color: "text-gray-400", bg: "bg-gray-500/10" };
  }
};

export default function NotificationsPage() {
  const { profile } = useAuth();
  const supabase = createClientComponentClient();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");

  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotifications(Array.isArray(data) ? data : [data]);
      }
      setLoading(false);
    };

    void fetchNotifications();

    // Listen for realtime updates
    const channelName = `user-notif-page-${profile.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications((prev) => {
            const incoming = (payload.new as unknown) as AppNotification;
            if (prev.some((item) => item.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "All") return notifications;
    return notifications.filter(n => n.type.toLowerCase() === activeFilter.toLowerCase());
  }, [notifications, activeFilter]);

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = filteredNotifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;

    setNotifications((prev) => prev.map((n) => 
      unreadIds.includes(n.id) ? { ...n, read: true } : n
    ));

    for (const id of unreadIds) {
       await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
  };

  const handleClear = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const handleClearAllRead = async () => {
    const readIds = filteredNotifications.filter((n) => n.read).map((n) => n.id);
    if (!readIds.length) return;
    
    if (!confirm("Are you sure you want to delete all read notifications?")) return;

    setNotifications((prev) => prev.filter((n) => !readIds.includes(n.id)));

    for (const id of readIds) {
       await supabase.from("notifications").delete().eq("id", id);
    }
  };

  if (!profile) return null;
  if (loading) return <LoadingCard title="> loading inbox..." />;

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <PageHeader 
        title="Inbox" 
        description="All your alerts, mentions, and updates across ChemSAGE." 
        profile={profile} 
      />

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full shrink-0 md:w-64">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Filter size={16} className="text-[var(--muted)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Categories</h3>
            </div>
            <nav className="flex flex-col gap-1">
              {CATEGORIES.map(category => {
                const isActive = activeFilter === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]" 
                        : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"
                    )}
                  >
                    {category}
                    {category === "All" && notifications.filter(n => !n.read).length > 0 && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-black">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3">
            <p className="text-sm font-medium text-[var(--muted)]">
              Showing <strong className="text-white">{filteredNotifications.length}</strong> {activeFilter === "All" ? "total" : activeFilter.toLowerCase()} notifications
            </p>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:text-white hover:border-white/20 active:scale-[0.97]"
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
              {filteredNotifications.some(n => n.read) && (
                <button 
                  onClick={handleClearAllRead}
                  className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:text-red-400 hover:border-red-500/30 active:scale-[0.97]"
                >
                  <Trash2 size={14} /> Clear read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="p-12">
                <EmptyState 
                  title="Inbox Zero" 
                  description={activeFilter === "All" ? "You have no notifications." : `No notifications found for ${activeFilter}.`} 
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filteredNotifications.map((n) => {
                  const { icon: Icon, color, bg } = getCategoryDetails(n.type);
                  
                  return (
                    <div 
                      key={n.id}
                      className={cn(
                        "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors",
                        n.read ? "bg-transparent opacity-80" : "bg-[var(--surface-soft)]"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] ${bg} ${color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "text-base font-bold",
                              n.read ? "text-[var(--muted)]" : "text-white"
                            )}>
                              {n.type}
                            </p>
                            {!n.read && <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] border border-[var(--accent)]/20">New</span>}
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
                            {n.message}
                          </p>
                          <p className="mt-2 text-xs font-medium text-[var(--border)]">
                            {formatDateTime(n.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button 
                            onClick={() => handleMarkRead(n.id)}
                            className="flex items-center gap-2 rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:text-white hover:border-white/30"
                          >
                            <Check size={14} /> Mark Read
                          </button>
                        )}
                        <button 
                          onClick={() => handleClear(n.id)}
                          className="flex items-center gap-2 rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:text-red-400 hover:border-red-500/30"
                        >
                          <X size={14} /> Clear
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
