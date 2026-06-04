import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Activity, FileText, Users, ArrowRight } from "lucide-react";
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
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            <Activity size={24} className="mx-auto mb-3 opacity-20" />
            No recent activity found for this user.
          </div>
        ) : (
          <div className="relative border-l-2 border-[var(--surface-soft)] ml-4 space-y-8 pb-4">
            {feed.map((item, idx) => (
              <div key={item.id} className="relative pl-6">
                {/* Timeline Dot */}
                <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] ring-4 ring-[var(--surface)]" />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    {item.target_type === 'resource' && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <FileText size={14} className="text-emerald-400" />
                          <span>Uploaded a resource: <span className="font-bold text-white">{item.details?.title}</span></span>
                        </div>
                        <p className="text-[10px] text-[var(--muted)] mt-1 uppercase font-bold tracking-wider">{item.details?.category}</p>
                      </>
                    )}
                    {item.target_type === 'room' && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <Users size={14} className="text-purple-400" />
                          <span>Created a study group: <span className="font-bold text-white">{item.details?.name}</span></span>
                        </div>
                        <p className="text-[10px] text-[var(--muted)] mt-1 uppercase font-bold tracking-wider">{item.details?.location}</p>
                      </>
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
