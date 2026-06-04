"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  Check, X, FolderOpen, FileText, MessageSquare, 
  CheckSquare, Shield, BellRing, Settings, ExternalLink 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

interface NotificationPortalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string, e: React.MouseEvent) => void;
  onMarkAllRead: () => void;
  onClear: (id: string, e: React.MouseEvent) => void;
  bellRect: DOMRect | null;
}

// Map categories to icons and colors
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

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function NotificationPortal({ 
  isOpen, onClose, notifications, onMarkRead, onMarkAllRead, onClear, bellRect 
}: NotificationPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Lock body scroll if on mobile, optional
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  // Calculate position based on the Bell icon bounding client rect
  // Fallback to top-16 right-4 if rect isn't available
  const top = bellRect ? bellRect.bottom + 12 : 64;
  
  // To avoid overflowing on small screens, calculate right position
  // Assume a fixed padding from right edge if on mobile, else align with bell
  const rightOffset = typeof window !== "undefined" && window.innerWidth < 400 ? 16 : 24;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const portalContent = (
    <>
      {/* Invisible backdrop for click-outside */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Notification Panel */}
      <div 
        className="fixed z-[9999] flex flex-col w-[calc(100vw-32px)] max-w-[380px] bg-[#0A0A0A] border border-[var(--border)] rounded-xl shadow-2xl shadow-black origin-top-right animate-scale-in overflow-hidden"
        style={{ 
          top: `${top}px`, 
          right: `${rightOffset}px`,
          maxHeight: "70vh" 
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-soft)] shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-[10px] font-bold text-black">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button 
                onClick={onMarkAllRead}
                className="text-xs font-bold text-[var(--muted)] hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <BellRing size={24} className="text-[var(--border)] mb-3" />
              <p className="text-sm font-medium text-white">All caught up!</p>
              <p className="text-xs text-[var(--muted)] mt-1">You have no new notifications.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { icon: Icon, color, bg } = getCategoryDetails(n.type);
              
              return (
                <div 
                  key={n.id}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-lg p-3 transition-all",
                    n.is_read 
                      ? "hover:bg-[var(--surface-soft)] opacity-70" 
                      : "bg-[var(--surface)] hover:bg-[var(--surface-soft)] border border-[var(--border)]"
                  )}
                >
                  {/* Unread indicator dot */}
                  {!n.is_read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--accent)] rounded-r-full" />
                  )}

                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${bg} ${color}`}>
                    <Icon size={14} />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn(
                        "text-sm truncate",
                        n.is_read ? "font-medium text-[var(--muted)]" : "font-bold text-white"
                      )}>
                        {n.type}
                      </p>
                      <span className="shrink-0 text-[10px] font-medium text-[var(--muted)]">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5 line-clamp-2 leading-relaxed",
                      n.is_read ? "text-[var(--muted)]" : "text-gray-300"
                    )}>
                      {n.message}
                    </p>
                  </div>

                  {/* Actions (Hover) */}
                  <div className="absolute right-2 top-3 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex-row sm:top-1/2 sm:-translate-y-1/2 sm:right-3 sm:bg-gradient-to-l sm:from-[#111] sm:via-[#111] sm:to-transparent sm:pl-4">
                    {!n.is_read && (
                      <button 
                        onClick={(e) => onMarkRead(n.id, e)}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/30 transition-colors"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => onClear(n.id, e)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors"
                      title="Clear notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] shrink-0">
          <Link 
            href="/notifications"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold text-[var(--muted)] hover:text-white transition-colors"
          >
            View all notifications <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </>
  );

  return createPortal(portalContent, document.body);
}
