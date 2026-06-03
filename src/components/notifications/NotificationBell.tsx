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

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setNotifications(Array.isArray(data) ? data : [data]);
      }
    };

    void fetchNotifications();

    // Remove any existing channel with the same name first
    // (handles React Strict Mode double-mount and hot reload)
    const channelName = `user-notif-${profile.id}`;
    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    for (const id of unreadIds) {
       await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
  };

  if (!profile) return null;

  return (
    <div className="relative flex items-center" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center border border-transparent text-[var(--muted)] transition-all hover:border-[var(--border)] hover:text-white active:scale-95"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        {unreadCount > 0 ? (
          <>
            <BellDot size={20} className="text-[var(--accent)]" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 bg-[var(--accent)] animate-pulse" />
          </>
        ) : (
          <Bell size={20} />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top animate-scale-in rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 shadow-2xl shadow-black/60 md:left-auto md:right-0 md:w-[24rem]">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--border)] px-3 pb-3 pt-2">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-[var(--muted)]">
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex flex-col gap-1 rounded-lg border p-3 text-sm transition-all",
                    n.read
                      ? "border-transparent bg-transparent opacity-80 hover:bg-[var(--surface)]"
                      : "border-[var(--accent)]/20 bg-[var(--accent)]/5"
                  )}
                >
                  <p className={cn("pr-6 leading-relaxed line-clamp-3", n.read ? "text-[var(--muted)]" : "font-medium text-white")}>
                    {n.message}
                  </p>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
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
                      className="absolute right-3 top-3 p-1 text-[var(--accent)] opacity-0 transition-all hover:text-white md:group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {!n.read && (
                    <button
                      onClick={(e) => markAsRead(n.id, e)}
                      className="absolute right-3 top-3 p-1 text-[var(--accent)] transition-all active:text-white md:hidden"
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
