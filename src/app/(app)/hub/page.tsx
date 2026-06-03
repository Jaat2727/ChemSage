"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, User as UserIcon, MessageSquare } from "lucide-react";
import { LoadingCard } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

const supabase = createClientComponentClient();

export default function HubDirectoryPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").neq("id", profile.id).order("name", { ascending: true });
      setUsers(Array.isArray(data) ? (data as Profile[]) : []);
      setLoading(false);
    };
    void load();
  }, [profile]);

  if (!profile || loading) return <LoadingCard />;
  
  const q = searchQuery.toLowerCase();
  const filteredUsers = users.filter((u) => [u.name, u.roll_no, u.programme].some((value) => value?.toLowerCase().includes(q)));

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)]">
      
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-[var(--border)] px-6 bg-[var(--surface-soft)]">
        <h1 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare size={18} className="text-[var(--accent)]" />
          Select a conversation
        </h1>
      </header>

      {/* Main Directory Area */}
      <div className="flex-1 overflow-y-auto p-8">
        
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[300px] border-b border-[var(--border)] mb-10 pb-10 text-center">
          <div className="h-20 w-20 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-6">
            <MessageSquare size={36} className="text-[var(--accent)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Direct Chats</h2>
          <p className="text-[var(--muted)] max-w-md text-sm leading-relaxed">
            Select a conversation from the sidebar to continue chatting, or find a classmate below to start a new direct message.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Suggested Classmates</h3>
            
            <div className="relative w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search directory..."
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-9 pr-3 text-sm font-medium text-white placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((u) => (
              <Link 
                key={u.id} 
                href={`/hub/${u.id}`} 
                className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-soft)] active:scale-[0.98]"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--muted)] border border-[var(--border)] group-hover:text-white transition-colors">
                  <UserIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">{u.name || "Unknown"}</p>
                  <p className="truncate text-xs font-medium text-[var(--muted)]">
                    {u.programme} {u.batch_year?.toString().slice(-2)} · {u.roll_no}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-[var(--muted)]">No classmates found matching "{searchQuery}".</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
