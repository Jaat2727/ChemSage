"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Users2 } from "lucide-react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile, Room, RoomMember } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LoadingCard } from "@/components/ui/Feedback";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!profile?.id || !groupId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const { data: roomData } = await supabase.from<Room>("rooms").select("*").eq("id", groupId).single();
      if (roomData && mounted) setRoom(roomData as Room);

      const { data: memberData } = await supabase
        .from<RoomMember & { profiles: Profile }>("room_members")
        .select("user_id, profiles:user_id(id, name, roll_no, programme, batch_year)")
        .eq("room_id", groupId);
      const profiles: Profile[] = (Array.isArray(memberData) ? memberData : []).map((m) => (m as unknown as { profiles: Profile }).profiles).filter(Boolean);
      if (mounted) setMembers(profiles);

      const { data: msgs } = await supabase.from<ChatMessage>("messages").select("*").eq("room_id", groupId).order("created_at", { ascending: true }).limit(50);
      const rows = Array.isArray(msgs) ? msgs : [];
      const senderIds = Array.from(new Set(rows.map((row) => row.sender_id)));
      const { data: senders } = senderIds.length ? await supabase.from<Profile>("profiles").select("id, name, roll_no, programme, batch_year").in("id", senderIds) : { data: [] };
      const senderMap = new Map((Array.isArray(senders) ? senders : []).map((s) => [s.id, s]));
      if (mounted) setMessages(rows.map((row) => ({ ...row, sender: senderMap.get(row.sender_id) })));

      if (mounted) setLoading(false);
    };

    void load();

    const channel = supabase
      .channel(`messages:${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${groupId}` }, async (payload) => {
        const row = payload.new as unknown as ChatMessage;
        const { data: sender } = await supabase.from<Profile>("profiles").select("id, name, roll_no, programme, batch_year").eq("id", row.sender_id).single();
        setMessages((current) => {
          if (current.some((item) => item.id === row.id)) return current;
          return [...current, { ...row, sender: sender as Profile }];
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id, groupId]);

  if (loading || !profile) return <LoadingCard />;

  return (
    <div className="mx-auto max-w-4xl pb-4">
      {/* Header */}
      <div className="mb-6 flex animate-slide-up items-center gap-4">
        <Link href="/groups" className="rounded-xl bg-slate-800/60 p-2.5 text-slate-400 transition-all hover:bg-slate-700/60 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{room?.name || groupId}</h1>
          <p className="text-sm font-medium text-slate-400">{members.length} members</p>
        </div>
      </div>

      {/* Members */}
      <section className="mb-6 animate-slide-up delay-100">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Members</h2>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2 rounded-full border border-slate-800/50 bg-slate-900/40 px-3.5 py-2 backdrop-blur-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/15 to-rose-500/15 text-[11px] font-bold text-pink-300">
                {member.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm font-semibold text-white">{member.name}</span>
              <span className="text-[10px] font-semibold text-slate-500">{member.roll_no}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Chat */}
      <section className="animate-slide-up delay-200 rounded-2xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-slate-800/50 px-5 py-3">
          <Users2 size={16} className="text-pink-400" />
          <h2 className="text-sm font-bold text-white">Group Chat</h2>
        </div>
        <div className="max-h-[400px] overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((message) => {
            const isMe = message.sender_id === profile.id;
            return (
              <div key={message.id} className={`flex flex-col ${isMe ? "items-end animate-msg-right" : "items-start animate-msg-left"}`}>
                <span className="mb-1 px-1 text-xs font-bold text-slate-500">{message.sender?.name || "Unknown"}</span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isMe ? "rounded-tr-sm bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-600/20" : "rounded-tl-sm border border-slate-700/50 bg-slate-800/60 text-white"}`}>
                  <p className="text-sm leading-snug">{message.content}</p>
                </div>
                <span className="mt-1 px-1 text-[10px] text-slate-500">{formatDateTime(message.created_at)}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form className="flex items-center gap-2 border-t border-slate-800/50 p-3" onSubmit={async (event) => {
          event.preventDefault();
          if (!inputText.trim() || !profile.id) return;
          setSending(true);
          await supabase.from<ChatMessage>("messages").insert({ room_id: groupId, sender_id: profile.id, content: inputText.trim(), is_anon: false });
          setInputText("");
          setSending(false);
        }}>
          <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Message this group..." className="flex-1 rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-pink-500/60 focus:ring-2 focus:ring-pink-500/20" />
          <button type="submit" disabled={!inputText.trim() || sending} className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 transition-all hover:from-pink-600 hover:to-rose-700 active:scale-95 disabled:opacity-50">
            <Send size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}
