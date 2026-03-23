"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import type { ChatMessage, Profile } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { LockedScreen, LoadingCard } from "@/components/ui/Feedback";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function NetworkHubPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = "global";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!profile || profile.status !== "active") {
      return;
    }

    let mounted = true;
    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      await supabase.from("room_members").insert({ room_id: roomId, user_id: profile.id });
      const { data, error: messageError } = await supabase
        .from<ChatMessage>("messages")
        .select("id, room_id, sender_id, content, is_anon, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (messageError) {
        setError(messageError.message);
        setLoading(false);
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const senderIds = Array.from(new Set(rows.map((row) => row.sender_id)));
      const { data: senders } = senderIds.length
        ? await supabase.from<Profile>("profiles").select("id, name, roll_no, programme, batch_year").in("id", senderIds)
        : { data: [] };
      const senderMap = new Map((Array.isArray(senders) ? senders : []).map((sender) => [sender.id, sender]));
      const enriched = rows.map((row) => ({ ...row, sender: senderMap.get(row.sender_id) }));
      if (mounted) {
        setMessages(enriched);
        setLoading(false);
      }
    };

    void loadMessages();

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, async (payload) => {
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
  }, [profile]);

  const onlineCount = useMemo(() => new Set(messages.map((message) => message.sender_id)).size, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.id || !inputText.trim()) return;

    setSending(true);
    setError(null);
    const content = inputText.trim();

    const { error: insertError } = await supabase.from<ChatMessage>("messages").insert({
      room_id: roomId,
      sender_id: profile.id,
      content,
      is_anon: isAnon,
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
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50 shadow-xl shadow-slate-950/10 md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-none items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <Link href="/" className="-ml-2 rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-800">
          <ArrowLeft size={22} />
        </Link>

        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold text-slate-800">Network Hub</h1>
          <p className="text-[11px] font-medium text-slate-400">Realtime global discussion room</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-[10px] font-bold whitespace-nowrap text-green-700">{onlineCount || 1} online</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 p-1">
            <span className={`px-1.5 text-[10px] font-bold transition-colors ${isAnon ? "text-indigo-600" : "text-slate-400"}`}>Anon</span>
            <button onClick={() => setIsAnon((value) => !value)} className={`relative h-5 w-9 rounded-full transition-all duration-300 ${isAnon ? "bg-indigo-500 shadow-sm shadow-indigo-500/30" : "bg-slate-300"}`}>
              <div className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isAnon ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 pb-32">
        {loading ? <LoadingCard title="Loading messages..." /> : null}
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p> : null}
        {!loading && messages.map((message) => {
          const isMe = message.sender_id === profile.id;
          const alias = message.is_anon ? "Anonymous" : message.sender?.name || message.sender?.roll_no || "Unknown";
          return (
            <div key={message.id} className={`flex flex-col ${isMe ? "items-end animate-msg-right" : "items-start animate-msg-left"}`}>
              <div className={`mb-1 flex items-baseline gap-2 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <span className="text-xs font-bold text-slate-700">{alias}</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{message.sender?.programme || profile.programme} {message.sender?.batch_year?.toString().slice(-2) || ""}</span>
              </div>

              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isMe ? "rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/20" : "rounded-tl-sm border border-slate-200/80 bg-white text-slate-800 shadow-sm"}`}>
                <p className="text-[15px] leading-snug">{message.content}</p>
              </div>

              <span className="mt-1 px-1 text-[10px] font-medium text-slate-400">{formatDateTime(message.created_at)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-slate-200/80 bg-white/90 p-3 backdrop-blur-xl md:left-64 md:right-0">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-5xl items-end gap-2">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage(e);
              }
            }} placeholder="Message the hub..." className="min-h-[40px] w-full resize-none border-none bg-transparent py-2.5 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0" rows={1} />
          </div>
          <button type="submit" disabled={!inputText.trim() || sending} className="mb-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100">
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
