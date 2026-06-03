"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MapPin, Phone, Send, Trash2, UserPlus, Users2, Wifi } from "lucide-react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile, Room, RoomMember } from "@/lib/types";
import { LoadingCard } from "@/components/ui/Feedback";
import { MessageDisplay } from "@/components/ui/MessageDisplay";
import { formatDateTime } from "@/lib/utils";
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
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!profile?.id || !groupId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: roomData } = await supabase.from("rooms").select("*").eq("id", groupId).single();
      if (mounted) setRoom((roomData as Room) ?? null);

      const { data: memberData } = await supabase
        .from("room_members")
        .select("user_id, profiles:user_id(id, name, roll_no, programme, batch_year)")
        .eq("room_id", groupId);
      const profiles = (Array.isArray(memberData) ? memberData : [])
        .map((m) => (m as unknown as { profiles: Profile }).profiles)
        .filter(Boolean);
      if (mounted) setMembers(profiles);

      const { data: msgs, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", groupId)
        .order("created_at", { ascending: true })
        .limit(120);

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

      if (mounted) setLoading(false);
    };

    void load();

    // Clean up any stale channel (React Strict Mode / HMR)
    const channelName = `grp-${groupId}`;
    const stale = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (stale) supabase.removeChannel(stale);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${groupId}` },
        async (payload) => {
          const row = payload.new as unknown as ChatMessage;
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, name, roll_no, programme, batch_year")
            .eq("id", row.sender_id)
            .single();

          setMessages((current) => {
            if (current.some((item) => item.id === row.id)) return current;
            return [...current, { ...row, sender: (sender as Profile) ?? undefined }];
          });
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
      .subscribe((status) => {
        setSyncing(status !== "SUBSCRIBED");
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id, groupId]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    if (deleteError) setError(deleteError.message);
  };

  if (loading || !profile) return <LoadingCard />;

  return (
    <div className="mx-auto grid h-[calc(100dvh-10rem)] w-full max-w-6xl overflow-hidden border border-[var(--border)] bg-[var(--background)] md:grid-cols-[1fr_320px]">
      <section className="flex min-h-0 flex-col border-b border-[var(--border)] md:border-b-0 md:border-r">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Link href="/groups" className="p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-mono text-sm font-bold text-white">{room?.name || groupId}</h1>
              <p className="font-mono text-[11px] text-[var(--muted)]">{members.length} members</p>
            </div>
          </div>

          <div className="flex items-center gap-1 border border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--muted)]">
            <Wifi size={12} className={syncing ? "text-amber-400" : "text-emerald-400"} />
            {syncing ? "syncing" : "live"}
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {error ? <p className="border border-red-800 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-300">{error}</p> : null}

          {messages.map((message) => {
            const isMe = message.sender_id === profile.id;
            return (
              <article key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <p className="mb-1 px-1 font-mono text-[11px] text-[var(--muted)]">{message.sender?.name || "Unknown"}</p>
                <div className={`max-w-[88%] px-3 py-2 text-sm ${isMe ? "bg-[var(--accent)] text-black font-mono" : "border border-[var(--border)] bg-[var(--surface)] text-white"}`}>
                  <MessageDisplay content={message.content} />
                </div>
                <div className="mt-1 flex items-center gap-2 px-1 font-mono text-[10px] text-[var(--muted)]">
                  <span>{formatDateTime(message.created_at)}</span>
                  {isMe ? (
                    <button onClick={() => handleDeleteMessage(message.id)} className="text-[var(--muted)] hover:text-red-300" title="Delete message">
                      <Trash2 size={11} />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <footer className="border-t border-[var(--border)] bg-[var(--background)] p-3">
          <form
            className="flex items-end gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!inputText.trim() || !profile.id) return;
              setSending(true);
              setError(null);
              const { error: sendError } = await supabase
                .from("messages")
                .insert({ room_id: groupId, sender_id: profile.id, content: inputText.trim(), is_anon: false });
              if (sendError) setError(sendError.message);
              else setInputText("");
              setSending(false);
            }}
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
              placeholder="Write a message"
              className="min-h-[42px] w-full resize-none border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              rows={1}
            />
            <button type="submit" disabled={!inputText.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--accent)] text-black font-mono disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </footer>
      </section>

      <aside className="hidden overflow-y-auto border-l border-[var(--border)] bg-[var(--background)] p-4 md:block">
        <div className="mb-5 border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-2 flex items-center gap-2 font-mono text-sm font-bold text-white"><Users2 size={14} /> group_details</div>
          {room?.location ? <p className="mb-1 flex items-start gap-2 text-xs text-[var(--muted)]"><MapPin size={12} className="mt-0.5" /> {room.location}</p> : null}
          {room?.contact_info ? <p className="mb-1 flex items-start gap-2 text-xs text-[var(--muted)]"><Phone size={12} className="mt-0.5" /> {room.contact_info}</p> : null}
          {room?.invited_people ? <p className="flex items-start gap-2 text-xs text-[var(--muted)]"><UserPlus size={12} className="mt-0.5" /> {room.invited_people}</p> : null}
        </div>

        <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">members ({members.length})</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              <p className="font-mono text-sm text-white">{member.name}</p>
              <p className="font-mono text-[11px] text-[var(--muted)]">{member.roll_no}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
