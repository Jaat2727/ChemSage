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
      const { data } = await supabase
        .from<Profile>("profiles")
        .select("*")
        .neq("id", profile.id)
        .order("name", { ascending: true });
      if (data) setUsers(data as Profile[]);
      setLoading(false);
    };
    void load();
  }, [profile]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") {
    return <LockedScreen title="Network Hub locked" description="Only active users can access the directory." />;
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.roll_no && u.roll_no.toLowerCase().includes(q)) ||
      (u.programme && u.programme.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader
        title="Network Hub"
        description="Search for peers in the BS, MSc, and PhD programmes and start a conversation."
        profile={profile}
        action={
          <Link
            href="/hub/global"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-600 hover:to-indigo-700 active:scale-[0.97]"
          >
            <Globe size={16} />
            Global Hub
          </Link>
        }
      />

      {/* Search Bar */}
      <div className="mb-8 relative max-w-xl mx-auto md:mx-0">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, roll no, or programme..."
          className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/40 py-3.5 pl-11 pr-4 text-white placeholder-slate-400 outline-none transition-all focus:border-blue-500/50 focus:bg-slate-900/60 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      {loading ? (
        <LoadingCard title="Loading directory..." />
      ) : filteredUsers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((u) => (
            <Link
              key={u.id}
              href={`/hub/${u.id}`}
              className="group flex animate-fade-in items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/50 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-blue-950/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 text-blue-400">
                  <UserIcon size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">{u.name || "Unknown User"}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
                    <span className="rounded bg-slate-800/80 px-1.5 py-0.5">{u.programme} {u.batch_year?.toString().slice(-2)}</span>
                    <span className="truncate py-0.5">{u.roll_no}</span>
                  </div>
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-blue-400" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No users found" description="Try adjusting your search criteria." />
      )}
    </div>
  );
}
