import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import { FileText, Database, Users, CalendarDays } from "lucide-react";
import { EmptyState, LoadingCard } from "@/components/ui/Feedback";
import type { Profile } from "@/lib/types";

type ActivityItem = {
  id: string;
  type: "resource" | "paper" | "group";
  title: string;
  timestamp: string;
  meta?: string;
};

export default function ActivityTab({ profile }: { profile: Profile }) {
  const supabase = createClientComponentClient();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const [
        { data: resources },
        { data: papers },
        { data: groups }
      ] = await Promise.all([
        supabase.from("resources").select("id, title, category, created_at").eq("uploaded_by", profile.id),
        supabase.from("exam_papers").select("id, subject, exam_type, created_at").eq("uploaded_by", profile.id),
        supabase.from("room_members")
          .select("joined_at, room_id, rooms(id, name)")
          .eq("user_id", profile.id)
      ]);

      const items: ActivityItem[] = [];

      if (resources) {
        resources.forEach((r) => {
          items.push({
            id: `res-${r.id}`,
            type: "resource",
            title: `Uploaded resource: ${r.title}`,
            meta: r.category,
            timestamp: r.created_at
          });
        });
      }

      if (papers) {
        papers.forEach((p) => {
          items.push({
            id: `pap-${p.id}`,
            type: "paper",
            title: `Contributed past paper: ${p.subject}`,
            meta: p.exam_type,
            timestamp: p.created_at
          });
        });
      }

      if (groups) {
        groups.forEach((g: any) => {
          if (g.rooms) {
            items.push({
              id: `grp-${g.room_id}`,
              type: "group",
              title: `Joined study circle: ${g.rooms.name}`,
              timestamp: g.joined_at || new Date().toISOString()
            });
          }
        });
      }

      // Special item for joining
      if (profile.created_at) {
        items.push({
          id: `join-${profile.id}`,
          type: "group",
          title: "Joined ChemSAGE",
          timestamp: profile.created_at
        });
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(items);
      setLoading(false);
    };

    void fetchActivity();
  }, [profile.id, profile.created_at]);

  if (loading) return <LoadingCard />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Academic Timeline</h2>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" description="This user hasn't made any public contributions." />
        ) : (
          <div className="relative border-l-2 border-[var(--border)] ml-4 space-y-8 pb-4">
            {activities.map((item, index) => {
              let Icon = CalendarDays;
              let color = "text-gray-400";
              let bg = "bg-gray-500/10";
              
              if (item.type === "resource") {
                Icon = Database;
                color = "text-[var(--accent)]";
                bg = "bg-[var(--accent)]/10";
              } else if (item.type === "paper") {
                Icon = FileText;
                color = "text-blue-400";
                bg = "bg-blue-500/10";
              } else if (item.type === "group") {
                Icon = Users;
                color = "text-purple-400";
                bg = "bg-purple-500/10";
              }

              return (
                <div key={`${item.id}-${index}`} className="relative pl-8">
                  {/* Timeline Dot / Icon */}
                  <div className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[var(--surface)] ${bg} ${color}`}>
                    <Icon size={12} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                      {item.meta && (
                        <span className="rounded-md bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 font-medium uppercase tracking-wider">
                          {item.meta}
                        </span>
                      )}
                      <span>{formatDateTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
