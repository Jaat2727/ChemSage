import { useEffect, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import { 
  FileText, Database, Download, Star, MoreVertical, 
  Trash2, Edit, RefreshCw 
} from "lucide-react";
import { EmptyState, LoadingCard } from "@/components/ui/Feedback";
import type { Profile, ResourceItem, ExamPaper } from "@/lib/types";

interface ContentTabProps {
  profile: Profile;
  type: "resource" | "paper";
  isOwner: boolean;
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ContentTab({ profile, type, isOwner, isAdmin }: ContentTabProps) {
  const supabase = createClientComponentClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const table = type === "resource" ? "resources" : "exam_papers";

  const fetchItems = async (pageIndex: number, overwrite = false) => {
    setLoading(true);
    
    const from = pageIndex * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from(table).select("*").eq("uploaded_by", profile.id).order("created_at", { ascending: false }).range(from, to);
    
    // Only show active items unless admin/owner
    if (!isAdmin && !isOwner) {
      query = query.neq("status", "deleted");
    }

    const { data, error } = await query;

    if (!error && data) {
      setItems(prev => overwrite ? data : [...prev, ...data]);
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
    setLoading(false);
  };

  useEffect(() => {
    setItems([]);
    setPage(0);
    setHasMore(true);
    fetchItems(0, true);
  }, [profile.id, type, isAdmin, isOwner]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, false);
  };

  const handleArchive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "deleted" ? "active" : "deleted";
    if (newStatus === "deleted" && !confirm("Are you sure you want to archive this item? It will be hidden from public view.")) return;

    const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", id);
    if (!error) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    }
    setActiveMenuId(null);
  };

  const canEdit = isOwner || isAdmin;
  const isResource = type === "resource";

  if (loading && items.length === 0) return <LoadingCard />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white">
          {isResource ? "Uploaded Resources" : "Contributed Past Papers"}
        </h2>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-visible">
        {items.length === 0 ? (
          <div className="p-8">
            <EmptyState 
              title={`No ${isResource ? "resources" : "papers"} found`} 
              description="This user hasn't uploaded any content here yet."
              action={isOwner ? <a href={isResource ? "/vault" : "/archive"} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-black hover:bg-[#bce600] transition-colors">Upload {isResource ? "Resource" : "Paper"}</a> : null}
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map((item) => {
              const title = isResource ? item.title : item.subject;
              const meta = isResource ? item.category : `${item.exam_type} • ${item.semester} ${item.year}`;
              const isDeleted = item.status === "deleted";

              return (
                <div key={item.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--surface-soft)] ${isDeleted ? "opacity-70" : ""}`}>
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--background)] border border-[var(--border)]">
                      {isResource ? <Database size={18} className="text-[var(--accent)]" /> : <FileText size={18} className="text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-base font-bold ${isDeleted ? "text-[var(--muted)] line-through" : "text-white"}`}>{title}</p>
                        {isDeleted && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">Archived</span>}
                      </div>
                      
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                        <span className="font-medium text-white/70">{meta}</span>
                        <span>•</span>
                        <span>v{item.version || "1.0"}</span>
                        <span>•</span>
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                      
                      {/* Stats */}
                      <div className="mt-2 flex items-center gap-4 text-xs font-medium text-[var(--muted)]">
                        <div className="flex items-center gap-1.5"><Download size={12} /> {item.download_count || 0}</div>
                        <div className="flex items-center gap-1.5"><Star size={12} /> -</div>
                      </div>
                    </div>
                  </div>
                  
                  {canEdit && (
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="p-2 text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-md transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-10 z-10 w-40 rounded-lg border border-[var(--border)] bg-[#0A0A0A] p-1 shadow-xl">
                          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-white hover:bg-white/5">
                            <Edit size={14} /> Edit Metadata
                          </button>
                          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-white hover:bg-white/5">
                            <RefreshCw size={14} /> Replace File
                          </button>
                          <button 
                            onClick={() => handleArchive(item.id, item.status)}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left ${
                              isDeleted ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"
                            }`}
                          >
                            {isDeleted ? <RefreshCw size={14} /> : <Trash2 size={14} />} 
                            {isDeleted ? "Restore" : "Archive"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && (
        <button 
          onClick={loadMore}
          disabled={loading}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--surface-soft)] disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
