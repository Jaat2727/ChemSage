"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Download, FileText, Upload, X, CheckCircle2, AlertCircle, Search, FileArchive, File as FileIcon, Activity, Star, Clock, LayoutGrid, List as ListIcon, User, Filter, SortDesc } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ResourceItem, Profile } from "@/lib/types";
import { formatDateTime, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const categories = ["All", "Notes", "Lab Reports", "Assignments", "References"] as const;
type Category = (typeof categories)[number];
const uploadCategories = ["Notes", "Lab Reports", "Assignments", "References"] as const;
type UploadCategory = (typeof uploadCategories)[number];

const MAX_FILE_SIZE_MB = 50;
const supabase = createClientComponentClient();

type SortOption = "Newest" | "Oldest" | "Most Downloaded" | "Alphabetical";

async function fetchVaultData(search: string, category: Category, tags: string[]) {
  // Fetch all resources and profiles for the client-side mapping
  const [res, profs] = await Promise.all([
    supabase.from("resources").select("*"),
    supabase.from("profiles").select("id, name")
  ]);
  
  let data = Array.isArray(res.data) ? (res.data as ResourceItem[]) : [];
  
  if (category !== "All") {
    data = data.filter(r => r.category === category);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    data = data.filter(r => r.title.toLowerCase().includes(q));
  }
  if (tags.length > 0) {
    data = data.filter(r => tags.every(t => (r.tags || []).includes(t)));
  }

  const profilesMap = new Map((profs.data || []).map(p => [p.id, p.name]));
  
  return { data, profilesMap, error: res.error };
}

async function fetchFavorites(userId: string) {
  const { data, error } = await supabase.from("resource_favorites").select("resource_id").eq("user_id", userId);
  return { favorites: Array.isArray(data) ? data.map(d => d.resource_id as string) : [], error };
}

// ─── Upload Modal ────────────────────────────────────────────────────────────
interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  uploaderId: string;
}

