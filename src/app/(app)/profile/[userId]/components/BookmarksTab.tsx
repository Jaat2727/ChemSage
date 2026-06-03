import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { 
  FileText, Database, Users, Bookmark, BookmarkMinus 
} from "lucide-react";
import { EmptyState, LoadingCard } from "@/components/ui/Feedback";
import type { Profile } from "@/lib/types";

export default function BookmarksTab({ profile }: { profile: Profile }) {
  const supabase = createClientComponentClient();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      // Fetch stars and join with related tables
      const { data, error } = await supabase
        .from("stars")
        .select(`
          id, 
          created_at,
          resource_id, paper_id, room_id,
          resources (id, title, category),
          exam_papers (id, subject, exam_type),
          rooms (id, name, description)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookmarks(data);
      }
      setLoading(false);
    };

    void fetchBookmarks();
  }, [profile.id]);

  const handleUnsave = async (starId: string) => {
    const { error } = await supabase.from("stars").delete().eq("id", starId);
    if (!error) {
      setBookmarks(prev => prev.filter(b => b.id !== starId));
    }
  };

  if (loading) return <LoadingCard />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">Saved Content</h2>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {bookmarks.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              title="No saved content" 
              description="Bookmarks help you keep track of useful resources, past papers, and study circles." 
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {bookmarks.map((b) => {
              let title = "Unknown";
              let meta = "Unknown";
              let type = "unknown";
              let Icon = Bookmark;
              let color = "text-gray-400";
              let bg = "bg-gray-500/10";

              if (b.resources) {
                title = b.resources.title;
                meta = b.resources.category;
                type = "Resource";
                Icon = Database;
                color = "text-[var(--accent)]";
                bg = "bg-[var(--accent)]/10";
              } else if (b.exam_papers) {
                title = b.exam_papers.subject;
                meta = b.exam_papers.exam_type;
                type = "Past Paper";
                Icon = FileText;
                color = "text-blue-400";
                bg = "bg-blue-500/10";
              } else if (b.rooms) {
                title = b.rooms.name;
                meta = "Study Circle";
                type = "Group";
                Icon = Users;
                color = "text-purple-400";
                bg = "bg-purple-500/10";
              }

              return (
                <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--surface-soft)]">
                  <div className="flex gap-4 items-center">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] ${bg} ${color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">{title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-medium text-[var(--muted)]">
                        <span className="rounded bg-[var(--background)] px-1.5 py-0.5 border border-[var(--border)] uppercase tracking-wider text-[10px]">
                          {type}
                        </span>
                        <span>•</span>
                        <span>{meta}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleUnsave(b.id)}
                    className="group flex items-center gap-2 rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--muted)] transition-all hover:text-amber-400 hover:border-amber-500/30"
                  >
                    <BookmarkMinus size={14} className="group-hover:fill-amber-400/20" /> Unsave
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
