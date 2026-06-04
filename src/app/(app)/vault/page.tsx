"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Download, FileText, Upload, X, CheckCircle2, AlertCircle, Search,
  FileArchive, File as FileIcon, Star, Clock, LayoutGrid, List as ListIcon,
  User, Filter, SortDesc, MoreVertical, Edit, RefreshCw, Trash2, Shield,
  Share2, Flag, RotateCcw, FolderPlus, Folder, ChevronRight, Home,
  MessageSquare, History, Send, ArrowLeft
} from "lucide-react";
import { InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ResourceItem, Profile, Folder as FolderType, Comment as CommentType, ResourceVersion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const categories = ["All", "Notes", "Lab Reports", "Assignments", "References"] as const;
type Category = (typeof categories)[number];
const uploadCategories = ["Notes", "Lab Reports", "Assignments", "References"] as const;
type UploadCategory = (typeof uploadCategories)[number];

const MAX_FILE_SIZE_MB = 50;
const supabase = createClientComponentClient();

type SortOption = "Newest" | "Oldest" | "Most Downloaded" | "Recently Updated" | "Alphabetical";

// ─── Utility ─────────────────────────────────────────────────────────────────
function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
}

function shortDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : shortDate(dateStr);
}

// ─── Create Folder Modal ─────────────────────────────────────────────────
function CreateFolderModal({ parentId, onClose, onSuccess, userId }: { parentId: string | null; onClose: () => void; onSuccess: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) { setError("Folder name is required."); return; }
    setSaving(true);
    const { error: e } = await supabase.from("folders").insert({ name: name.trim(), parent_id: parentId, created_by: userId, type: "general" });
    if (e) { setError(e.message); setSaving(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2"><FolderPlus size={18} className="text-[var(--accent)]" /> New Folder</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Folder name…" autoFocus
          className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" />
        {error && <p className="mb-3 text-xs font-bold text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--surface-soft)] py-2.5 text-sm font-bold text-[var(--muted)] hover:text-white">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black hover:bg-[#bce600] disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess, uploaderId, folderId }: { onClose: () => void; onSuccess: () => void; uploaderId: string; folderId: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<UploadCategory>("Notes");
  const [subject, setSubject] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (picked: File) => {
    if (picked.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setError(`Max ${MAX_FILE_SIZE_MB} MB.`); return; }
    setError(null); setFile(picked); setTitle(picked.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = useCallback(async () => {
    if (!file || !title.trim()) { setError("File and title required."); return; }
    setUploading(true); setError(null); setProgress(10);
    const path = `${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("resources").upload(path, file);
    if (upload.error) { setError(upload.error.message); setUploading(false); setProgress(0); return; }
    setProgress(55);
    const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(path);
    setProgress(70);
    const tagsArray = tagsInput.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const { error: insertError } = await supabase.from("resources").insert({
      title: title.trim(), category, file_url: publicUrlData.publicUrl, file_type: file.type || "application/octet-stream",
      file_size: file.size, uploaded_by: uploaderId, tags: tagsArray, download_count: 0,
      version: "v1.0", status: "active", folder_id: folderId,
      subject: subject.trim() || null, course_code: courseCode.trim() || null, semester: semester.trim() || null,
      description: description.trim() || null
    });
    if (insertError) { setError(insertError.message); setUploading(false); setProgress(0); return; }
    setProgress(100); setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1000);
  }, [file, title, category, tagsInput, uploaderId, folderId, subject, courseCode, semester, description, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Upload size={18} className="text-[var(--accent)]" /> Upload Resource</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><X size={18} /></button>
        </div>
        {/* Dropzone */}
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
          className={`mb-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 transition-all ${file ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]"}`}>
          {file ? (<><FileText size={28} className="text-[var(--accent)]" /><p className="text-sm font-semibold text-white truncate max-w-full">{file.name}</p><p className="text-xs text-[var(--muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p></>) :
           (<><Upload size={28} className="text-[var(--muted)]" /><p className="text-sm text-[var(--muted)]">Drop file or <span className="text-[var(--accent)]">browse</span></p></>)}
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        </div>
        <div className="space-y-3 mb-5">
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Organic Chemistry" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Course Code</label><input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CY1001" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Semester</label><input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. Odd / Even" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Tags (comma sep.)</label><input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. organic, exam" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Category</label>
            <div className="flex flex-wrap gap-2">{uploadCategories.map(c => (<button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${category === c ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`}>{c}</button>))}</div>
          </div>
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none resize-none focus:border-[var(--accent)]" /></div>
        </div>
        {uploading && (<div className="mb-3"><div className="mb-1 flex justify-between text-xs text-[var(--muted)]"><span>{success ? "Done!" : "Uploading…"}</span><span>{progress}%</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>)}
        {success && <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-400"><CheckCircle2 size={14} /> Uploaded!</div>}
        {error && <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-400"><AlertCircle size={14} /> {error}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)]">Cancel</button>
          <button onClick={handleUpload} disabled={uploading || !file} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black hover:bg-[#bce600] disabled:opacity-50">{uploading ? "Uploading…" : "Upload"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Metadata Modal ─────────────────────────────────────────────────
function EditResourceModal({ resource, onClose, onSuccess }: { resource: ResourceItem; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(resource.title);
  const [category, setCategory] = useState<UploadCategory>(resource.category as UploadCategory);
  const [subject, setSubject] = useState(resource.subject || "");
  const [courseCode, setCourseCode] = useState(resource.course_code || "");
  const [semester, setSemester] = useState(resource.semester || "");
  const [description, setDescription] = useState(resource.description || "");
  const [tagsInput, setTagsInput] = useState((resource.tags || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSave = async () => {
    if (!title.trim()) { setError("Title required."); return; }
    setSaving(true);
    const tags = tagsInput.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const { error: e } = await supabase.from("resources").update({ title: title.trim(), category, tags, subject: subject.trim() || null, course_code: courseCode.trim() || null, semester: semester.trim() || null, description: description.trim() || null, updated_at: new Date().toISOString() }).eq("id", resource.id);
    if (e) { setError(e.message); setSaving(false); return; }
    onSuccess();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit size={18} className="text-[var(--accent)]" /> Edit Resource</h2><button onClick={onClose} className="p-1.5 text-[var(--muted)] hover:text-white"><X size={18} /></button></div>
        <div className="space-y-3 mb-5">
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Course Code</label><input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Semester</label><input value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Tags</label><input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Category</label><div className="flex flex-wrap gap-2">{uploadCategories.map(c => (<button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${category === c ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`}>{c}</button>))}</div></div>
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none resize-none focus:border-[var(--accent)]" /></div>
        </div>
        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] py-2.5 text-sm font-bold text-[var(--muted)]">Cancel</button><button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>
      </div>
    </div>
  );
}

// ─── Replace File Modal ──────────────────────────────────────────────────
function ReplaceFileModal({ resource, onClose, onSuccess, userId }: { resource: ResourceItem; onClose: () => void; onSuccess: () => void; userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleReplace = async () => {
    if (!file) return; setUploading(true); setError(null);
    const path = `${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("resources").upload(path, file);
    if (upload.error) { setError(upload.error.message); setUploading(false); return; }
    const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(path);
    let newVersion = "v1.1";
    if (resource.version) { const m = resource.version.match(/v(\d+)\.(\d+)/); if (m) newVersion = `v${m[1]}.${parseInt(m[2]) + 1}`; }
    // Save version history
    await supabase.from("resource_versions").insert({ resource_id: resource.id, version: resource.version || "v1.0", file_url: resource.file_url, file_size: resource.file_size, changed_by: userId, change_note: note.trim() || `Updated to ${newVersion}` });
    const { error: e } = await supabase.from("resources").update({ file_url: publicUrlData.publicUrl, file_size: file.size, file_type: file.type, version: newVersion, updated_at: new Date().toISOString() }).eq("id", resource.id);
    if (e) { setError(e.message); setUploading(false); return; }
    onSuccess();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2"><RefreshCw size={18} className="text-amber-400" /> Replace File</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">The current version will be saved in history. Version will auto-bump.</p>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-3 block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--surface-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Change note (optional)" className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" />
        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-[var(--surface-soft)] py-2 text-sm font-bold text-[var(--muted)]">Cancel</button><button onClick={handleReplace} disabled={!file || uploading} className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-bold text-black disabled:opacity-50">{uploading ? "Replacing..." : "Replace"}</button></div>
      </div>
    </div>
  );
}

// ─── Delete/Restore Modal ────────────────────────────────────────────────
function DeleteModal({ resource, isRestore, onClose, onSuccess }: { resource: ResourceItem; isRestore: boolean; onClose: () => void; onSuccess: () => void }) {
  const [processing, setProcessing] = useState(false);
  const handleConfirm = async () => { setProcessing(true); await supabase.from("resources").update({ status: isRestore ? "active" : "deleted", updated_at: new Date().toISOString() }).eq("id", resource.id); setProcessing(false); onSuccess(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isRestore ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{isRestore ? <RotateCcw size={24} /> : <Trash2 size={24} />}</div>
        <h2 className="mb-2 text-lg font-bold text-white">{isRestore ? "Restore?" : "Delete?"}</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">{isRestore ? `Restore "${resource.title}"?` : `Delete "${resource.title}"? Admins can restore within 30 days.`}</p>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-[var(--surface-soft)] py-2.5 text-sm font-bold text-[var(--muted)]">Cancel</button><button onClick={handleConfirm} disabled={processing} className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 ${isRestore ? "bg-emerald-600" : "bg-red-600"}`}>{processing ? "..." : isRestore ? "Restore" : "Delete"}</button></div>
      </div>
    </div>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────
function ResourceActions({ resource, profile, onEdit, onReplace, onDelete, onRestore }: { resource: ResourceItem; profile: Profile; onEdit: () => void; onReplace: () => void; onDelete: () => void; onRestore: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isOwner = profile.id === resource.uploaded_by;
  const isAdmin = profile.role === "admin";
  const isDeleted = resource.status === "deleted";
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><MoreVertical size={14} /></button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl animate-scale-in">
          <div className="px-3 py-1.5 border-b border-[var(--border)] mb-1"><p className="text-[9px] font-bold uppercase text-[var(--muted)]">Role</p><p className="text-xs font-bold text-white">{isAdmin ? "Admin" : isOwner ? "Owner" : "User"}</p></div>
          <button onClick={() => { setOpen(false); navigator.clipboard.writeText(resource.file_url); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><Share2 size={12} /> Share Link</button>
          {(isOwner || isAdmin) && !isDeleted && (<><button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><Edit size={12} /> Edit</button><button onClick={() => { setOpen(false); onReplace(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><RefreshCw size={12} /> Replace File</button></>)}
          {(!isOwner && !isAdmin) && !isDeleted && <button onClick={() => { setOpen(false); alert("Reported."); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"><Flag size={12} /> Report</button>}
          {(isOwner || isAdmin) && !isDeleted && <div className="border-t border-[var(--border)] mt-1 pt-1"><button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"><Trash2 size={12} /> Delete</button></div>}
          {isAdmin && isDeleted && <div className="border-t border-[var(--border)] mt-1 pt-1"><button onClick={() => { setOpen(false); onRestore(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10"><RotateCcw size={12} /> Restore</button></div>}
        </div>
      )}
    </div>
  );
}

// ─── Preview Drawer ──────────────────────────────────────────────────────
function PreviewDrawer({ resource, profilesMap, profile, onClose, onDownload, onEdit, onReplace, onDelete, onRestore }: {
  resource: ResourceItem; profilesMap: Map<string, string>; profile: Profile;
  onClose: () => void; onDownload: (id: string, url: string, count: number) => void;
  onEdit: () => void; onReplace: () => void; onDelete: () => void; onRestore: () => void;
}) {
  const [tab, setTab] = useState<"details" | "comments" | "history">("details");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const isOwner = profile.id === resource.uploaded_by;
  const isAdmin = profile.role === "admin";
  const isDeleted = resource.status === "deleted";

  useEffect(() => {
    async function loadExtra() {
      setLoadingComments(true);
      const [cRes, vRes] = await Promise.all([
        supabase.from("comments").select("*, user:profiles!user_id(id, name, roll_no)").eq("resource_id", resource.id).order("created_at", { ascending: false }),
        supabase.from("resource_versions").select("*, author:profiles!changed_by(name)").eq("resource_id", resource.id).order("created_at", { ascending: false })
      ]);
      setComments(Array.isArray(cRes.data) ? cRes.data as CommentType[] : []);
      setVersions(Array.isArray(vRes.data) ? vRes.data as ResourceVersion[] : []);
      setLoadingComments(false);
    }
    void loadExtra();
  }, [resource.id]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from("comments").insert({ resource_id: resource.id, user_id: profile.id, content: newComment.trim() });
    setNewComment("");
    const { data } = await supabase.from("comments").select("*, user:profiles(id, name, roll_no)").eq("resource_id", resource.id).order("created_at", { ascending: false });
    setComments(Array.isArray(data) ? data as CommentType[] : []);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <h2 className="text-base font-bold text-white truncate pr-4">{resource.title}</h2>
          <button onClick={onClose} className="p-1.5 text-[var(--muted)] hover:text-white shrink-0"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-5">
          {(["details", "comments", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", tab === t ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--muted)] hover:text-white")}>
              {t === "comments" ? <span className="flex items-center gap-1.5"><MessageSquare size={12} /> Comments ({comments.length})</span> : t === "history" ? <span className="flex items-center gap-1.5"><History size={12} /> History ({versions.length})</span> : "Details"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === "details" && (<>
            {isDeleted && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-bold text-red-400 flex items-center gap-2"><Trash2 size={14} /> Soft-deleted</div>}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">{resource.category}</span>
              {resource.subject && <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{resource.subject}</span>}
              {resource.semester && <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{resource.semester}</span>}
            </div>
            {resource.description && <p className="text-sm text-[var(--muted)] leading-relaxed">{resource.description}</p>}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                <div className="p-3.5 space-y-0.5"><p className="text-[9px] font-bold uppercase text-[var(--muted)]">Course Code</p><p className="text-sm font-bold text-white">{resource.course_code || "—"}</p></div>
                <div className="p-3.5 space-y-0.5"><p className="text-[9px] font-bold uppercase text-[var(--muted)]">File Size</p><p className="text-sm font-bold text-white">{formatBytes(resource.file_size) || "—"}</p></div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-t border-[var(--border)]">
                <div className="p-3.5 space-y-0.5"><p className="text-[9px] font-bold uppercase text-[var(--muted)]">Downloads</p><p className="text-sm font-bold text-emerald-400 flex items-center gap-1"><Download size={14} />{resource.download_count || 0}</p></div>
                <div className="p-3.5 space-y-0.5"><p className="text-[9px] font-bold uppercase text-[var(--muted)]">Version</p><p className="text-sm font-bold text-[var(--accent)]">{resource.version || "v1.0"}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase text-[var(--muted)] flex items-center gap-1.5"><User size={12} /> Ownership</h3>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-[var(--muted)]">Uploaded by</span><span className="font-bold text-white">{(resource as any).uploader_name || "Unknown"}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">Created</span><span className="font-bold text-white">{shortDate(resource.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">Last Updated</span><span className="font-bold text-white">{shortDate(resource.updated_at || resource.created_at)}</span></div>
              </div>
            </div>
            {resource.tags && resource.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{resource.tags.map(t => <span key={t} className="rounded bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] border border-[var(--border)]">#{t}</span>)}</div>}
          </>)}

          {tab === "comments" && (<>
            <div className="flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitComment()} placeholder="Add a comment…"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]" />
              <button onClick={submitComment} disabled={!newComment.trim()} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-black disabled:opacity-50"><Send size={14} /></button>
            </div>
            {loadingComments ? <p className="text-xs text-[var(--muted)]">Loading...</p> : comments.length === 0 ? <p className="text-xs text-[var(--muted)] text-center py-8">No comments yet. Be the first!</p> : (
              <div className="space-y-3">{comments.map(c => (
                <div key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{(c.user as { name: string } | undefined)?.name || "User"}</span>
                    <span className="text-[10px] text-[var(--muted)]">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{c.content}</p>
                </div>
              ))}</div>
            )}
          </>)}

          {tab === "history" && (<>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 flex items-center justify-between">
              <div><p className="text-xs font-bold text-white">{resource.version || "v1.0"} <span className="text-[var(--accent)]">(current)</span></p><p className="text-[10px] text-[var(--muted)]">{shortDate(resource.updated_at || resource.created_at)}</p></div>
              <span className="text-[10px] text-[var(--muted)]">{formatBytes(resource.file_size)}</span>
            </div>
            {versions.length === 0 ? <p className="text-xs text-[var(--muted)] text-center py-6">No previous versions</p> : (
              <div className="space-y-2">{versions.map(v => (
                <div key={v.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-white">{v.version}</p>
                    <button onClick={() => window.open(v.file_url, "_blank")} className="text-[10px] font-bold text-[var(--accent)] hover:text-[#bce600] flex items-center gap-1"><Download size={10} /> Download</button>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">{shortDate(v.created_at)} · {v.author?.name || "Unknown"}</p>
                  {v.change_note && <p className="text-[10px] text-[var(--muted)] mt-1 italic">"{v.change_note}"</p>}
                </div>
              ))}</div>
            )}
          </>)}
        </div>

        {/* Actions Footer */}
        <div className="border-t border-[var(--border)] p-4 space-y-2 bg-[var(--surface)]">
          <button onClick={() => onDownload(resource.id, resource.file_url, resource.download_count || 0)} disabled={isDeleted}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-bold text-black hover:bg-[#bce600] disabled:opacity-50">
            <Download size={16} /> Download
          </button>
          {(isOwner || isAdmin) && !isDeleted && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={onEdit} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-2 text-[10px] font-bold text-[var(--muted)] hover:text-white"><Edit size={12} className="mx-auto mb-0.5" />Edit</button>
              <button onClick={onReplace} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-2 text-[10px] font-bold text-[var(--muted)] hover:text-white"><RefreshCw size={12} className="mx-auto mb-0.5" />Replace</button>
              <button onClick={onDelete} className="rounded-lg border border-red-500/20 bg-red-500/5 py-2 text-[10px] font-bold text-red-400"><Trash2 size={12} className="mx-auto mb-0.5" />Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function StudyVaultPage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [stars, setStars] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [replacingResource, setReplacingResource] = useState<ResourceItem | null>(null);
  const [deletingResource, setDeletingResource] = useState<{ resource: ResourceItem; isRestore: boolean } | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchResources = useCallback(async (reset = false) => {
    if (!profile) return;
    setLoading(true);
    const currentPage = reset ? 0 : page;
    const PAGE_SIZE = 50;

    let query = supabase.from("resources").select("*, uploader:profiles!uploaded_by(name)");
    
    // Apply filters
    if (debouncedSearch) {
      // Basic ilike search on title, subject, course_code
      query = query.or(`title.ilike.%${debouncedSearch}%,subject.ilike.%${debouncedSearch}%,course_code.ilike.%${debouncedSearch}%`);
    } else {
      query = query.eq("folder_id", currentFolderId);
    }

    if (category !== "All") {
      query = query.eq("category", category);
    }
    
    if (profile.role !== "admin") {
      query = query.neq("status", "deleted");
    }

    // Apply sorting
    switch (sortBy) {
      case "Newest": query = query.order("created_at", { ascending: false }); break;
      case "Oldest": query = query.order("created_at", { ascending: true }); break;
      case "Most Downloaded": query = query.order("download_count", { ascending: false }); break;
      case "Recently Updated": query = query.order("updated_at", { ascending: false }); break;
      case "Alphabetical": query = query.order("title", { ascending: true }); break;
    }

    // Pagination
    query = query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    const [resData, folderData, starsData] = await Promise.all([
      query,
      supabase.from("folders").select("*").eq("type", "general"),
      supabase.from("stars").select("resource_id").eq("user_id", profile.id).not("resource_id", "is", null)
    ]);

    let data = Array.isArray(resData.data) ? (resData.data as any[]) : [];
    
    // Map uploader object to string for existing components
    data = data.map(r => ({ ...r, uploader_name: r.uploader?.name }));

    if (reset) {
      setResources(data);
    } else {
      setResources(prev => [...prev, ...data]);
    }

    setHasMore(data.length === PAGE_SIZE);
    setPage(currentPage + 1);
    setFolders(Array.isArray(folderData.data) ? folderData.data as FolderType[] : []);
    setStars(new Set((starsData.data || []).map((s: { resource_id: string }) => s.resource_id)));
    if (resData.error) setError(resData.error.message);
    setLoading(false);
  }, [profile, debouncedSearch, category, currentFolderId, sortBy, page]);

  useEffect(() => {
    if (profile?.status === "active") void fetchResources(true);
  }, [profile, debouncedSearch, category, currentFolderId, sortBy]);

  const loadMore = () => {
    if (!loading && hasMore) fetchResources();
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    if (folderId === null) { setBreadcrumb([{ id: null, name: "Root" }]); }
    else {
      const idx = breadcrumb.findIndex(b => b.id === folderId);
      if (idx >= 0) setBreadcrumb(breadcrumb.slice(0, idx + 1));
      else setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
    }
    setCurrentFolderId(folderId);
  };

  const currentFolders = useMemo(() => folders.filter(f => f.parent_id === currentFolderId), [folders, currentFolderId]);

  const processed = resources;

  const recentlyUpdated = useMemo(() => [...resources].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).slice(0, 5), [resources]);
  const mostDownloaded = useMemo(() => [...resources].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5), [resources]);

  const toggleStar = async (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!profile) return;
    const isStar = stars.has(resourceId);
    setStars(prev => { const n = new Set(prev); isStar ? n.delete(resourceId) : n.add(resourceId); return n; });
    if (isStar) await supabase.from("stars").delete().eq("user_id", profile.id).eq("resource_id", resourceId);
    else await supabase.from("stars").insert({ user_id: profile.id, resource_id: resourceId });
  };

  const handleDownload = async (id: string, url: string, count: number) => {
    window.open(url, "_blank");
    // Optimistic UI update
    setResources(c => c.map(r => r.id === id ? { ...r, download_count: (count || 0) + 1 } : r));
    // Atomic server-side increment — prevents race conditions with concurrent downloads
    const { data: newCount } = await supabase.rpc("increment_download_count", { p_table: "resources", p_id: id });
    if (typeof newCount === "number") {
      setResources(c => c.map(r => r.id === id ? { ...r, download_count: newCount } : r));
    }
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Vault locked" description="Only active users can access the Resource Vault." />;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3"><FileText className="text-[var(--accent)]" size={32} /> Resource Vault</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{resources.length} resources · Community-driven knowledge base</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFolderModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--muted)] hover:text-white"><FolderPlus size={16} /> New Folder</button>
          <button onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#bce600] active:scale-[0.97] shadow-[0_0_20px_rgba(188,230,0,0.25)]"><Upload size={16} /> Upload</button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1 text-xs font-bold">
        {breadcrumb.map((b, i) => (
          <div key={b.id ?? "root"} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-[var(--border)]" />}
            <button onClick={() => navigateToFolder(b.id, b.name)} className={cn("rounded px-2 py-1 transition-colors", i === breadcrumb.length - 1 ? "text-white bg-[var(--surface-soft)]" : "text-[var(--muted)] hover:text-white")}>
              {b.id === null ? <Home size={12} /> : b.name}
            </button>
          </div>
        ))}
      </div>

      {/* Search + Filter + Sort Bar */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, subject, or course code…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SortDesc size={14} className="text-[var(--muted)]" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer">
              {(["Newest", "Oldest", "Most Downloaded", "Recently Updated", "Alphabetical"] as const).map(s => <option key={s} className="bg-[var(--surface)]">{s}</option>)}
            </select>
            <div className="flex items-center gap-0.5 bg-[var(--background)] rounded-lg p-0.5 border border-[var(--border)]">
              <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md", viewMode === "grid" ? "bg-[var(--surface-soft)] text-white" : "text-[var(--muted)]")}><LayoutGrid size={14} /></button>
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md", viewMode === "list" ? "bg-[var(--surface-soft)] text-white" : "text-[var(--muted)]")}><ListIcon size={14} /></button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-[var(--surface)] rounded-lg p-1 border border-[var(--border)] w-fit">
          {categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${category === c ? "bg-[var(--accent)] text-black" : "text-[var(--muted)] hover:text-white"}`}>{c}</button>)}
        </div>
      </div>

      <InlineAlert tone="error" message={error} />
      {loading ? <LoadingCard title="Loading vault…" /> : (
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-4 min-w-0">
            {/* Folders */}
            {currentFolders.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {currentFolders.map(f => (
                  <button key={f.id} onClick={() => navigateToFolder(f.id, f.name)}
                    className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-all hover:border-[var(--accent)]/50 hover:shadow-lg">
                    <Folder size={20} className="text-[var(--accent)] shrink-0" />
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)]">{f.name}</p><p className="text-[10px] text-[var(--muted)]">{shortDate(f.created_at)}</p></div>
                  </button>
                ))}
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)]">
              <span>{processed.length} {processed.length === 1 ? "resource" : "resources"}</span>
            </div>

            {processed.length === 0 && !loading ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                <FileIcon size={40} className="mx-auto text-[var(--muted)] opacity-50 mb-3" />
                <h2 className="text-lg font-bold text-white mb-1">No resources here</h2>
                <p className="text-sm text-[var(--muted)] mb-4">Upload a resource or create a folder to get started.</p>
                <button onClick={() => setShowUploadModal(true)} className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-black">Upload Resource</button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {processed.map(r => (
                  <article key={r.id} onClick={() => setSelectedResource(r)}
                    className={cn("group relative flex flex-col cursor-pointer rounded-xl border bg-[var(--surface)] p-3.5 transition-all hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5", r.status === "deleted" ? "border-red-500/20 opacity-60" : "border-[var(--border)]")}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)]" title={r.title}>{r.title}</h3>
                        {r.course_code && <p className="text-[10px] font-mono font-bold text-[var(--accent)] mt-0.5">{r.course_code}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => toggleStar(r.id, e)} className="p-1 text-[var(--muted)] hover:text-amber-400"><Star size={13} className={stars.has(r.id) ? "fill-amber-400 text-amber-400" : ""} /></button>
                        <ResourceActions resource={r} profile={profile} onEdit={() => setEditingResource(r)} onReplace={() => setReplacingResource(r)} onDelete={() => setDeletingResource({ resource: r, isRestore: false })} onRestore={() => setDeletingResource({ resource: r, isRestore: true })} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-[var(--accent)]/10 text-[var(--accent)]">{r.category}</span>
                      {r.subject && <span className="text-[10px] text-[var(--muted)]">{r.subject}</span>}
                      {r.status === "deleted" && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">DEL</span>}
                    </div>
                    <div className="space-y-1 text-[10px] text-[var(--muted)] bg-[var(--background)] rounded-lg p-2 mb-2">
                      <div className="flex justify-between"><span>By</span><span className="font-bold text-white truncate ml-2">{profilesMap.get(r.uploaded_by) || "Unknown"}</span></div>
                      <div className="flex justify-between"><span>Updated</span><span className="font-bold text-white">{shortDate(r.updated_at || r.created_at)}</span></div>
                      <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-0.5"><span>Version</span><span className="font-bold text-[var(--accent)]">{r.version || "v1.0"}</span></div>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--muted)]">
                        <span className="flex items-center gap-1"><Download size={10} className="text-emerald-400" />{r.download_count || 0}</span>
                        <span>{formatBytes(r.file_size)}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(r.id, r.file_url, r.download_count || 0); }} disabled={r.status === "deleted"}
                        className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black disabled:opacity-50">Get</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_70px_auto] items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  <div className="w-6"></div><div>Title</div><div>Category</div><div>Size</div><div>Dls</div><div className="w-16"></div>
                </div>
                <div className="divide-y divide-[var(--border)]">{processed.map(r => (
                  <div key={r.id} onClick={() => setSelectedResource(r)} className={cn("group cursor-pointer grid grid-cols-[1fr_auto] md:grid-cols-[auto_1fr_100px_80px_70px_auto] items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-soft)]", r.status === "deleted" ? "opacity-60" : "")}>
                    <div className="hidden md:flex items-center w-6"><button onClick={(e) => toggleStar(r.id, e)} className="text-[var(--muted)] hover:text-amber-400"><Star size={13} className={stars.has(r.id) ? "fill-amber-400 text-amber-400" : ""} /></button></div>
                    <div className="min-w-0"><h3 className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)]">{r.title}</h3><div className="flex items-center gap-2 text-[10px] text-[var(--muted)]"><span>{r.uploader_name || "Unknown"}</span><span>·</span><span>{shortDate(r.updated_at || r.created_at)}</span><span className="text-[var(--accent)] font-bold">{r.version || "v1.0"}</span></div></div>
                    <div className="hidden md:block text-[10px] font-bold text-[var(--muted)]">{r.category}</div>
                    <div className="hidden md:block text-xs text-[var(--muted)]">{formatBytes(r.file_size)}</div>
                    <div className="hidden md:flex items-center gap-1 text-xs font-bold text-emerald-400"><Download size={11} />{r.download_count || 0}</div>
                    <div className="flex items-center gap-1"><ResourceActions resource={r} profile={profile} onEdit={() => setEditingResource(r)} onReplace={() => setReplacingResource(r)} onDelete={() => setDeletingResource({ resource: r, isRestore: false })} onRestore={() => setDeletingResource({ resource: r, isRestore: true })} /><button onClick={(e) => { e.stopPropagation(); handleDownload(r.id, r.file_url, r.download_count || 0); }} className="p-1.5 rounded-md bg-[var(--surface-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black"><Download size={13} /></button></div>
                  </div>
                ))}
                {processed.length > 0 && hasMore && (
                    <div className="flex justify-center mt-6">
                      <button onClick={loadMore} disabled={loading} className="px-6 py-2 rounded-xl border border-[var(--border)] text-sm font-bold text-white hover:bg-[var(--surface-soft)]">
                        {loading ? "Loading..." : "Load More"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5"><Clock size={13} className="text-blue-400" /> Recently Updated</h3>
              <div className="space-y-2.5">{recentlyUpdated.map(r => (
                <div key={`ru-${r.id}`} className="group cursor-pointer" onClick={() => setSelectedResource(r)}>
                  <p className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)]">{r.title}</p>
                  <p className="text-[10px] text-[var(--muted)]">{timeAgo(r.updated_at || r.created_at)}</p>
                </div>
              ))}{recentlyUpdated.length === 0 && <p className="text-xs text-[var(--muted)]">No resources yet</p>}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5"><Download size={13} className="text-emerald-400" /> Most Downloaded</h3>
              <div className="space-y-2.5">{mostDownloaded.map((r, i) => (
                <div key={`md-${r.id}`} className="group flex items-start gap-2 cursor-pointer" onClick={() => setSelectedResource(r)}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--surface-soft)] text-[10px] font-bold text-[var(--muted)]">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)]">{r.title}</p><p className="text-[10px] text-[var(--muted)]">{r.download_count || 0} downloads</p></div>
                </div>
              ))}{mostDownloaded.length === 0 && <p className="text-xs text-[var(--muted)]">No resources yet</p>}</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5"><Star size={13} className="text-amber-400" /> Your Starred</h3>
              <div className="space-y-2.5">{resources.filter(r => stars.has(r.id)).slice(0, 5).map(r => (
                <div key={`star-${r.id}`} className="group cursor-pointer" onClick={() => setSelectedResource(r)}>
                  <p className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)]">{r.title}</p>
                  <p className="text-[10px] text-[var(--muted)]">{r.category}</p>
                </div>
              ))}{stars.size === 0 && <p className="text-xs text-[var(--muted)]">Star resources to bookmark them</p>}</div>
            </div>
          </aside>
        </div>
      )}

      {/* Drawers & Modals */}
      {selectedResource && <PreviewDrawer resource={selectedResource} profile={profile} onClose={() => setSelectedResource(null)} onDownload={handleDownload} onEdit={() => { setEditingResource(selectedResource); setSelectedResource(null); }} onReplace={() => { setReplacingResource(selectedResource); setSelectedResource(null); }} onDelete={() => { setDeletingResource({ resource: selectedResource, isRestore: false }); setSelectedResource(null); }} onRestore={() => { setDeletingResource({ resource: selectedResource, isRestore: true }); setSelectedResource(null); }} />}
      {showUploadModal && <UploadModal uploaderId={profile.id} folderId={currentFolderId} onClose={() => setShowUploadModal(false)} onSuccess={() => fetchResources(true)} />}
      {showFolderModal && <CreateFolderModal parentId={currentFolderId} userId={profile.id} onClose={() => setShowFolderModal(false)} onSuccess={() => { setShowFolderModal(false); fetchResources(true); }} />}
      {editingResource && <EditResourceModal resource={editingResource} onClose={() => setEditingResource(null)} onSuccess={() => { setEditingResource(null); fetchResources(true); }} />}
      {replacingResource && <ReplaceFileModal resource={replacingResource} userId={profile.id} onClose={() => setReplacingResource(null)} onSuccess={() => { setReplacingResource(null); fetchResources(true); }} />}
      {deletingResource && <DeleteModal resource={deletingResource.resource} isRestore={deletingResource.isRestore} onClose={() => setDeletingResource(null)} onSuccess={() => { setDeletingResource(null); fetchResources(true); }} />}
    </div>
  );
}
