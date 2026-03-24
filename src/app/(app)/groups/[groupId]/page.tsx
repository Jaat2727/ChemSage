"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin, Phone, Send, Trash2, UserPlus, Users2 } from "lucide-react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile, Room, RoomMember } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LoadingCard } from "@/components/ui/Feedback";
import { MessageDisplay } from "@/components/ui/MessageDisplay";
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    if (!deleteError) {
      setMessages((current) => current.filter((msg) => msg.id !== messageId));
    }
  };

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

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: msgs } = await supabase.from<ChatMessage>("messages")
        .select("*")
        .eq("room_id", groupId)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: true })
        .limit(50);
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
    <div className="mx-auto flex h-[calc(100vh-10rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/40 shadow-2xl backdrop-blur-sm">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Telegram Style Header */}
        <div className="flex items-center justify-between border-b border-slate-800/50 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href="/groups" className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-400">
              <Users2 size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{room?.name || groupId}</h1>
              <p className="text-xs font-medium text-slate-400">{members.length} members</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-950/40 p-4 space-y-4">
          {messages.map((message) => {
            const isMe = message.sender_id === profile.id;
            return (
              <div key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="mb-0.5 px-2 text-[11px] font-bold text-slate-500">{message.sender?.name || "Unknown"}</div>
                <div className={`relative max-w-[85%] rounded-2xl px-3.5 py-2 ${isMe ? "rounded-br-sm bg-pink-600 text-white" : "rounded-bl-sm bg-slate-800 text-white"}`}>
                  <MessageDisplay content={message.content} />
                  <div className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${isMe ? "text-pink-200" : "text-slate-400"}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMe && (
                      <button onClick={() => handleDeleteMessage(message.id)} className="hover:text-white transition-colors" title="Delete message">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="border-t border-slate-800/50 bg-slate-900/90 p-3 backdrop-blur-md">
          <form className="flex items-center gap-2" onSubmit={async (event) => {
            event.preventDefault();
            if (!inputText.trim() || !profile.id) return;
            setSending(true);
            await supabase.from<ChatMessage>("messages").insert({ room_id: groupId, sender_id: profile.id, content: inputText.trim(), is_anon: false });
            setInputText("");
            setSending(false);
          }}>
            <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Write a message..." className="flex-1 rounded-full border border-slate-700/60 bg-slate-800/50 px-5 py-3 text-[15px] text-white outline-none transition-all placeholder:text-slate-400 focus:border-pink-500/50 focus:bg-slate-800" />
            <button type="submit" disabled={!inputText.trim() || sending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white transition-all hover:bg-pink-500 active:scale-95 disabled:opacity-50 disabled:hover:bg-pink-600">
              <Send size={18} className="translate-x-[2px] transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Group Info */}
      <div className="hidden w-80 flex-col overflow-y-auto border-l border-slate-800/50 bg-slate-900/90 md:flex">
        <div className="p-6">
          <div className="mb-6 flex flex-col items-center border-b border-slate-800/50 pb-6 text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-400">
              <Users2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-white">{room?.name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">Public Synergy Group</p>
          </div>
          
          {(room?.location || room?.contact_info || room?.invited_people) && (
            <div className="mb-6 space-y-4 border-b border-slate-800/50 pb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Group Info</h3>
              {room?.location && (
                <div className="flex gap-3 text-sm">
                  <MapPin size={18} className="shrink-0 text-slate-400" />
                  <div className="min-w-0"><div className="truncate font-medium text-white">{room.location}</div><div className="text-[11px] text-slate-500">Location</div></div>
                </div>
              )}
              {room?.contact_info && (
                <div className="flex gap-3 text-sm">
                  <Phone size={18} className="shrink-0 text-slate-400" />
                  <div className="min-w-0"><div className="truncate font-medium text-white">{room.contact_info}</div><div className="text-[11px] text-slate-500">Contact</div></div>
                </div>
              )}
              {room?.invited_people && (
                <div className="flex gap-3 text-sm">
                  <UserPlus size={18} className="shrink-0 text-slate-400" />
                  <div className="min-w-0"><div className="font-medium text-white break-words">{room.invited_people}</div><div className="text-[11px] text-slate-500">Invited Members</div></div>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{members.length} Members</h3>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/15 to-rose-500/15 text-sm font-bold text-pink-300">
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{member.roll_no}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
