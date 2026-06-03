"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Trash2, User as UserIcon, Wifi, BookOpen, Users2, Link as LinkIcon, Download, FileText, Image as ImageIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile, Room, ScheduleEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LoadingCard } from "@/components/ui/Feedback";
import { MessageDisplay } from "@/components/ui/MessageDisplay";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function DirectMessagePage() {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const { profile } = useAuth();
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mutualRooms, setMutualRooms] = useState<Room[]>([]);
  const [sharedClasses, setSharedClasses] = useState<ScheduleEntry[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = profile?.id && otherUserId ? [profile.id, otherUserId].sort().join("-") : "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!profile?.id || !otherUserId || !roomId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", otherUserId).single();
      if (mounted) setOtherUser((userProfile as Profile) ?? null);

      await supabase.from("rooms").insert({ id: roomId, name: `DM_${roomId}`, is_public: false, created_by: profile.id });
      await supabase.from("room_members").insert({ room_id: roomId, user_id: profile.id });
      await supabase.from("room_members").insert({ room_id: roomId, user_id: otherUserId });

      const { data: msgs, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(120);

      if (msgError) {
        if (mounted) setError(msgError.message);
      } else if (mounted) {
        setMessages(Array.isArray(msgs) ? msgs : []);
      }

      // Fetch Context Data (Mutual Groups & Shared Classes)
      const { data: myRoomsData } = await supabase.from('room_members').select('room_id').eq('user_id', profile.id);
      const { data: theirRoomsData } = await supabase.from('room_members').select('room_id').eq('user_id', otherUserId);
      const myRoomIds = (myRoomsData || []).map(r => r.room_id);
      const theirRoomIds = (theirRoomsData || []).map(r => r.room_id);
      const mutualRoomIds = myRoomIds.filter(id => theirRoomIds.includes(id) && !id.includes('-'));

      if (mutualRoomIds.length > 0) {
        const { data: mutuals } = await supabase.from('rooms').select('*').in('id', mutualRoomIds).eq('is_public', true);
        if (mounted && mutuals) setMutualRooms(mutuals);
      }

      const { data: mySchedule } = await supabase.from('schedule').select('*').eq('user_id', profile.id);
      const { data: theirSchedule } = await supabase.from('schedule').select('*').eq('user_id', otherUserId);
      
      if (mySchedule && theirSchedule && mounted) {
        const shared = mySchedule.filter(myClass => 
          theirSchedule.some(theirClass => theirClass.subject === myClass.subject && theirClass.type === myClass.type)
        );
        setSharedClasses(shared);
      }

      if (mounted) setLoading(false);
      
      // Clear unread count on mount
      if (profile.id) {
        await supabase.from("room_members").update({ last_read_at: new Date().toISOString() }).eq("room_id", roomId).eq("user_id", profile.id);
      }
    };

    void load();

    // Clean up any stale channel (React Strict Mode / HMR)
    const channelName = `dm-${roomId}`;
    const stale = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (stale) supabase.removeChannel(stale);

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        const row = payload.new as unknown as ChatMessage;
        setMessages((current) => {
          if (current.some((item) => item.id === row.id)) return current;
          return [...current, row];
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        const deletedId = (payload.old as { id?: string } | null)?.id;
        if (!deletedId) return;
        setMessages((current) => current.filter((item) => item.id !== deletedId));
      })
      .subscribe((status) => {
        setSyncing(status !== "SUBSCRIBED");
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id, otherUserId, roomId]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    
    // Optimistic UI update
    const previousMessages = [...messages];
    setMessages((current) => current.filter((msg) => msg.id !== messageId));

    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    
    if (deleteError) {
      setError(deleteError.message);
      // Revert on error
      setMessages(previousMessages);
    }
  };

  if (loading || !profile || !otherUser) return <LoadingCard />;

  const icebreakers = [
    `Hey ${otherUser.name.split(" ")[0]}!`,
    sharedClasses.length > 0 ? `Are you ready for ${sharedClasses[0].subject}?` : "How are your classes going?",
    mutualRooms.length > 0 ? `I saw you're also in ${mutualRooms[0].name}!` : "Want to study together sometime?",
  ];

  // Dummy attachment parser (extracts URLs from chat history for demo)
  const attachments = messages
    .filter(m => m.content.includes("http"))
    .map(m => {
      const url = m.content.match(/https?:\/\/[^\s]+/)?.[0] || "";
      return { id: m.id, url, title: url.split("/").pop() || url, type: url.includes(".pdf") ? "pdf" : url.match(/\.(jpeg|jpg|gif|png)$/) ? "image" : "link" };
    }).slice(-5); // Get last 5

  return (
    <div className="flex-1 flex h-full bg-[var(--background)]">
      
      {/* Left Chat Column */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border)] relative">
        <header className="flex h-14 shrink-0 items-center border-b border-[var(--border)] px-4 bg-[var(--surface-soft)] shadow-sm">
          <Link href="/hub" className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-white md:hidden">
            <ArrowLeft size={18} />
          </Link>
          
          <div className="flex-1 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-sm text-[var(--muted)]">
                {otherUser?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">{otherUser?.name || "Direct chat"}</h1>
                <p className="text-[10px] font-medium text-[var(--muted)] leading-tight">{otherUser?.roll_no || "one-to-one room"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <Wifi size={12} className={syncing ? "text-amber-400" : "text-emerald-400"} />
              {syncing ? "Syncing" : "Connected"}
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
          {error ? <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">{error}</p> : null}

          {messages.length === 0 ? (
            <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-md">
              <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-2xl font-bold text-[var(--muted)]">
                {otherUser?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{otherUser?.name}</h2>
              <p className="text-sm text-[var(--muted)] mb-6">
                This is the beginning of your direct message history with <strong>{otherUser?.name}</strong>.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2">
                {icebreakers.map((text, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInputText(text)}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-white"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => {
            const isMe = message.sender_id === profile.id;
            return (
              <article key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`max-w-[88%] px-4 py-2.5 text-sm ${isMe ? "rounded-2xl rounded-tr-sm bg-[var(--accent)] text-black" : "rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface-soft)] text-white"}`}>
                  <MessageDisplay content={message.content} />
                </div>

                <div className="mt-1.5 flex items-center gap-2 px-2 text-[11px] font-medium text-[var(--muted)]">
                  <span>{formatDateTime(message.created_at)}</span>
                  {isMe ? (
                    <button onClick={() => handleDeleteMessage(message.id)} className="text-[var(--muted)] hover:text-red-300 transition-colors" title="Delete message">
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
          <div ref={messagesEndRef} />
        </section>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inputText.trim() || !profile.id || !roomId) return;
              setSending(true);
              setError(null);
              const { error: insertError } = await supabase.from("messages").insert({
                room_id: roomId,
                sender_id: profile.id,
                content: inputText.trim(),
                is_anon: false,
              });
              if (insertError) setError(insertError.message);
              else setInputText("");
              setSending(false);
            }}
            className="flex items-end gap-3"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={`Message @${otherUser.name}`}
              className="min-h-[44px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              rows={1}
            />
            <button type="submit" disabled={!inputText.trim() || sending} className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-black transition-colors hover:bg-[#bce600] disabled:opacity-50">
              <Send size={18} />
            </button>
          </form>
        </footer>
      </div>

      {/* Right Context Column */}
      <aside className="w-72 shrink-0 bg-[#0f0f11] overflow-y-auto hidden lg:block border-l border-[var(--border)]">
        
        {/* Profile Card */}
        <div className="p-6 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-transparent">
          <div className="mx-auto h-20 w-20 rounded-full bg-[var(--background)] border-2 border-[var(--accent)] flex items-center justify-center text-2xl font-bold text-white mb-4 relative shadow-[0_0_15px_rgba(188,230,0,0.15)]">
            {otherUser?.name?.charAt(0).toUpperCase()}
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-[3px] border-[#0f0f11]" title="Online" />
          </div>
          <h2 className="text-center text-lg font-bold text-white">{otherUser?.name}</h2>
          <p className="text-center text-xs font-medium text-[var(--muted)] mt-1">{otherUser?.programme} - {otherUser?.batch_year}</p>
          <p className="text-center text-xs font-bold text-[var(--accent)] mt-1">Roll No: {otherUser?.roll_no}</p>
        </div>

        <div className="p-4 space-y-6">
          
          {/* Mutual Groups */}
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              <Users2 size={14} /> Mutual Communities
            </h3>
            {mutualRooms.length === 0 ? (
              <p className="text-xs text-[var(--muted)] bg-[var(--surface-soft)] p-3 rounded-lg border border-[var(--border)] text-center">No mutual communities.</p>
            ) : (
              <div className="space-y-1.5">
                {mutualRooms.map(room => (
                  <Link key={room.id} href={`/groups/${room.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-soft)] transition-colors border border-transparent hover:border-[var(--border)]">
                    <div className="h-8 w-8 rounded bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                      <Users2 size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{room.name}</p>
                      {room.location && <p className="truncate text-[10px] text-[var(--muted)]">{room.location}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Shared Classes */}
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              <BookOpen size={14} /> Shared Classes
            </h3>
            {sharedClasses.length === 0 ? (
              <p className="text-xs text-[var(--muted)] bg-[var(--surface-soft)] p-3 rounded-lg border border-[var(--border)] text-center">No shared classes on schedule.</p>
            ) : (
              <div className="space-y-1.5">
                {sharedClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{cls.subject}</p>
                      <p className="truncate text-[10px] text-[var(--muted)]">{cls.type} • {cls.day_of_week}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shared Links Placeholder */}
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              <LinkIcon size={14} /> Shared Links
            </h3>
            {attachments.length === 0 ? (
              <p className="text-xs text-[var(--muted)] bg-[var(--surface-soft)] p-3 rounded-lg border border-[var(--border)] text-center">No links shared yet.</p>
            ) : (
              <div className="space-y-1.5">
                {attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-soft)] transition-colors border border-transparent hover:border-[var(--border)] group">
                    <div className="h-8 w-8 rounded bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-blue-400 group-hover:text-[var(--accent)] transition-colors">
                      {att.type === 'pdf' ? <FileText size={12}/> : att.type === 'image' ? <ImageIcon size={12}/> : <LinkIcon size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-white group-hover:underline">{att.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </aside>

    </div>
  );
}
