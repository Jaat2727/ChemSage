"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Trash2, User as UserIcon, Wifi } from "lucide-react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile } from "@/lib/types";
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

      if (mounted) setLoading(false);
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

  if (loading || !profile) return <LoadingCard />;

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <Link href="/hub" className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-white">
          <ArrowLeft size={18} />
        </Link>

        <div className="text-center">
          <h1 className="text-base font-bold text-white">{otherUser?.name || "Direct chat"}</h1>
          <p className="text-xs font-medium text-[var(--muted)]">{otherUser?.roll_no || "one-to-one room"}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)]">
          <UserIcon size={14} />
          <Wifi size={14} className={syncing ? "text-amber-400" : "text-emerald-400"} />
        </div>
      </header>

      <section className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
        {error ? <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">{error}</p> : null}

        {messages.length === 0 ? (
          <div className="mx-auto mt-16 max-w-xs rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-[var(--muted)]">Start the conversation with {otherUser?.name || "your peer"}.</p>
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
            placeholder="Write a message"
            className="min-h-[44px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
            rows={1}
          />
          <button type="submit" disabled={!inputText.trim() || sending} className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-black transition-colors hover:bg-[#bce600] disabled:opacity-50">
            <Send size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
}
