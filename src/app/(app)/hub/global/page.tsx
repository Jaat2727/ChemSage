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
    <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg">
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <Link href="/hub" className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-white">
          <ArrowLeft size={18} />
        </Link>

        <div className="text-center">
          <h1 className="text-base font-bold text-white">Community Chat</h1>
          <p className="text-xs font-medium text-[var(--muted)]">{onlineCount || 1} active in feed</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          <Wifi size={14} className={syncing ? "text-amber-400" : "text-emerald-400"} />
          {syncing ? "Syncing" : "Live"}
        </div>
      </header>

      <section className="flex-1 space-y-5 overflow-y-auto px-4 py-6">
        {loading ? <LoadingCard title="Loading messages..." /> : null}
        {error ? <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-300">{error}</p> : null}

        {!loading &&
          messages.map((message) => {
            const isMe = message.sender_id === profile.id;
            const alias = message.sender?.name || message.sender?.roll_no || "Unknown";
            return (
              <article key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="mb-1.5 px-2 text-xs font-medium text-[var(--muted)]">
                  <Link href={`/profile/${message.sender_id}`} className="hover:text-white hover:underline transition-colors">
                    {alias}
                  </Link>
                </div>
                <div className={`max-w-[88%] px-4 py-2.5 text-sm ${isMe ? "rounded-2xl rounded-tr-sm bg-[var(--accent)] text-black" : "rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--surface-soft)] text-white"}`}>
                  <MessageDisplay content={message.content} />
                </div>
                <div className="mt-1.5 flex items-center gap-2 px-2 text-[11px] font-medium text-[var(--muted)]">
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

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
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
