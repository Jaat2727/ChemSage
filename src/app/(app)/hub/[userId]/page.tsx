"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Trash2, User as UserIcon } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getRoomId = () => {
    if (!profile?.id || !otherUserId) return "";
    return [profile.id, otherUserId].sort().join("-");
  };

  const roomId = getRoomId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!profile?.id || !otherUserId || !roomId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);

      // Fetch the other user's profile
      const { data: userProfile } = await supabase.from<Profile>("profiles").select("*").eq("id", otherUserId).single();
      if (userProfile && mounted) setOtherUser(userProfile as Profile);

      // Ensure room and memberships exist
      // Since our custom supabase.ts swallows conflict errors, we can safely attempt inserts
      await supabase.from("rooms").insert({
        id: roomId,
        name: `DM_${roomId}`,
        is_public: false,
        created_by: profile.id,
      });
      await supabase.from("room_members").insert({ room_id: roomId, user_id: profile.id });
      await supabase.from("room_members").insert({ room_id: roomId, user_id: otherUserId });

      // Load messages
      const { data: msgs, error: msgError } = await supabase
        .from<ChatMessage>("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (msgError) {
        setError(msgError.message);
      } else {
        const rows = Array.isArray(msgs) ? msgs : [];
        if (mounted) setMessages(rows);
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
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id, otherUserId, roomId]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!profile?.id) return;
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", profile.id);
    if (!deleteError) {
      setMessages((current) => current.filter((msg) => msg.id !== messageId));
    } else {
      setError(deleteError.message);
    }
  };

  if (loading || !profile) return <LoadingCard />;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50 shadow-xl shadow-slate-950/10 md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-none items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <Link href="/hub" className="-ml-2 rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-800">
          <ArrowLeft size={22} />
        </Link>

        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold text-slate-800">{otherUser?.name || "Loading..."}</h1>
          <p className="text-[11px] font-medium text-slate-400">Direct Message</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600">
            <UserIcon size={16} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 pb-32">
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p> : null}
        {!loading && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-300">
              <UserIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Start the conversation</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-[250px]">Say hi to {otherUser?.name || "your peer"} and start a direct message.</p>
          </div>
        ) : null}
        {!loading && messages.map((message) => {
          const isMe = message.sender_id === profile.id;
          return (
            <div key={message.id} className={`flex flex-col ${isMe ? "items-end animate-msg-right" : "items-start animate-msg-left"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isMe ? "rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/20" : "rounded-tl-sm border border-slate-200/80 bg-white text-slate-800 shadow-sm"}`}>
                <MessageDisplay content={message.content} />
              </div>

              <div className={`mt-1 flex items-center gap-2 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <span className="text-[10px] font-medium text-slate-400">{formatDateTime(message.created_at)}</span>
                {isMe && (
                  <button onClick={() => handleDeleteMessage(message.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete message">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-slate-200/80 bg-white/90 p-3 backdrop-blur-xl md:left-64 md:right-0">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!inputText.trim() || !profile.id || !roomId) return;
          setSending(true);
          const { error: insertError } = await supabase.from<ChatMessage>("messages").insert({
            room_id: roomId,
            sender_id: profile.id,
            content: inputText.trim(),
            is_anon: false
          });
          if (insertError) setError(insertError.message);
          else setInputText("");
          setSending(false);
        }} className="mx-auto flex max-w-5xl items-end gap-2">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }} placeholder="Write a message..." className="min-h-[40px] w-full resize-none border-none bg-transparent py-2.5 text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0" rows={1} />
          </div>
          <button type="submit" disabled={!inputText.trim() || sending} className="mb-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100">
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
