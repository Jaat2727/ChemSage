import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Activity, FileText, Users, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export default function ActivityTab({ profile }: { profile: Profile }) {
  const supabase = createClientComponentClient();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setFeed(data);
      setLoading(false);
    };
    void fetchFeed();
  }, [profile.id]);

  if (loading) return <div className="text-sm text-[var(--muted)]">Loading activity timeline...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Activity Timeline</h2>
        <p className="text-sm text-[var(--muted)]">Chronological history of contributions and community interactions.</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        {feed.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-soft)] mb-4">
              <Activity size={32} className="text-[var(--muted)] opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Activity Yet</h3>
            <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-6">
              This user hasn't contributed any resources, joined study circles, or updated their profile recently.
            </p>
            <Link href="/vault" className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#bce600] transition-colors">
              Explore the Vault
            </Link>
          </div>
        ) : (
          <div className="relative border-l-2 border-[var(--surface-soft)] ml-4 space-y-8 pb-4">
            {feed.map((item, idx) => (
              <div key={item.id} className="relative pl-6">
                {/* Timeline Dot */}
                <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] ring-4 ring-[var(--surface)]" />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    {item.target_type === 'resource' && item.action_type === 'upload_resource' && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <FileText size={14} className="text-emerald-400" />
                          <span>Uploaded a resource: <span className="font-bold text-white">{item.details?.title}</span></span>
                        </div>
                        <p className="text-[10px] text-[var(--muted)] mt-1 uppercase font-bold tracking-wider">{item.details?.category}</p>
                      </>
                    )}
                    {item.target_type === 'resource' && item.action_type === 'edit_resource' && (
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <FileText size={14} className="text-blue-400" />
                        <span>Updated resource metadata: <span className="font-bold text-white">{item.details?.title}</span></span>
                      </div>
                    )}
                    {item.target_type === 'paper' && (
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <FileText size={14} className="text-amber-400" />
                        <span>{item.action_type === 'upload_paper' ? 'Uploaded' : 'Updated'} exam paper: <span className="font-bold text-white">{item.details?.subject}</span></span>
                      </div>
                    )}
                    {item.target_type === 'room' && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <Users size={14} className="text-purple-400" />
                          <span>{item.action_type === 'create_room' ? 'Created study group' : 'Joined study group'}: <span className="font-bold text-white">{item.details?.name || item.details?.room_id}</span></span>
                        </div>
                        {item.details?.location && <p className="text-[10px] text-[var(--muted)] mt-1 uppercase font-bold tracking-wider">{item.details?.location}</p>}
                      </>
                    )}
                    {item.target_type === 'profile' && (
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <User size={14} className="text-blue-400" />
                        <span>{item.details?.message || 'Updated profile information'}</span>
                      </div>
                    )}
                    {item.action_type === 'earn_star' && (
                      <div className="flex items-center gap-2 text-sm text-gray-200">
                        <span className="text-amber-400 font-bold">★</span>
                        <span>{item.details?.message}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {new Date(item.created_at).toLocaleDateString()} • {formatTime(item.created_at)}
                    </span>
                    {(item.target_type === 'resource' || item.target_type === 'room') && (
                      <Link 
                        href={item.target_type === 'resource' ? "/vault" : `/groups/${item.target_id}`} 
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--accent)] hover:text-white transition-colors"
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
