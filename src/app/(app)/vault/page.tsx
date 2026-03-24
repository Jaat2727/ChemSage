"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Upload, X, CheckCircle2, AlertCircle, Search, FileArchive, File as FileIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ResourceItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const categories = ["All", "Notes", "Lab Reports", "Assignments", "References"] as const;
type Category = (typeof categories)[number];
const uploadCategories = ["Notes", "Lab Reports", "Assignments", "References"] as const;
type UploadCategory = (typeof uploadCategories)[number];

const MAX_FILE_SIZE_MB = 50;
const supabase = createClientComponentClient();

async function fetchResources() {
  const { data, error } = await supabase
    .from<ResourceItem>("resources")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: Array.isArray(data) ? data : [], error };
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

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

    const { error: insertError } = await supabase.from<ResourceItem>("resources").insert({
      title: title.trim(),
      category: category as ResourceItem["category"],
      file_url: publicUrlData.publicUrl,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      uploaded_by: uploaderId,
    });

    if (insertError) { setError(insertError.message); setUploading(false); setProgress(0); return; }
    setProgress(100);
    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1200);
  }, [file, title, category, uploaderId, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-scale-in rounded-3xl border border-slate-700/60 bg-slate-900 p-7 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upload Resource</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          ref={dragRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`mb-5 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition-all ${
            file ? "border-blue-500/50 bg-blue-500/5" : "border-slate-700 bg-slate-800/40 hover:border-slate-500"
          }`}
        >
          {file ? (
            <>
              <FileText size={32} className="text-blue-400" />
              <p className="text-sm font-semibold text-white">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-slate-500" />
              <p className="text-sm font-medium text-slate-400">Drop file here or <span className="text-blue-400">browse</span></p>
              <p className="text-xs text-slate-600">Max {MAX_FILE_SIZE_MB} MB</p>
            </>
          )}
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Thermodynamics Notes Unit 2"
            className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Category</label>
          <div className="flex flex-wrap gap-2">
            {uploadCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  category === cat ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>{success ? "Upload complete!" : "Uploading…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400">
            <CheckCircle2 size={16} /> Resource uploaded successfully!
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── File type badge label ───────────────────────────────────────────────────
function fileLabel(mime: string) {
  if (!mime) return "File";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word") || mime.includes("docx")) return "DOCX";
  if (mime.includes("spreadsheet") || mime.includes("xlsx")) return "XLSX";
  if (mime.includes("image")) return "Image";
  if (mime.includes("zip")) return "ZIP";
  const ext = mime.split("/")[1]?.toUpperCase();
  return ext ?? "File";
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StudyVaultPage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await fetchResources();
    if (e) setError(e.message);
    setResources(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    void load();
  }, [profile, load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resources.filter((r) => {
      const catMatch = category === "All" || r.category === category;
      const searchMatch = !q || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [resources, search, category]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Study Vault locked" description="Only active users can browse the shared study vault." />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Study Vault"
        description="Browse and download shared study resources. Admins can upload new files."
        profile={profile}
        action={
          profile.status === "active" ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-600 hover:to-blue-700 active:scale-[0.97]"
            >
              <Upload size={16} /> Upload
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or category…"
            className="w-full rounded-xl border border-slate-700/60 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white outline-none ring-0 transition-all placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                category === item ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <InlineAlert tone="error" message={error} />

      {loading ? <LoadingCard title="Loading resources…" /> : null}
      {!loading && !filtered.length ? (
        <EmptyState
          title="No resources found"
          description={
            search || category !== "All"
              ? "Try a different search term or category filter."
              : profile.role === "admin"
              ? "Click Upload to add the first resource."
              : "No resources have been uploaded yet."
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((resource) => (
          <article
            key={resource.id}
            className="group animate-fade-in flex flex-col overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/50 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-blue-950/10"
          >
            {resource.file_type?.startsWith("image/") ? (
              <div className="relative flex-none h-40 w-full overflow-hidden border-b border-slate-800/50 bg-slate-950/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resource.file_url} alt={resource.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : resource.file_type?.includes("pdf") ? (
              <div className="relative flex flex-none h-40 w-full items-center justify-center border-b border-slate-800/50 bg-gradient-to-br from-red-500/10 to-rose-600/10 transition-all group-hover:from-red-500/20 group-hover:to-rose-600/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl bg-red-500/20 p-3 text-red-500 shadow-lg shadow-red-500/20">
                    <FileText size={32} />
                  </div>
                  <span className="text-xs font-bold text-red-400">PDF Document</span>
                </div>
              </div>
            ) : resource.file_type?.includes("word") || resource.file_type?.includes("docx") ? (
              <div className="relative flex flex-none h-40 w-full items-center justify-center border-b border-slate-800/50 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 transition-all group-hover:from-blue-500/20 group-hover:to-indigo-600/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl bg-blue-500/20 p-3 text-blue-500 shadow-lg shadow-blue-500/20">
                    <FileText size={32} />
                  </div>
                  <span className="text-xs font-bold text-blue-400">Word Document</span>
                </div>
              </div>
            ) : resource.file_type?.includes("spreadsheet") || resource.file_type?.includes("xlsx") ? (
              <div className="relative flex flex-none h-40 w-full items-center justify-center border-b border-slate-800/50 bg-gradient-to-br from-emerald-500/10 to-green-600/10 transition-all group-hover:from-emerald-500/20 group-hover:to-green-600/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-500 shadow-lg shadow-emerald-500/20">
                    <FileText size={32} />
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Spreadsheet</span>
                </div>
              </div>
            ) : resource.file_type?.includes("zip") || resource.file_type?.includes("archive") ? (
              <div className="relative flex flex-none h-40 w-full items-center justify-center border-b border-slate-800/50 bg-gradient-to-br from-amber-500/10 to-orange-600/10 transition-all group-hover:from-amber-500/20 group-hover:to-orange-600/20">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl bg-amber-500/20 p-3 text-amber-500 shadow-lg shadow-amber-500/20">
                    <FileArchive size={32} />
                  </div>
                  <span className="text-xs font-bold text-amber-500">Archive/Zip</span>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-none h-40 w-full items-center justify-center border-b border-slate-800/50 bg-slate-800/30 transition-all group-hover:bg-slate-800/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl bg-slate-700/50 p-3 text-slate-400 shadow-lg shadow-black/20">
                    <FileIcon size={32} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">File Document</span>
                </div>
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{resource.category}</span>
                  <h3 className="mt-2.5 truncate text-base font-semibold text-white" title={resource.title}>{resource.title}</h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-semibold text-slate-400">
                    {fileLabel(resource.file_type)}
                  </span>
                  {resource.file_size ? <span className="text-[10px] font-medium text-slate-500">{formatBytes(resource.file_size)}</span> : null}
                </div>
              </div>
              <p className="mt-auto mb-4 text-xs text-slate-500">Uploaded {formatDateTime(resource.created_at)}</p>
            <a
              href={resource.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
            >
              <Download size={15} /> Download
            </a>
            </div>
          </article>
        ))}
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
