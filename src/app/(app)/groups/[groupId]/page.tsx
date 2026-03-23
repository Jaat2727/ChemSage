"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { EmptyState, LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import type { ChatMessage, Profile, Room, RoomMember } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
  const { profile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!profile || profile.status !== "active" || !groupId) {
      return;
    }
    let mounted = true;

    const load = async () => {
      const roomResponse = await supabase.from<Room>("rooms").select("*").eq("id", groupId).single();
      const membersResponse = await supabase.from<RoomMember>("room_members").select("room_id, user_id").eq("room_id", groupId);
      const messagesResponse = await supabase.from<ChatMessage>("messages").select("*").eq("room_id", groupId).order("created_at", { ascending: true }).limit(50);
      const memberIds = (Array.isArray(membersResponse.data) ? membersResponse.data : []).map((item) => item.user_id);
      const profilesResponse = memberIds.length ? await supabase.from<Profile>("profiles").select("id, name, roll_no, programme, batch_year, status, role").in("id", memberIds) : { data: [] };
      const memberMap = new Map((Array.isArray(profilesResponse.data) ? profilesResponse.data : []).map((member) => [member.id, member]));
      if (!mounted) return;
      setRoom((roomResponse.data as Room) || null);
      setMembers(Array.isArray(profilesResponse.data) ? profilesResponse.data as Profile[] : []);
      const messageRows = Array.isArray(messagesResponse.data) ? messagesResponse.data : [];
      setMessages(messageRows.map((message) => ({ ...message, sender: memberMap.get(message.sender_id) })));
      setLoading(false);
    };
    void load();

    const channel = supabase
      .channel(`group:${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${groupId}` }, (payload) => {
        const row = payload.new as unknown as ChatMessage;
        setMessages((current) => [...current, { ...row, sender: members.find((member) => member.id === row.sender_id) }]);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, members, profile]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Group locked" description="Only active users can access group conversations." />;
  if (loading) return <LoadingCard />;
  if (!room) return <EmptyState title="Group not found" description="This room does not exist or you no longer have access to it." />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:grid lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <Link href="/groups" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"><ArrowLeft size={16} /> Back to groups</Link>
        <h1 className="text-3xl font-bold text-white">{room.name}</h1>
        <p className="mt-3 text-sm text-slate-400">{room.description || "No description yet."}</p>
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Members</h2>
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-sm text-slate-400">{member.roll_no} • {member.programme} {member.batch_year}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="relative flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-800">Group chat</h2>
          <p className="text-sm text-slate-500">Realtime room feed for {room.name}.</p>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-28">
          {messages.map((message) => (
            <div key={message.id} className={`flex flex-col ${message.sender_id === profile.id ? "items-end" : "items-start"}`}>
              <div className={`mb-1 flex items-center gap-2 ${message.sender_id === profile.id ? "flex-row-reverse" : ""}`}>
                <span className="text-xs font-bold text-slate-800">{message.sender?.name || "Unknown"}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{message.sender?.programme}</span>
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender_id === profile.id ? "bg-pink-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                <p>{message.content}</p>
              </div>
              <span className="mt-1 text-[10px] font-medium text-slate-400">{formatDateTime(message.created_at)}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="absolute bottom-0 left-0 right-0 flex gap-2 border-t border-slate-200 bg-white p-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!profile || !input.trim()) return;
          await supabase.from<ChatMessage>("messages").insert({ room_id: groupId, sender_id: profile.id, content: input.trim(), is_anon: false });
          setInput("");
        }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message this group..." className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-pink-500" />
          <button type="submit" className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-600 text-white"><Send size={18} /></button>
        </form>
      </section>
    </div>
  );
}