function UploadModal({ onClose, onSuccess, uploaderId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<UploadCategory>("Notes");
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (picked: File) => {
    if (picked.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setError(null);
    setFile(picked);
    setTitle(picked.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  };

  const handleUpload = useCallback(async () => {
    if (!file || !title.trim()) { setError("Please select a file and enter a title."); return; }
    setUploading(true);
    setError(null);
    setProgress(10);

    const path = `${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("study-vault").upload(path, file);
    if (upload.error) { setError(upload.error.message); setUploading(false); setProgress(0); return; }
    setProgress(55);

    const { data: publicUrlData } = supabase.storage.from("study-vault").getPublicUrl(path);
    setProgress(70);

    const tagsArray = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

    const { error: insertError } = await supabase.from("resources").insert({
      title: title.trim(),
      category: category,
      file_url: publicUrlData.publicUrl,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      uploaded_by: uploaderId,
      tags: tagsArray,
      download_count: 0
    });

    if (insertError) { setError(insertError.message); setUploading(false); setProgress(0); return; }
    setProgress(100);
    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1200);
  }, [file, title, category, tagsInput, uploaderId, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Upload size={20} className="text-[var(--accent)]" /> Upload Resource</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`mb-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition-all ${
            file ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]"
          }`}
        >
          {file ? (
            <>
              <FileText size={32} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-white truncate max-w-full px-4">{file.name}</p>
              <p className="text-xs text-[var(--muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-[var(--muted)]" />
              <p className="text-sm font-medium text-[var(--muted)]">Drop file here or <span className="text-[var(--accent)]">browse</span></p>
              <p className="text-xs text-[var(--muted)]">Max {MAX_FILE_SIZE_MB} MB</p>
            </>
          )}
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Thermodynamics Notes Unit 2"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Category</label>
          <div className="flex flex-wrap gap-2">
            {uploadCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                  category === cat ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-soft)] text-[var(--muted)] hover:bg-[var(--surface)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. organic, chemistry, exam2"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        {uploading && (
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-[var(--muted)]">
              <span>{success ? "Upload complete!" : "Uploading…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-2.5 text-sm font-medium text-emerald-400">
            <CheckCircle2 size={16} /> Resource uploaded successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="mt-2 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)]">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex-1 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-[#bce600] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StudyVaultPage() {
  const { profile } = useAuth();
  
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, string>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [tagsInputFilter, setTagsInputFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    
    const [vaultData, favData] = await Promise.all([
      fetchVaultData(debouncedSearch, category, selectedTags),
      fetchFavorites(profile.id)
    ]);
    
    if (vaultData.error) setError(vaultData.error.message);
    setResources(vaultData.data);
    setProfilesMap(vaultData.profilesMap);
    setFavorites(new Set(favData.favorites));
    
    setLoading(false);
  }, [debouncedSearch, category, selectedTags, profile]);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    void load();
  }, [profile, load]);

  const toggleFavorite = async (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!profile) return;
    
    const isFav = favorites.has(resourceId);
    
    // Optimistic UI Update
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (isFav) newFavs.delete(resourceId);
      else newFavs.add(resourceId);
      return newFavs;
    });

    if (isFav) {
      await supabase.from("resource_favorites").delete().eq("user_id", profile.id).eq("resource_id", resourceId);
    } else {
      await supabase.from("resource_favorites").insert({ user_id: profile.id, resource_id: resourceId });
    }
  };

  const handleDownload = async (id: string, url: string, currentCount: number) => {
    window.open(url, "_blank");
    const newCount = currentCount + 1;
    setResources(current => current.map(r => r.id === id ? { ...r, download_count: newCount } : r));
    await supabase.from("resources").update({ download_count: newCount }).eq("id", id);
  };

  const handleAddTagFilter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagsInputFilter.trim()) {
      e.preventDefault();
      const newTag = tagsInputFilter.trim().toLowerCase();
      if (!selectedTags.includes(newTag)) setSelectedTags((prev) => [...prev, newTag]);
      setTagsInputFilter("");
    }
  };
  const removeTagFilter = (tagToRemove: string) => setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));

  // Client-Side Sorting and Favorites Filtering
  const processedResources = useMemo(() => {
    let result = [...resources];
    
    if (showFavoritesOnly) {
      result = result.filter(r => favorites.has(r.id));
    }
    
    result.sort((a, b) => {
      switch (sortBy) {
        case "Newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "Oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "Most Downloaded": return (b.download_count || 0) - (a.download_count || 0);
        case "Alphabetical": return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
    
    return result;
  }, [resources, sortBy, showFavoritesOnly, favorites]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Study Vault locked" description="Only active users can browse the shared study vault." />;

  return (
    <div className="pb-20 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileText className="text-[var(--accent)]" size={32} /> Resource Vault
          </h1>
          <p className="mt-2 text-[var(--muted)]">Explore the community-driven knowledge base. Download, star, and share.</p>
        </div>
        {profile.status === "active" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black transition-all hover:bg-[#bce600] active:scale-[0.97] shadow-[0_0_20px_rgba(188,230,0,0.25)]"
          >
            <Upload size={18} /> Upload Resource
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        
        {/* Left Sidebar Filters */}
        <aside className="flex flex-col gap-6">
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              <Filter size={16} /> Filters
            </h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-[var(--accent)]"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-[var(--muted)] mb-1">Categories</label>
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                      category === item ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"
                    )}
                  >
                    {item}
                    {category === item && <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />}
                  </button>
                ))}
              </div>
              
              <div className="pt-2">
                <label className="text-xs font-bold uppercase text-[var(--muted)] mb-2 block">Tags</label>
                <input
                  value={tagsInputFilter}
                  onChange={(e) => setTagsInputFilter(e.target.value)}
                  onKeyDown={handleAddTagFilter}
                  placeholder="Type tag & Enter..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none mb-2 focus:border-[var(--accent)]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded bg-[var(--surface-soft)] px-2 py-0.5 text-xs font-semibold text-white">
                      {tag}
                      <button onClick={() => removeTagFilter(tag)} className="text-[var(--muted)] hover:text-red-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
             <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-bold transition-all",
                showFavoritesOnly ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-white"
              )}
            >
              <div className="flex items-center gap-2"><Star size={16} className={showFavoritesOnly ? "fill-amber-400" : ""} /> Starred</div>
              {showFavoritesOnly && <div className="h-2 w-2 rounded-full bg-amber-400" />}
            </button>
          </div>
          
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-col min-w-0">
          
          {/* Top Control Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 px-4">
            <div className="text-sm font-bold text-[var(--muted)]">
              {processedResources.length} {processedResources.length === 1 ? "Result" : "Results"}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border-r border-[var(--border)] pr-3">
                <SortDesc size={16} className="text-[var(--muted)]" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                  <option className="bg-[var(--surface)]">Newest</option>
                  <option className="bg-[var(--surface)]">Oldest</option>
                  <option className="bg-[var(--surface)]">Most Downloaded</option>
                  <option className="bg-[var(--surface)]">Alphabetical</option>
                </select>
              </div>
              
              <div className="flex items-center gap-1 bg-[var(--background)] rounded-lg p-0.5 border border-[var(--border)]">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-[var(--surface-soft)] text-white shadow-sm" : "text-[var(--muted)] hover:text-white")}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-[var(--surface-soft)] text-white shadow-sm" : "text-[var(--muted)] hover:text-white")}
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          <InlineAlert tone="error" message={error} />
          {loading ? <LoadingCard title="Loading resources…" /> : null}

          {/* Results Area */}
          {!loading && processedResources.length === 0 ? (
            <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <FileIcon size={48} className="mx-auto text-[var(--muted)] opacity-50 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No Resources Found</h2>
              <p className="text-[var(--muted)]">Try adjusting your filters, tags, or search query.</p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View (Dense Cards) */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {processedResources.map((resource) => (
                <article key={resource.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all hover:border-[var(--accent)]/50 hover:shadow-lg">
                  {/* Thumbnail */}
                  <div className="relative h-32 w-full shrink-0 overflow-hidden border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-center">
                    {resource.file_type?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resource.file_url} alt={resource.title} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : resource.file_type?.includes("pdf") ? (
                      <FileText size={40} className="text-red-500/50 group-hover:text-red-500 transition-colors" />
                    ) : resource.file_type?.includes("zip") || resource.file_type?.includes("archive") ? (
                      <FileArchive size={40} className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                    ) : (
                      <FileIcon size={40} className="text-[var(--muted)] group-hover:text-blue-400 transition-colors" />
                    )}
                    
                    {/* Favorite Button overlay */}
                    <button 
                      onClick={(e) => toggleFavorite(resource.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/50 hover:text-white hover:bg-black/60 transition-all z-10"
                    >
                      <Star size={14} className={favorites.has(resource.id) ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                    
                    {/* Category Badge overlay */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white">
                      {resource.category}
                    </div>
                  </div>
                  
                  {/* Metadata */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="truncate text-sm font-bold text-white mb-1 group-hover:text-[var(--accent)] transition-colors" title={resource.title}>{resource.title}</h3>
                    <p className="text-[10px] text-[var(--muted)] flex items-center gap-1.5 mb-3">
                      <User size={10} /> {profilesMap.get(resource.uploaded_by) || "Unknown"}
                    </p>
                    
                    {/* Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-[var(--surface-soft)] px-1.5 py-0.5 rounded text-[9px] text-[var(--muted)]">#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--muted)]">
                        <span className="flex items-center gap-1"><Download size={10} className="text-[var(--accent)]" /> {resource.download_count || 0}</span>
                        <span>{formatBytes(resource.file_size)}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(resource.id, resource.file_url, resource.download_count || 0)}
                        className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:text-[#bce600] transition-colors flex items-center gap-1"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* List View (Notion/GitBook Style) */
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {/* List Header */}
              <div className="grid grid-cols-[auto_1fr_120px_100px_80px_auto] items-center gap-4 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hidden md:grid">
                <div className="w-6 text-center"></div>
                <div>Title & Uploader</div>
                <div>Category</div>
                <div>Size</div>
                <div>Dls</div>
                <div className="w-8"></div>
              </div>
              
              {/* List Rows */}
              <div className="divide-y divide-[var(--border)]">
                {processedResources.map((resource) => (
                  <div key={resource.id} className="group grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_120px_100px_80px_auto] items-center gap-4 px-4 py-3 hover:bg-[var(--surface-soft)] transition-colors">
                    
                    {/* Star (Desktop) */}
                    <div className="hidden md:flex items-center justify-center w-6">
                      <button onClick={(e) => toggleFavorite(resource.id, e)} className="text-[var(--muted)] hover:text-amber-400 transition-colors">
                         <Star size={14} className={favorites.has(resource.id) ? "fill-amber-400 text-amber-400" : ""} />
                      </button>
                    </div>
                    
                    {/* Title & Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors" title={resource.title}>{resource.title}</h3>
                        {/* Star (Mobile) */}
                        <button onClick={(e) => toggleFavorite(resource.id, e)} className="md:hidden text-[var(--muted)]">
                          <Star size={12} className={favorites.has(resource.id) ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                        <span className="flex items-center gap-1"><User size={10} /> {profilesMap.get(resource.uploaded_by) || "Unknown"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(resource.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Category (Desktop) */}
                    <div className="hidden md:block">
                      <span className="inline-block rounded bg-[var(--surface)] border border-[var(--border)] px-2 py-1 text-[10px] font-bold text-[var(--muted)]">
                        {resource.category}
                      </span>
                    </div>
                    
                    {/* Size (Desktop) */}
                    <div className="hidden md:block text-xs font-medium text-[var(--muted)]">
                      {formatBytes(resource.file_size)}
                    </div>
                    
                    {/* Downloads (Desktop) */}
                    <div className="hidden md:flex items-center gap-1 text-xs font-bold text-[var(--muted)]">
                      <Download size={12} className="text-[var(--accent)]" /> {resource.download_count || 0}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDownload(resource.id, resource.file_url, resource.download_count || 0)}
                        className="p-2 rounded-lg bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-black transition-all"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {showModal && profile.status === "active" && (
        <UploadModal
          uploaderId={profile.id}
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
