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
      const { data } = await supabase.from<Profile>("profiles").select("*").neq("id", profile.id).order("name", { ascending: true });
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
          <Link href="/hub/global" className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
            <Globe size={14} /> Global Hub
          </Link>
        }
      />

      <div className="relative mb-6 max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, roll no, or programme"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
        />
      </div>

      {loading ? <LoadingCard title="Loading directory..." /> : null}

      {!loading && filteredUsers.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredUsers.map((u) => (
            <Link key={u.id} href={`/hub/${u.id}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3 hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-slate-700 p-2 text-slate-300"><UserIcon size={16} /></div>
                <div>
                  <p className="text-sm font-medium text-slate-100">{u.name || "Unknown"}</p>
                  <p className="text-xs text-slate-500">{u.programme} {u.batch_year?.toString().slice(-2)} · {u.roll_no}</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-slate-500" />
            </Link>
          ))}
        </div>
      ) : null}

      {!loading && filteredUsers.length === 0 ? <EmptyState title="No users found" description="Try a different search term." /> : null}
    </div>
  );
}
