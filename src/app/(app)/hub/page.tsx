"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, User as UserIcon, MessageSquare } from "lucide-react";
import { LoadingCard } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
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
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-[var(--border-default)] px-6 bg-[var(--bg-subtle)]">
        <h1 className="text-h3 text-[var(--fg-default)] flex items-center gap-2">
          <MessageSquare size={17} className="text-[var(--accent)]" />
          Select a conversation
        </h1>
      </header>

      {/* Main Directory Area */}
      <div className="flex-1 overflow-y-auto p-6">
        
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[250px] border-b border-[var(--border-default)] mb-8 pb-8 text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-center mb-5">
            <MessageSquare size={30} className="text-[var(--accent)]" />
          </div>
          <h2 className="text-h1 mb-2">Direct Chats</h2>
          <p className="text-body max-w-md leading-relaxed">
            Select a conversation from the sidebar to continue chatting, or find a classmate below to start a new direct message.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-overline text-[var(--fg-muted)]">Suggested Classmates</h3>
            
            <div className="relative w-56">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)]" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search directory..."
                className="pl-9 py-1.5"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((u) => (
              <Link 
                key={u.id} 
                href={`/hub/${u.id}`} 
                className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-raised)] p-3 transition-colors hover:border-[var(--border-strong)] active:scale-[0.99]"
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-[var(--fg-faint)] border border-[var(--border-default)] group-hover:text-[var(--fg-default)] transition-colors">
                  <UserIcon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-h3 text-[var(--fg-default)] group-hover:text-[var(--accent)] transition-colors">{u.name || "Unknown"}</p>
                  <p className="truncate text-caption text-[var(--fg-faint)]">
                    {u.programme} {u.batch_year?.toString().slice(-2)} · {u.roll_no}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-body">No classmates found matching &quot;{searchQuery}&quot;.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
