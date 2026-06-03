"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Hash, MessageSquare, Search, Star, Clock, User as UserIcon } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn, formatDateTime } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const supabase = createClientComponentClient();

interface DMChat {
  roomId: string;
  otherUser: Profile;
  lastMessage: { content: string; created_at: string; sender_id: string } | null;
  lastReadAt: string | null;
  isFavorite: boolean;
  unreadCount: number;
}

export default function DirectChatsSidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [chats, setChats] = useState<DMChat[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile?.id) return;
    let mounted = true;

    const load = async () => {
      // 1. Get my memberships
      const { data: myMemberships } = await supabase
        .from("room_members")
        .select("room_id, last_read_at, is_favorite")
        .eq("user_id", profile.id);
        
      const myRooms = Array.isArray(myMemberships) ? myMemberships : [];
      const privateRoomIds = myRooms.filter(m => m.room_id.includes("-")).map(m => m.room_id);

      if (privateRoomIds.length === 0) {
        if (mounted) setLoading(false);
        return;
      }

      // 2. Get other members profiles
      const { data: otherMembersData } = await supabase
        .from("room_members")
        .select("room_id, user_id, profiles(id, name, roll_no, programme, batch_year)")
        .in("room_id", privateRoomIds)
        .neq("user_id", profile.id);

      const otherMembers = Array.isArray(otherMembersData) ? otherMembersData : [];

      // 3. Get latest messages (we fetch recent 500 across all DMs and group locally for ease)
      const { data: messagesData } = await supabase
        .from("messages")
        .select("room_id, content, created_at, sender_id")
        .in("room_id", privateRoomIds)
        .order("created_at", { ascending: false })
        .limit(500);

      const messages = Array.isArray(messagesData) ? messagesData : [];
      
      const builtChats: DMChat[] = [];
      for (const myMem of myRooms) {
        if (!privateRoomIds.includes(myMem.room_id)) continue;
        
        const otherMem = otherMembers.find(o => o.room_id === myMem.room_id);
        if (!otherMem || !otherMem.profiles) continue;
        
        const roomMsgs = messages.filter(m => m.room_id === myMem.room_id);
        const lastMsg = roomMsgs.length > 0 ? roomMsgs[0] : null;
        
        // Calculate unread
        let unreadCount = 0;
        if (myMem.last_read_at) {
          unreadCount = roomMsgs.filter(m => new Date(m.created_at) > new Date(myMem.last_read_at!)).length;
        } else {
          unreadCount = roomMsgs.length;
        }

        builtChats.push({
          roomId: myMem.room_id,
          otherUser: otherMem.profiles as unknown as Profile,
          lastMessage: lastMsg,
          lastReadAt: myMem.last_read_at || null,
          isFavorite: myMem.is_favorite || false,
          unreadCount,
        });
      }
      
      // Sort by last message date
      builtChats.sort((a, b) => {
        const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
        const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
        return dateB - dateA;
      });

      if (mounted) {
        setChats(builtChats);
        setLoading(false);
      }
    };
    
    void load();

    // Global Presence
    const presence = supabase.channel('hub-presence');
    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        const online = new Set<string>();
        Object.values(state).flat().forEach((p: any) => online.add(p.id));
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({ id: profile.id });
        }
      });
      
    // Listen for new messages across all rooms to update lastMessage and unreadCount
    const messagesChannel = supabase.channel('hub-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.sender_id === profile.id) return; // My own message doesn't bump unread usually if I'm in the room, but let's just update the list
        
        setChats(current => {
          const chatIdx = current.findIndex(c => c.roomId === newMsg.room_id);
          if (chatIdx === -1) return current; // Room not in list yet, requires a full refresh to get member profiles. For simplicity, we ignore newly created rooms until refresh.
          
          const newChats = [...current];
          const chat = { ...newChats[chatIdx] };
          chat.lastMessage = { content: newMsg.content, created_at: newMsg.created_at, sender_id: newMsg.sender_id };
          
          // Only bump unread if we are not currently in that room
          if (!pathname.includes(chat.roomId) && !pathname.includes(chat.otherUser.id)) {
            chat.unreadCount += 1;
          }
          
          newChats.splice(chatIdx, 1);
          newChats.unshift(chat); // Move to top
          return newChats;
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(presence);
      supabase.removeChannel(messagesChannel);
    };
  }, [profile?.id, pathname]);

  const toggleFavorite = async (e: React.MouseEvent, chat: DMChat) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newVal = !chat.isFavorite;
    setChats(current => current.map(c => c.roomId === chat.roomId ? { ...c, isFavorite: newVal } : c));
    
    await supabase.from('room_members')
      .update({ is_favorite: newVal })
      .eq('room_id', chat.roomId)
      .eq('user_id', profile?.id);
  };

  const filteredChats = useMemo(() => {
    if (!search) return chats;
    const lower = search.toLowerCase();
    return chats.filter(c => c.otherUser.name.toLowerCase().includes(lower) || c.otherUser.roll_no.toLowerCase().includes(lower));
  }, [chats, search]);

  const favorites = filteredChats.filter(c => c.isFavorite);
  const recents = filteredChats.filter(c => !c.isFavorite);

  return (
    <nav className="flex w-72 shrink-0 flex-col border-r border-[var(--border)] bg-[#0f0f11] hidden md:flex">
      
      {/* Header & Search */}
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-xl font-bold text-white mb-4">Direct Chats</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..." 
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm font-medium text-white placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-6">
        
        {/* Global Hub link */}
        <div className="px-2">
          <Link 
            href="/hub/global" 
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-all group", pathname.includes("/hub/global") ? "bg-[var(--surface)] text-white" : "hover:bg-[var(--surface-soft)] text-gray-300")}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-soft)] transition-colors", pathname.includes("/hub/global") ? "bg-[var(--accent)] text-black" : "group-hover:bg-[var(--surface)] group-hover:text-white")}>
              <Hash size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">Global Hub</p>
            </div>
          </Link>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <h3 className="px-4 mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <Star size={12} /> Favorites
            </h3>
            <div className="space-y-0.5 px-2">
              {favorites.map(chat => (
                <ChatItem 
                  key={chat.roomId} 
                  chat={chat} 
                  isActive={pathname.includes(chat.otherUser.id)} 
                  isOnline={onlineUsers.has(chat.otherUser.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        <div>
          <h3 className="px-4 mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <Clock size={12} /> Recent Conversations
          </h3>
          {loading ? (
            <div className="px-4 py-2 text-sm text-[var(--muted)]">Loading chats...</div>
          ) : recents.length === 0 && favorites.length === 0 ? (
            <div className="px-4 py-4 text-center text-[var(--muted)]">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No active conversations</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {recents.map(chat => (
                <ChatItem 
                  key={chat.roomId} 
                  chat={chat} 
                  isActive={pathname.includes(chat.otherUser.id)}
                  isOnline={onlineUsers.has(chat.otherUser.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
        
      </div>
    </nav>
  );
}

function ChatItem({ chat, isActive, isOnline, onToggleFavorite }: { chat: DMChat, isActive: boolean, isOnline: boolean, onToggleFavorite: (e: React.MouseEvent, chat: DMChat) => void }) {
  return (
    <Link 
      href={`/hub/${chat.otherUser.id}`}
      className={cn("group flex items-center gap-3 rounded-lg px-2 py-2 transition-all relative overflow-hidden", isActive ? "bg-[var(--surface)] text-white shadow-sm border border-[var(--border)]" : "hover:bg-[var(--surface-soft)] text-gray-300 border border-transparent")}
    >
      <div className="relative shrink-0">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm", isActive ? "bg-[var(--background)] text-white" : "bg-[var(--surface)] text-[var(--muted)] group-hover:text-white")}>
          {chat.otherUser.name.charAt(0).toUpperCase()}
        </div>
        <div className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0f0f11]", isOnline ? "bg-emerald-500" : "bg-gray-600")} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="truncate text-sm font-bold">{chat.otherUser.name}</p>
          {chat.lastMessage && (
            <span className={cn("text-[10px] whitespace-nowrap ml-2", chat.unreadCount > 0 ? "text-[var(--accent)] font-bold" : "text-[var(--muted)] font-medium")}>
              {new Date(chat.lastMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-[11px]", chat.unreadCount > 0 ? "text-white font-medium" : "text-[var(--muted)]")}>
            {chat.lastMessage?.content || "Started a conversation"}
          </p>
          {chat.unreadCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-black">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>

      <button 
        onClick={(e) => onToggleFavorite(e, chat)} 
        className={cn("absolute right-2 top-2 p-1.5 rounded bg-[var(--background)] border border-[var(--border)] transition-all shadow-sm opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0", chat.isFavorite ? "opacity-100 translate-x-0 text-amber-400 border-amber-900/50" : "text-[var(--muted)] hover:text-amber-400")}
      >
        <Star size={12} className={chat.isFavorite ? "fill-current" : ""} />
      </button>
    </Link>
  );
}
