"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Globe, Search, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
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

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Network Hub locked" description="Only active users can access the directory." />;

  const q = searchQuery.toLowerCase();
  const filteredUsers = users.filter((u) => [u.name, u.roll_no, u.programme].some((value) => value?.toLowerCase().includes(q)));

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader
        title="Direct Chats"
        description="Find classmates quickly and start one-to-one conversations or join the community feed."
        profile={profile}
        action={
          <Link href="/hub/global" className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#bce600]">
            <Globe size={16} /> Global Hub
          </Link>
        }
      />

      <div className="relative mb-6 max-w-xl">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, roll no, or programme"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm font-medium text-white placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>

      {loading ? <LoadingCard title="Loading directory..." /> : null}

      {!loading && filteredUsers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredUsers.map((u) => (
            <Link key={u.id} href={`/hub/${u.id}`} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)] hover:shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-full border border-[var(--border)] bg-[var(--background)] p-2.5 text-[var(--muted)]"><UserIcon size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-white">{u.name || "Unknown"}</p>
                  <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">{u.programme} {u.batch_year?.toString().slice(-2)} · {u.roll_no}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-[var(--muted)] transition-colors group-hover:text-white" />
            </Link>
          ))}
        </div>
      ) : null}

      {!loading && filteredUsers.length === 0 ? <EmptyState title="No users found" description="Try a different search term." /> : null}
    </div>
  );
}
