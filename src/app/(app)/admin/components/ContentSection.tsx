import { useMemo, useState } from "react";
import { Search, FolderOpen, FileText, Trash2, RotateCcw, AlertTriangle, FileBox, Star, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import type { ResourceItem, ExamPaper } from "@/lib/types";

interface ContentProps {
  resources: ResourceItem[];
  setResources: React.Dispatch<React.SetStateAction<ResourceItem[]>>;
  papers: ExamPaper[];
  setPapers: React.Dispatch<React.SetStateAction<ExamPaper[]>>;
  logAdminAction: (action: string, targetType: string, targetId?: string, details?: any) => Promise<void>;
}

type ContentItem = 
  | (ResourceItem & { itemType: "resource" }) 
  | (ExamPaper & { itemType: "paper", title: string }); // Map subject to title for unified view

export default function ContentSection({ resources, setResources, papers, setPapers, logAdminAction }: ContentProps) {
  const supabase = createClientComponentClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"All" | "resource" | "paper">("All");
  const [filterStatus, setFilterStatus] = useState<"All" | "active" | "deleted">("All");

  const unifiedContent = useMemo<ContentItem[]>(() => {
    const r: ContentItem[] = resources.map(res => ({ ...res, itemType: "resource" }));
    const p: ContentItem[] = papers.map(pap => ({ ...pap, itemType: "paper", title: pap.subject }));
    return [...r, ...p].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [resources, papers]);

  const filteredContent = useMemo(() => {
    return unifiedContent.filter(item => {
      const matchType = filterType === "All" || item.itemType === filterType;
      const itemStatus = item.status || "active";
      const matchStatus = filterStatus === "All" || itemStatus === filterStatus;
      const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [unifiedContent, search, filterType, filterStatus]);

  const handleSoftDelete = async (item: ContentItem) => {
    const table = item.itemType === "resource" ? "resources" : "exam_papers";
    const newStatus = item.status === "deleted" ? "active" : "deleted";
    
    const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", item.id);
    if (!error) {
      if (item.itemType === "resource") {
        setResources(cur => cur.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
      } else {
        setPapers(cur => cur.map(p => p.id === item.id ? { ...p, status: newStatus } : p));
      }
      await logAdminAction(newStatus === "deleted" ? "soft_delete" : "restore", item.itemType, item.id, { title: item.title });
    }
  };

  const handleHardDelete = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${item.title}"? This cannot be undone.`)) return;
    
    const table = item.itemType === "resource" ? "resources" : "exam_papers";
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (!error) {
      if (item.itemType === "resource") {
        setResources(cur => cur.filter(r => r.id !== item.id));
      } else {
        setPapers(cur => cur.filter(p => p.id !== item.id));
      }
      await logAdminAction("hard_delete", item.itemType, item.id, { title: item.title });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Content Moderation</h2>
        <p className="text-sm text-[var(--muted)]">Manage resources, past papers, and soft-deleted files.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search resources by title or subject..." 
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-11 pr-4 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)]" 
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as any)} 
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)]"
        >
          <option value="All">All Types</option>
          <option value="resource">Resource Vault</option>
          <option value="paper">Exam Archive</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as any)} 
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)]"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="deleted">In Trash</option>
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {filteredContent.length === 0 ? (
          <div className="p-8"><EmptyState title="No content found" description="Try adjusting your filters." /></div>
        ) : (
          <div className="divide-y divide-[var(--border)] max-h-[800px] overflow-y-auto">
            {filteredContent.map((item) => {
              const isDeleted = item.status === "deleted";
              return (
                <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 transition-colors hover:bg-[var(--surface-soft)] ${isDeleted ? "opacity-70" : ""}`}>
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--background)] border border-[var(--border)]">
                      {item.itemType === "resource" ? <FolderOpen size={18} className="text-[var(--accent)]" /> : <FileText size={18} className="text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-base font-bold ${isDeleted ? "text-[var(--muted)] line-through" : "text-white"}`}>{item.title}</p>
                        {isDeleted && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">Trash</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                        <span className="font-medium text-white/70">
                          {item.itemType === "resource" ? item.category : `${item.exam_type} • ${item.semester} ${item.year}`}
                        </span>
                        <span>•</span>
                        <span>v{item.version || "1.0"}</span>
                        <span>•</span>
                        <span>Uploaded {formatDateTime(item.created_at)}</span>
                      </div>
                      
                      {/* Stats */}
                      <div className="mt-2 flex items-center gap-4 text-xs font-medium text-[var(--muted)]">
                        <div className="flex items-center gap-1.5"><Download size={12} /> {item.download_count || 0}</div>
                        <div className="flex items-center gap-1.5"><Star size={12} /> N/A</div>
                        <div className="flex items-center gap-1.5"><FileBox size={12} /> {(item.file_size ? (item.file_size / 1024 / 1024).toFixed(1) : 0)} MB</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {isDeleted ? (
                      <>
                        <button 
                          onClick={() => handleSoftDelete(item)}
                          className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button 
                          onClick={() => handleHardDelete(item)}
                          className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          <AlertTriangle size={14} /> Delete Forever
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleSoftDelete(item)}
                        className="flex items-center gap-2 rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted)] transition-colors hover:text-red-400 hover:border-red-500/30"
                      >
                        <Trash2 size={14} /> Send to Trash
                      </button>
                    )}
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
