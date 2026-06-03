"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowLeft, Hash, Users2, FileText, Send, Trash2, ShieldAlert, Bell, MessageSquare, ChevronDown, Pin } from "lucide-react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile, Room, ResourceItem } from "@/lib/types";
import { LoadingCard, InlineAlert } from "@/components/ui/Feedback";
import { MessageDisplay } from "@/components/ui/MessageDisplay";
import { formatDateTime, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile } = useAuth();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<"general" | "announcements">("general");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceChannel = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!profile?.id || !groupId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      // Fetch Room
      const { data: roomData } = await supabase.from("rooms").select("*").eq("id", groupId).single();
      if (mounted) setRoom((roomData as Room) ?? null);

      // Fetch Members
      const { data: memberData } = await supabase
        .from("room_members")
        .select("user_id, profiles:user_id(id, name, roll_no, programme, batch_year)")
        .eq("room_id", groupId);
      const profiles = (Array.isArray(memberData) ? memberData : [])
        .map((m) => (m as unknown as { profiles: Profile }).profiles)
        .filter(Boolean);
      if (mounted) setMembers(profiles);

      // Fetch Messages
      const { data: msgs, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", groupId)
        .order("created_at", { ascending: true })
        .limit(150);

      if (msgError) {
        if (mounted) setError(msgError.message);
      } else {
        const rows = Array.isArray(msgs) ? msgs : [];
        const senderIds = Array.from(new Set(rows.map((row) => row.sender_id)));
        const { data: senders } = senderIds.length
          ? await supabase.from("profiles").select("id, name, roll_no, programme, batch_year").in("id", senderIds)
          : { data: [] };
        const senderMap = new Map((Array.isArray(senders) ? senders : []).map((item) => [item.id, item]));
        if (mounted) setMessages(rows.map((row) => ({ ...row, sender: senderMap.get(row.sender_id) })));
      }

      // Fetch Room Resources
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*")
        .eq("room_id", groupId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (mounted && resourcesData) setResources(resourcesData);

      if (mounted) setLoading(false);
    };

    void load();

    // Setup Realtime Chat
    const channelName = `grp-${groupId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${groupId}` },
        async (payload) => {
          const row = payload.new as unknown as ChatMessage;
          const { data: sender } = await supabase.from("profiles").select("id, name").eq("id", row.sender_id).single();
          setMessages((current) => {
            if (current.some((item) => item.id === row.id)) return current;
            return [...current, { ...row, sender: (sender as Profile) ?? undefined }];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `room_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as unknown as ChatMessage;
          setMessages((current) => current.map((item) => (item.id === row.id ? { ...item, ...row } : item)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `room_id=eq.${groupId}` },
        (payload) => {
          const deletedId = (payload.old as { id?: string } | null)?.id;
          if (!deletedId) return;
          setMessages((current) => current.filter((item) => item.id !== deletedId));
        },
      )
      .subscribe();

    // Setup Realtime Presence (Typing Indicators)
    const presence = supabase.channel(`presence-${groupId}`);
    presenceChannel.current = presence;
    presence
      .on("presence", { event: "sync" }, () => {
        const state = presence.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((p: any) => p.isTyping && p.id !== profile.id)
          .map((p: any) => p.name);
        setTypingUsers(Array.from(new Set(typing)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({ id: profile.id, name: profile.name, isTyping: false });
        }
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(presence);
    };
  }, [profile?.id, groupId]);

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!presenceChannel.current) return;
    
    presenceChannel.current.track({ id: profile?.id, name: profile?.name, isTyping: text.length > 0 });
    
    // Clear typing status automatically after a delay if they stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        presenceChannel.current?.track({ id: profile?.id, name: profile?.name, isTyping: false });
      }, 3000);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || !profile?.id) return;
    setSending(true);
    setError(null);
    
    // Clear typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    presenceChannel.current?.track({ id: profile.id, name: profile.name, isTyping: false });

    const { error: sendError } = await supabase
      .from("messages")
      .insert({ room_id: groupId, sender_id: profile.id, content: inputText.trim(), is_anon: false });
    
    if (sendError) setError(sendError.message);
    else setInputText("");
    
    setSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    const previousMessages = [...messages];
    setMessages((current) => current.filter((msg) => msg.id !== messageId));
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    if (deleteError) {
      setError(deleteError.message);
      setMessages(previousMessages);
    }
  };

  const handleTogglePin = async (message: ChatMessage) => {
    if (!profile?.id) return;
    const previousMessages = [...messages];
    
    // Optimistic UI update
    setMessages(current => current.map(m => m.id === message.id ? { ...m, is_pinned: !m.is_pinned } : m));
    
    const { error: pinError } = await supabase
      .from("messages")
      .update({ is_pinned: !message.is_pinned })
      .eq("id", message.id);
      
    if (pinError) {
      setError(pinError.message);
      setMessages(previousMessages);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string, messages: ChatMessage[] }[] = [];
    let currentDate = "";
    
    messages.forEach(msg => {
      const dateObj = new Date(msg.created_at);
      const dateLabel = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      if (dateLabel !== currentDate) {
        currentDate = dateLabel;
        groups.push({ dateLabel, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });
    return groups;
  }, [messages]);

  if (loading || !profile) return <LoadingCard />;

  return (
    <div className="mx-auto flex h-[calc(100dvh-5.5rem)] w-full max-w-[1400px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg">
      
      {/* LEFT SIDEBAR: Channels & Navigation */}
      <nav className="flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[#0f0f11] hidden md:flex">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <Link href="/groups" className="text-[var(--muted)] hover:text-white transition-colors p-1 rounded-md hover:bg-[var(--surface)]"><ArrowLeft size={18} /></Link>
          <h2 className="font-bold text-white truncate max-w-[150px]">{room?.name || "Community"}</h2>
          <ChevronDown size={16} className="text-[var(--muted)]" />
        </header>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Text Channels */}
          <div>
            <h3 className="px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Text Channels</h3>
            <div className="space-y-0.5">
              <button 
                onClick={() => setActiveChannel("general")}
                className={cn("w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all", activeChannel === "general" ? "bg-[var(--surface)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-gray-300")}
              >
                <Hash size={16} className={activeChannel === "general" ? "text-white" : "text-[var(--muted)]"} /> general
              </button>
              <button 
                onClick={() => setActiveChannel("announcements")}
                className={cn("w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all", activeChannel === "announcements" ? "bg-[var(--surface)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-gray-300")}
              >
                <Bell size={16} className={activeChannel === "announcements" ? "text-white" : "text-[var(--muted)]"} /> announcements
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Quick Links</h3>
            <div className="space-y-0.5">
              <Link href="/vault" className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-gray-300 transition-all">
                <FileText size={16} /> Shared Vault
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* CENTER: Message Feed */}
      <main className="flex min-w-0 flex-1 flex-col bg-[var(--background)] relative">
        <header className="flex h-14 shrink-0 items-center border-b border-[var(--border)] px-4 bg-[var(--background)] z-10 shadow-sm">
          <div className="flex items-center gap-2">
            {activeChannel === "general" ? <Hash size={20} className="text-[var(--muted)]" /> : <Bell size={20} className="text-[var(--muted)]" />}
            <h1 className="text-base font-bold text-white">{activeChannel}</h1>
          </div>
          {room?.location && (
            <>
              <div className="mx-3 h-4 w-px bg-[var(--border)]" />
              <p className="text-sm font-medium text-[var(--muted)] truncate max-w-sm">{room.location}</p>
            </>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {error && <InlineAlert tone="error" message={error} />}

          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-start justify-end min-h-[300px] pb-8 border-b border-[var(--border)] mb-8">
              <div className="h-16 w-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to #{activeChannel}!</h2>
              <p className="text-[var(--muted)] max-w-md text-sm">This is the start of the <span className="font-bold text-gray-300">{room?.name}</span> community server. Introduce yourself or start sharing resources!</p>
            </div>
          )}

          {/* Message List */}
          {groupedMessages.map((group) => (
            <div key={group.dateLabel} className="space-y-6">
              {/* Date Separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{group.dateLabel}</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {/* Messages */}
              {group.messages.map((message, idx) => {
                const isMe = message.sender_id === profile.id;
                const prevMsg = group.messages[idx - 1];
                const isContinuation = prevMsg && prevMsg.sender_id === message.sender_id && (new Date(message.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60000);
                
                return (
                  <article key={message.id} className={cn("group flex gap-4 hover:bg-[var(--surface-soft)] -mx-4 px-4 py-1 rounded-md transition-colors", !isContinuation && "mt-4")}>
                    
                    {/* Avatar Area */}
                    <div className="w-10 shrink-0 flex justify-center">
                      {!isContinuation ? (
                        <div className="h-10 w-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-sm text-[var(--muted)]">
                          {message.sender?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--muted)] opacity-0 group-hover:opacity-100 self-center">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                      {!isContinuation && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={cn("text-sm font-bold", isMe ? "text-[var(--accent)]" : "text-emerald-400")}>{message.sender?.name || "Unknown User"}</span>
                          <span className="text-[10px] font-medium text-[var(--muted)]">{formatDateTime(message.created_at)}</span>
                          {message.is_pinned && <span title="Pinned"><Pin size={10} className="text-amber-400 fill-amber-400" /></span>}
                        </div>
                      )}
                      {isContinuation && message.is_pinned && (
                        <div className="mb-0.5" title="Pinned">
                          <Pin size={10} className="text-amber-400 fill-amber-400" />
                        </div>
                      )}
                      <div className="text-[13px] text-gray-200">
                        <MessageDisplay content={message.content} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {room?.created_by === profile.id && (
                        <button onClick={() => handleTogglePin(message)} className="p-1.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-amber-400 hover:border-amber-900 transition-all shadow-sm" title={message.is_pinned ? "Unpin message" : "Pin message"}>
                          <Pin size={14} className={message.is_pinned ? "fill-current" : ""} />
                        </button>
                      )}
                      {isMe && (
                        <button onClick={() => handleDeleteMessage(message.id)} className="p-1.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-red-400 hover:border-red-900 transition-all shadow-sm" title="Delete message">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ))}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)] animate-pulse pl-14">
              <span className="flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
                <span className="h-1 w-1 rounded-full bg-[var(--muted)]" />
              </span>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <footer className="px-4 pb-4 md:px-6 md:pb-6">
          <form onSubmit={handleSendMessage} className="relative">
            <textarea
              value={inputText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={`Message #${activeChannel}`}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] pl-4 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-sm"
              rows={1}
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || sending} 
              className="absolute right-2 top-2 bottom-2 flex w-10 items-center justify-center rounded-lg bg-[var(--accent)] text-black transition-all hover:bg-[#bce600] disabled:opacity-50 disabled:bg-[var(--surface)] disabled:text-[var(--muted)]"
            >
              <Send size={16} className={inputText.trim() ? "ml-0.5" : ""} />
            </button>
          </form>
        </footer>
      </main>

      {/* RIGHT SIDEBAR: Members & Context */}
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-[var(--border)] bg-[#0f0f11] p-4 lg:block">
        
        {/* About Group */}
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">About</h3>
          <div className="rounded-lg bg-[var(--surface)] p-3 text-sm text-gray-300 border border-[var(--border)] shadow-sm">
            {room?.contact_info || room?.description || "No description provided."}
          </div>
        </div>

        {/* Shared Resources Widget */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Recent Files</h3>
            <Link href="/vault" className="text-[10px] font-bold text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {resources.length === 0 ? (
              <p className="text-xs text-[var(--muted)] py-2 text-center rounded bg-[var(--surface-soft)] border border-[var(--border)]/50">No files shared yet.</p>
            ) : (
              resources.map(file => (
                <div key={file.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 hover:border-[var(--accent)]/50 transition-colors cursor-pointer group">
                  <div className="p-1.5 rounded bg-[var(--background)] text-blue-400 group-hover:text-[var(--accent)] transition-colors"><FileText size={14}/></div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{file.title}</p>
                    <p className="text-[10px] font-medium text-[var(--muted)]">{file.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members List */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <Users2 size={14}/> Members — {members.length}
          </h3>
          <div className="space-y-[2px]">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[var(--surface-soft)] transition-colors cursor-default group">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--muted)] group-hover:text-white transition-colors">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Fake online status for aesthetics */}
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-[2px] border-[#0f0f11]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-200 group-hover:text-white">{member.name}</p>
                  <p className="text-[10px] font-medium text-[var(--muted)] truncate">{member.programme} - {member.batch_year}</p>
                </div>
                {room?.created_by === member.id && (
                  <span title="Community Creator"><ShieldAlert size={12} className="text-amber-400 shrink-0" /></span>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
