import { useMemo, useState } from "react";
import { FolderTree, Folder, ChevronRight, Plus, Settings2, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import type { Folder as FolderType } from "@/lib/types";

interface FolderProps {
  folders: FolderType[];
  setFolders: React.Dispatch<React.SetStateAction<FolderType[]>>;
  logAdminAction: (action: string, targetType: string, targetId?: string, details?: any) => Promise<void>;
}

export default function FolderSection({ folders, setFolders, logAdminAction }: FolderProps) {
  const supabase = createClientComponentClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Build tree
  const folderTree = useMemo(() => {
    const map = new Map<string, any>();
    const roots: any[] = [];
    
    folders.forEach(f => map.set(f.id, { ...f, children: [] }));
    
    folders.forEach(f => {
      if (f.parent_id && map.has(f.parent_id)) {
        map.get(f.parent_id).children.push(map.get(f.id));
      } else {
        roots.push(map.get(f.id));
      }
    });
    
    return roots;
  }, [folders]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteFolder = async (folder: FolderType) => {
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"? This will also affect any nested resources.`)) return;
    
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    if (!error) {
      setFolders(cur => cur.filter(f => f.id !== folder.id));
      await logAdminAction("delete_folder", "folder", folder.id, { name: folder.name });
    }
  };

  const renderTree = (nodes: any[], depth = 0) => {
    if (nodes.length === 0 && depth === 0) {
      return (
        <div className="p-8">
          <EmptyState title="No folders created" description="Folders organize content in the Vault and Archive." />
        </div>
      );
    }

    return nodes.map((node) => {
      const isExpanded = expanded[node.id];
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={node.id} className="select-none">
          <div 
            className="flex items-center justify-between py-2.5 px-4 hover:bg-[var(--surface-soft)] transition-colors border-b border-[var(--border)]/50 group"
            style={{ paddingLeft: `${Math.max(1, depth * 1.5 + 1)}rem` }}
          >
            <div 
              className="flex items-center gap-2 cursor-pointer flex-1"
              onClick={() => hasChildren && toggleExpand(node.id)}
            >
              <div className="w-5 flex justify-center">
                {hasChildren ? (
                  <ChevronRight size={14} className={`text-[var(--muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                )}
              </div>
              <Folder size={16} className={node.type === "general" ? "text-[var(--accent)]" : "text-blue-400"} />
              <span className="text-sm font-bold text-white">{node.name}</span>
              <span className="ml-2 rounded-md bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {node.type}
              </span>
            </div>
            
            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-[var(--muted)] hidden sm:block">Created {formatDateTime(node.created_at)}</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-[var(--muted)] hover:text-white rounded-md hover:bg-white/5 transition-colors">
                  <Settings2 size={14} />
                </button>
                <button onClick={() => handleDeleteFolder(node)} className="p-1.5 text-[var(--muted)] hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
          
          {isExpanded && hasChildren && (
            <div className="flex flex-col">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Folder Manager</h2>
          <p className="text-sm text-[var(--muted)]">Organize the academic hierarchy for the platform.</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 active:scale-[0.97]">
          <Plus size={16} /> New Root Folder
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="bg-[var(--surface-soft)] px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <FolderTree size={16} className="text-[var(--muted)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Platform Directory Structure</span>
        </div>
        <div className="flex flex-col">
          {renderTree(folderTree)}
        </div>
      </div>
    </div>
  );
}
