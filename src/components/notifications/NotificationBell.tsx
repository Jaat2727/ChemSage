"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, BellDot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!profile?.id) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from<Notification>("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setNotifications(Array.isArray(data) ? data : [data]);
      }
    };

    void fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase.channel(`notifications:user_id=eq.${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setNotifications((prev) => {
            const incoming = (payload.new as unknown) as Notification;
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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id).execute();
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    
    // Process sequentially for simplicity with custom DB client
    for (const id of unreadIds) {
       await supabase.from("notifications").update({ read: true }).eq("id", id).execute();
    }
  };

  if (!profile) return null;

  return (
    <div className="relative flex items-center" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white active:scale-95"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        {unreadCount > 0 ? (
          <>
            <BellDot size={20} className="text-blue-400" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-950 animate-pulse" />
          </>
        ) : (
          <Bell size={20} />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top animate-scale-in rounded-2xl border border-slate-800/80 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl md:left-auto md:right-0 md:w-[24rem]">
          <div className="mb-2 flex items-center justify-between border-b border-slate-800/50 px-3 pb-2 pt-2">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-[22rem] space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-slate-500">
                You have no notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex flex-col gap-1 rounded-xl border p-3 text-sm transition-all",
                    n.read
                      ? "border-transparent bg-transparent opacity-80 hover:bg-slate-800/30 hover:opacity-100"
                      : "border-blue-500/20 bg-blue-500/10"
                  )}
                >
                  <p className={cn("pr-6 leading-relaxed line-clamp-3", n.read ? "text-slate-400" : "text-slate-200 font-medium")}>
                    {n.message}
                  </p>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>

                  {!n.read && (
                    <button
                      onClick={(e) => markAsRead(n.id, e)}
                      className="absolute right-3 top-3 rounded-full bg-blue-500/20 p-1 text-blue-400 opacity-0 transition-all hover:bg-blue-500 hover:text-white md:group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {/* Always visible on touch devices */}
                  {!n.read && (
                    <button
                      onClick={(e) => markAsRead(n.id, e)}
                      className="absolute right-3 top-3 rounded-full bg-blue-500/20 p-1 text-blue-400 transition-all active:bg-blue-500 active:text-white md:hidden"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
