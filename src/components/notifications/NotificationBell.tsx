"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, BellDot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { NotificationPortal } from "./NotificationPortal";
import type { AppNotification } from "@/lib/types";

export function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [bellRect, setBellRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  const toggleOpen = () => {
    if (!isOpen && buttonRef.current) {
      setBellRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  };

  const handleClear = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  if (!profile) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95 ${
          isOpen 
            ? "border-[var(--border)] bg-[var(--surface)] text-white" 
            : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-white"
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        {unreadCount > 0 ? (
          <>
            <BellDot size={20} className={isOpen ? "text-white" : "text-[var(--accent)]"} />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse" />
          </>
        ) : (
          <Bell size={20} />
        )}
      </button>

      <NotificationPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onClear={handleClear}
        bellRect={bellRect}
      />
    </>
  );
}
