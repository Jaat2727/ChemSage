"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Trash2, Wifi } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import { MessageDisplay } from "@/components/ui/MessageDisplay";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();
const roomId = "global";

export default function GlobalHubPage() {
  const { profile } = useAuth();
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
    if (!profile || profile.status !== "active") return;

    let mounted = true;

    const hydrateWithSenders = async (rows: ChatMessage[]) => {
      const senderIds = Array.from(new Set(rows.map((row) => row.sender_id)));
      const { data: senders } = senderIds.length
        ? await supabase.from("profiles").select("id, name, roll_no, programme, batch_year").in("id", senderIds)
        : { data: [] };
      const senderMap = new Map((Array.isArray(senders) ? senders : []).map((sender) => [sender.id, sender]));
      return rows.map((row) => ({ ...row, sender: senderMap.get(row.sender_id) }));
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      await supabase.from("room_members").insert({ room_id: roomId, user_id: profile.id });
      const { data, error: loadError } = await supabase
        .from("messages")
        .select("id, room_id, sender_id, content, is_anon, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(120);

      if (loadError) {
        if (mounted) {
          setError(loadError.message);
          setLoading(false);
        }
        return;
      }

      const enriched = await hydrateWithSenders(Array.isArray(data) ? data : []);
      if (mounted) {
        setMessages(enriched);
        setLoading(false);
      }
    };

    void load();

    // Clean up any stale channel (React Strict Mode / HMR)
    const channelName = `msg-${roomId}`;
    const stale = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (stale) supabase.removeChannel(stale);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
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
        { event: "DELETE", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
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
  }, [profile]);

  const onlineCount = useMemo(() => new Set(messages.map((message) => message.sender_id)).size, [messages]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    if (deleteError) setError(deleteError.message);
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.id || !inputText.trim()) return;

    setSending(true);
    setError(null);
    const content = inputText.trim();

    const { error: insertError } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_id: profile.id,
      content,
      is_anon: false,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setInputText("");
    }
    setSending(false);
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") {
    return <LockedScreen title="Network Hub locked" description="Only active users can access live chats. Please wait for approval before joining the conversation." />;
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] w-full max-w-5xl flex-col overflow-hidden  border border-[var(--border)] bg-[var(--background)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
        <Link href="/hub" className=" p-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-white">
          <ArrowLeft size={18} />
        </Link>

        <div className="text-center">
          <h1 className="text-sm font-semibold text-white">Community Chat</h1>
          <p className="text-[11px] text-[var(--muted)]">{onlineCount || 1} active in feed</p>
        </div>

        <div className="flex items-center gap-1  border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)]">
          <Wifi size={12} className={syncing ? "text-amber-400" : "text-emerald-400"} />
          {syncing ? "syncing" : "live"}
        </div>
      </header>

      <section className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {loading ? <LoadingCard title="Loading messages..." /> : null}
        {error ? <p className=" border border-red-800 bg-red-950/50 font-mono px-3 py-2 text-sm text-red-300">{error}</p> : null}

        {!loading &&
          messages.map((message) => {
            const isMe = message.sender_id === profile.id;
            const alias = message.sender?.name || message.sender?.roll_no || "Unknown";
            return (
              <article key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="mb-1 px-1 text-[11px] text-[var(--muted)]">{alias}</div>
                <div className={`max-w-[88%]  px-3 py-2 text-sm ${isMe ? "bg-[var(--accent)] text-black font-mono" : "border border-[var(--border)] bg-[var(--surface)] text-white font-mono"}`}>
                  <MessageDisplay content={message.content} />
                </div>
                <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-[var(--muted)]">
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
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--background)] p-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage(e);
              }
            }}
            placeholder="Message the community chat"
            className="min-h-[42px] w-full resize-none  border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            rows={1}
          />
          <button type="submit" disabled={!inputText.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center  bg-[var(--accent)] text-black font-mono disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </footer>
    </div>
  );
}
