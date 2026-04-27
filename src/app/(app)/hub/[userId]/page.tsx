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

      const { data: userProfile } = await supabase.from<Profile>("profiles").select("*").eq("id", otherUserId).single();
      if (mounted) setOtherUser((userProfile as Profile) ?? null);

      await supabase.from("rooms").insert({ id: roomId, name: `DM_${roomId}`, is_public: false, created_by: profile.id });
      await supabase.from("room_members").insert({ room_id: roomId, user_id: profile.id });
      await supabase.from("room_members").insert({ room_id: roomId, user_id: otherUserId });

      const { data: msgs, error: msgError } = await supabase
        .from<ChatMessage>("messages")
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

    const channel = supabase
      .channel(`messages:${roomId}`)
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
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    if (deleteError) setError(deleteError.message);
  };

  if (loading || !profile) return <LoadingCard />;

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-3 py-2.5">
        <Link href="/hub" className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100">
          <ArrowLeft size={18} />
        </Link>

        <div className="text-center">
          <h1 className="text-sm font-semibold text-slate-100">{otherUser?.name || "Direct chat"}</h1>
          <p className="text-[11px] text-slate-500">{otherUser?.roll_no || "one-to-one room"}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-slate-700 p-1.5 text-slate-300"><UserIcon size={12} /></div>
          <Wifi size={13} className={syncing ? "text-amber-400" : "text-emerald-400"} />
        </div>
      </header>

      <section className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {error ? <p className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

        {messages.length === 0 ? (
          <div className="mx-auto mt-16 max-w-xs rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-center">
            <p className="text-sm text-slate-300">Start the conversation with {otherUser?.name || "your peer"}.</p>
          </div>
        ) : null}

        {messages.map((message) => {
          const isMe = message.sender_id === profile.id;
          return (
            <article key={message.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-slate-100 text-slate-900" : "border border-slate-700 bg-slate-900 text-slate-100"}`}>
                <MessageDisplay content={message.content} />
              </div>

              <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-slate-500">
                <span>{formatDateTime(message.created_at)}</span>
                {isMe ? (
                  <button onClick={() => handleDeleteMessage(message.id)} className="text-slate-500 hover:text-rose-300" title="Delete message">
                    <Trash2 size={11} />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        <div ref={messagesEndRef} />
      </section>

      <footer className="border-t border-slate-800 bg-slate-950/95 p-3">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!inputText.trim() || !profile.id || !roomId) return;
            setSending(true);
            setError(null);
            const { error: insertError } = await supabase.from<ChatMessage>("messages").insert({
              room_id: roomId,
              sender_id: profile.id,
              content: inputText.trim(),
              is_anon: false,
            });
            if (insertError) setError(insertError.message);
            else setInputText("");
            setSending(false);
          }}
          className="flex items-end gap-2"
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
            className="min-h-[42px] w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
            rows={1}
          />
          <button type="submit" disabled={!inputText.trim() || sending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-900 disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </footer>
    </div>
  );
}
