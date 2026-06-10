"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Download, FileText, Upload, X, CheckCircle2, AlertCircle, Search,
  File as FileIcon, Star, Clock, LayoutGrid, List as ListIcon,
  User, SortDesc, MoreVertical, Edit, RefreshCw, Trash2,
  Share2, Flag, RotateCcw, FolderPlus, Folder, ChevronRight, Home,
  MessageSquare, History, Send, BadgeCheck, FileArchive, Info, Eye, CornerUpRight,
  FileImage, FileAudio, FileVideo, FileSpreadsheet, FileType2, FileCode, CheckSquare, Square,
  LayoutTemplate, Grid2x2, AlignJustify, LayoutList, AppWindow, ChevronDown,
  Hash, HardDrive
} from "lucide-react";
import { InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";

function getFileIcon(type: string, url: string, size = 16, className = "") {
  const t = (type || "").toLowerCase();
  if (t.startsWith("image/")) return <FileImage size={size} className={cn("text-blue-400", className)} />;
  if (t.includes("pdf")) return <FileType2 size={size} className={cn("text-red-500", className)} />;
  if (t.includes("spreadsheet") || t.includes("excel") || t.includes("csv")) return <FileSpreadsheet size={size} className={cn("text-emerald-500", className)} />;
  if (t.includes("presentation") || t.includes("powerpoint")) return <FileIcon size={size} className={cn("text-orange-500", className)} />;
  if (t.includes("document") || t.includes("word")) return <FileText size={size} className={cn("text-blue-500", className)} />;
  if (t.includes("zip") || t.includes("tar") || t.includes("rar") || t.includes("archive")) return <FileArchive size={size} className={cn("text-amber-500", className)} />;
  if (t.startsWith("video/")) return <FileVideo size={size} className={cn("text-purple-500", className)} />;
  if (t.startsWith("audio/")) return <FileAudio size={size} className={cn("text-pink-500", className)} />;
  if (t.includes("javascript") || t.includes("json") || t.includes("html") || t.includes("css")) return <FileCode size={size} className={cn("text-yellow-400", className)} />;
  return <FileText size={size} className={cn("text-[var(--fg-muted)]", className)} />;
}
import { createClientComponentClient } from "@/lib/supabase";
import type { ResourceItem, Profile, Folder as FolderType, Comment as CommentType, ResourceVersion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const categories = ["All", "Notes", "Lab Reports", "Assignments", "References", "Books", "Faculty Material"] as const;
type Category = (typeof categories)[number];
const uploadCategories = ["Notes", "Lab Reports", "Assignments", "References", "Books", "Faculty Material"] as const;
type UploadCategory = (typeof uploadCategories)[number];

const semesters = ["All", "1", "2", "3", "4", "5", "6", "7", "8"] as const;
type Semester = (typeof semesters)[number];

const subjects = [
  "All",
  "Organic Chemistry",
  "Inorganic Chemistry",
  "Physical Chemistry",
  "Analytical Chemistry",
  "Biochemistry",
  "Spectroscopy",
  "Quantum Chemistry",
  "Chemical Kinetics"
] as const;
type Subject = (typeof subjects)[number];

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

// ─── Folder Actions & Modals ─────────────────────────────────────────────
function CreateFolderModal({ parentId, semester, onClose, onSuccess, userId, isVault = false }: { parentId: string | null; semester: string; onClose: () => void; onSuccess: () => void; userId: string; isVault?: boolean }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) { setError(isVault ? "Vault name is required." : "Folder name is required."); return; }
    setSaving(true);
    const { error: e } = await supabase.from("folders").insert({ 
      name: name.trim(), 
      parent_id: parentId, 
      created_by: userId, 
      type: "general",
      semester: semester === "All" ? null : semester 
    });
    if (e) { setError(e.message); setSaving(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2"><FolderPlus size={16} className="text-[var(--accent)]" /> {isVault ? "New Custom Vault" : "New Folder"}</h2>
        {semester !== "All" && !isVault && <p className="mb-3 text-[10px] font-bold text-[var(--accent)]">Creating in Semester {semester}</p>}
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder={isVault ? "Vault name…" : "Folder name…"} autoFocus
          className="mb-4 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-xs text-white outline-none focus:border-[var(--accent)]" />
        {error && <p className="mb-3 text-[10px] font-bold text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--bg-subtle)] py-2 text-xs font-bold text-[var(--fg-muted)] hover:text-white transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-xs font-bold text-black hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">{saving ? "Creating..." : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteFolderModal({ folder, onClose, onSuccess }: { folder: FolderType; onClose: () => void; onSuccess: () => void }) {
  const [processing, setProcessing] = useState(false);
  const handleConfirm = async () => { 
    setProcessing(true); 
    await supabase.from("folders").delete().eq("id", folder.id); 
    setProcessing(false); 
    onSuccess(); 
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400"><Trash2 size={20} /></div>
        <h2 className="mb-2 text-base font-bold text-white">Delete Folder?</h2>
        <p className="mb-6 text-xs text-[var(--fg-muted)] leading-relaxed">Delete "{folder.name}"? Note: Deleting a folder will not delete its files, but they will be moved to the root level. Only folder owners or admins can do this.</p>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-[var(--bg-subtle)] py-2.5 text-xs font-bold text-[var(--fg-muted)]">Cancel</button><button onClick={handleConfirm} disabled={processing} className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50">{processing ? "..." : "Delete"}</button></div>
      </div>
    </div>
  );
}

function FolderActions({ folder, profile, onDelete, onMove }: { folder: FolderType; profile: Profile; onDelete: () => void; onMove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isOwner = profile.id === folder.created_by;
  const isAdmin = profile.role === "admin";
  
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  
  if (!isOwner && !isAdmin) return null;

  return (
    <div className="relative inline-block ml-auto shrink-0" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open); }} className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><MoreVertical size={13} /></button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-36 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-overlay)] py-1 shadow-xl animate-scale-in text-left">
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onMove(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><CornerUpRight size={11} /> Move Folder</button>
          <div className="border-t border-[var(--border-default)] mt-1 pt-1"><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={11} /> Delete Folder</button></div>
        </div>
      )}
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
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Upload size={16} className="text-[var(--accent)]" /> Upload Resource</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><X size={16} /></button>
        </div>
        {/* Dropzone */}
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
          className={`mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 transition-all ${file ? "border-[var(--accent)]/50 bg-[var(--accent-muted)]" : "border-[var(--border-default)] bg-[var(--bg-base)] hover:border-[var(--accent)]"}`}>
          {file ? (<><FileText size={24} className="text-[var(--accent)]" /><p className="text-xs font-semibold text-white truncate max-w-full">{file.name}</p><p className="text-[10px] text-[var(--fg-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p></>) :
           (<><Upload size={24} className="text-[var(--fg-muted)]" /><p className="text-xs text-[var(--fg-muted)]">Drop file or <span className="text-[var(--accent)]">browse</span></p></>)}
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        </div>
        <div className="space-y-3 mb-5">
          <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" /></div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer">
                <option value="">Select subject...</option>
                {subjects.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Course Code</label><input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CY1001" className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Semester (1-8)</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer">
                <option value="">Select Semester...</option>
                {semesters.filter(s => s !== "All").map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Tags (comma sep.)</label><input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. mechanisms, lab" className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          
          <div><label className="mb-1.5 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Category</label>
            <div className="flex flex-wrap gap-1.5">{uploadCategories.map(c => (<button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold transition-all ${category === c ? "bg-[var(--accent)] text-black" : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-white"}`}>{c}</button>))}</div>
          </div>
          <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief summary of file contents..." className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none resize-none focus:border-[var(--accent)]" /></div>
        </div>
        {uploading && (<div className="mb-3"><div className="mb-1 flex justify-between text-[10px] text-[var(--fg-muted)]"><span>{success ? "Done!" : "Uploading…"}</span><span>{progress}%</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>)}
        {success && <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--success-border)] bg-[var(--success-muted)] px-3 py-2 text-xs text-[var(--success)]"><CheckCircle2 size={13} /> Uploaded successfully!</div>}
        {error && <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--error-border)] bg-[var(--error-muted)] px-3 py-2 text-xs text-[var(--error)]"><AlertCircle size={13} /> {error}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border-default)] py-2.5 text-xs font-bold text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors">Cancel</button>
          <button onClick={handleUpload} disabled={uploading || !file} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-xs font-bold text-black hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">{uploading ? "Uploading…" : "Upload"}</button>
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
    const { error: e } = await supabase.from("resources").update({ 
      title: title.trim(), 
      category, 
      tags, 
      subject: subject.trim() || null, 
      course_code: courseCode.trim() || null, 
      semester: semester.trim() || null, 
      description: description.trim() || null, 
      updated_at: new Date().toISOString() 
    }).eq("id", resource.id);
    if (e) { setError(e.message); setSaving(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold text-white flex items-center gap-2"><Edit size={16} className="text-[var(--accent)]" /> Edit Resource</h2><button onClick={onClose} className="p-1 text-[var(--fg-muted)] hover:text-white transition-colors"><X size={16} /></button></div>
        <div className="space-y-3 mb-5">
          <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" /></div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer">
                <option value="">Select subject...</option>
                {subjects.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Course Code</label><input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Semester (1-8)</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer">
                <option value="">Select Semester...</option>
                {semesters.filter(s => s !== "All").map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Tags</label><input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          <div><label className="mb-1.5 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Category</label><div className="flex flex-wrap gap-1.5">{uploadCategories.map(c => (<button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${category === c ? "bg-[var(--accent)] text-black" : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-white"}`}>{c}</button>))}</div></div>
          <div><label className="mb-1 block text-[9px] font-bold uppercase text-[var(--fg-muted)]">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none resize-none focus:border-[var(--accent)]" /></div>
        </div>
        {error && <p className="mb-3 text-[10px] text-red-400">{error}</p>}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border-default)] py-2 text-xs font-bold text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]">Cancel</button><button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-xs font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>
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
    await supabase.from("resource_versions").insert({ 
      resource_id: resource.id, 
      version: resource.version || "v1.0", 
      file_url: resource.file_url, 
      file_size: resource.file_size, 
      changed_by: userId, 
      change_note: note.trim() || `Updated to ${newVersion}` 
    });
    const { error: e } = await supabase.from("resources").update({ 
      file_url: publicUrlData.publicUrl, 
      file_size: file.size, 
      file_type: file.type, 
      version: newVersion, 
      updated_at: new Date().toISOString() 
    }).eq("id", resource.id);
    
    if (e) { setError(e.message); setUploading(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2"><RefreshCw size={16} className="text-amber-400" /> Replace File</h2>
        <p className="mb-4 text-[10px] text-[var(--fg-muted)] leading-relaxed">The current version will be archived in the version history log. The version number will automatically bump.</p>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-3 block w-full text-xs text-[var(--fg-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--bg-subtle)] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Revision note (optional)" className="mb-4 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)]" />
        {error && <p className="mb-3 text-[10px] text-red-400">{error}</p>}
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-[var(--bg-subtle)] py-2 text-xs font-bold text-[var(--fg-muted)]">Cancel</button><button onClick={handleReplace} disabled={!file || uploading} className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-bold text-black hover:bg-amber-400 disabled:opacity-50">{uploading ? "Replacing..." : "Replace"}</button></div>
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
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isRestore ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{isRestore ? <RotateCcw size={20} /> : <Trash2 size={20} />}</div>
        <h2 className="mb-2 text-base font-bold text-white">{isRestore ? "Restore Resource?" : "Delete Resource?"}</h2>
        <p className="mb-6 text-xs text-[var(--fg-muted)] leading-relaxed">{isRestore ? `Restore "${resource.title}"?` : `Delete "${resource.title}"? Admins can restore it from the archive within 30 days.`}</p>
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 rounded-lg bg-[var(--bg-subtle)] py-2.5 text-xs font-bold text-[var(--fg-muted)]">Cancel</button><button onClick={handleConfirm} disabled={processing} className={`flex-1 rounded-lg py-2.5 text-xs font-bold text-white disabled:opacity-50 ${isRestore ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>{processing ? "..." : isRestore ? "Restore" : "Delete"}</button></div>
      </div>
    </div>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────
function MoveItemModal({ item, isFolder, onClose, onSuccess, currentParentId, userId }: { item: { id: string, name: string }, isFolder: boolean, currentParentId: string | null, onClose: () => void, onSuccess: () => void, userId: string }) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentParentId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFolders() {
      const { data } = await supabase.from("folders").select("*").order("name");
      let validFolders = data as FolderType[] || [];
      if (isFolder) validFolders = validFolders.filter(f => f.id !== item.id); // Cannot move inside itself
      setFolders(validFolders);
      setLoading(false);
    }
    fetchFolders();
  }, [item.id, isFolder]);

  const handleMove = async () => {
    setSaving(true); setError(null);
    if (isFolder) {
      const { error: e } = await supabase.from("folders").update({ parent_id: selectedFolderId }).eq("id", item.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from("resources").update({ folder_id: selectedFolderId }).eq("id", item.id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2"><CornerUpRight size={16} className="text-[var(--accent)]" /> Move {isFolder ? "Folder" : "File"}</h2>
        <p className="mb-4 text-xs text-[var(--fg-muted)] leading-relaxed">Select a destination for "{item.name}".</p>
        
        {loading ? (
          <div className="py-4 text-center text-xs text-[var(--fg-faint)]">Loading folders...</div>
        ) : (
          <select 
            value={selectedFolderId || ""} 
            onChange={(e) => setSelectedFolderId(e.target.value || null)} 
            className="mb-4 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="">Root / Home</option>
            {folders.map(f => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
          </select>
        )}

        {error && <p className="mb-4 text-[10px] text-red-400">{error}</p>}
        
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--bg-subtle)] py-2.5 text-xs font-bold text-[var(--fg-muted)]">Cancel</button>
          <button onClick={handleMove} disabled={saving || loading} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-xs font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-50">{saving ? "Moving..." : "Move"}</button>
        </div>
      </div>
    </div>
  );
}

function BulkMoveModal({ 
  selectedFiles, 
  selectedFolders, 
  currentParentId, 
  onClose, 
  onSuccess 
}: { 
  selectedFiles: Set<string>; 
  selectedFolders: Set<string>; 
  currentParentId: string | null; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentParentId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFolders() {
      const { data } = await supabase.from("folders").select("*").order("name");
      let validFolders = data as FolderType[] || [];
      // Cannot move a folder into itself
      validFolders = validFolders.filter(f => !selectedFolders.has(f.id));
      setFolders(validFolders);
      setLoading(false);
    }
    fetchFolders();
  }, [selectedFolders]);

  const handleMove = async () => {
    setSaving(true); setError(null);
    const filesArray = Array.from(selectedFiles);
    const foldersArray = Array.from(selectedFolders);
    
    try {
      if (foldersArray.length > 0) {
        const { error: e1 } = await supabase.from("folders").update({ parent_id: selectedFolderId }).in("id", foldersArray);
        if (e1) throw e1;
      }
      if (filesArray.length > 0) {
        const { error: e2 } = await supabase.from("resources").update({ folder_id: selectedFolderId }).in("id", filesArray);
        if (e2) throw e2;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const total = selectedFiles.size + selectedFolders.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-bold text-white flex items-center gap-2"><CornerUpRight size={16} className="text-[var(--accent)]" /> Bulk Move</h2>
        <p className="mb-4 text-xs text-[var(--fg-muted)] leading-relaxed">Select a destination for {total} selected item{total !== 1 ? "s" : ""}.</p>
        
        {loading ? (
          <div className="py-4 text-center text-xs text-[var(--fg-faint)]">Loading folders...</div>
        ) : (
          <select 
            value={selectedFolderId || ""} 
            onChange={(e) => setSelectedFolderId(e.target.value || null)} 
            className="mb-4 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-xs text-white outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="">Root / Home</option>
            {folders.map(f => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
          </select>
        )}

        {error && <p className="mb-4 text-[10px] text-red-400">{error}</p>}
        
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--bg-subtle)] py-2.5 text-xs font-bold text-[var(--fg-muted)]">Cancel</button>
          <button onClick={handleMove} disabled={saving || loading} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-xs font-bold text-black hover:bg-[var(--accent-hover)] disabled:opacity-50">{saving ? "Moving..." : "Move"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────
function ResourceActions({ resource, profile, onEdit, onReplace, onDelete, onRestore, onMove }: { resource: ResourceItem; profile: Profile; onEdit: () => void; onReplace: () => void; onDelete: () => void; onRestore: () => void; onMove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isOwner = profile.id === resource.uploaded_by;
  const isAdmin = profile.role === "admin";
  const isDeleted = resource.status === "deleted";
  
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  
  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    navigator.clipboard.writeText(resource.file_url);
    alert("Resource file link copied to clipboard!");
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open); }} className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><MoreVertical size={13} /></button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-44 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-overlay)] py-1 shadow-xl animate-scale-in text-left">
          <div className="px-3 py-1.5 border-b border-[var(--border-default)] mb-1 select-none"><p className="text-[8px] font-bold uppercase text-[var(--fg-faint)]">Role</p><p className="text-[10px] font-bold text-white">{isAdmin ? "Admin" : isOwner ? "Owner" : "Student"}</p></div>
          <button onClick={(e) => { e.preventDefault(); copyLink(e); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><Share2 size={11} /> Share / Copy Link</button>
          {(isOwner || isAdmin) && !isDeleted && (<><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><Edit size={11} /> Edit Details</button><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onMove(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><CornerUpRight size={11} /> Move File</button><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onReplace(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-colors"><RefreshCw size={11} /> Replace File</button></>)}
          {(!isOwner && !isAdmin) && !isDeleted && <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); alert("File flagged for moderator review."); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"><Flag size={11} /> Report Abuse</button>}
          {(isOwner || isAdmin) && !isDeleted && <div className="border-t border-[var(--border-default)] mt-1 pt-1"><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={11} /> Delete File</button></div>}
          {isAdmin && isDeleted && <div className="border-t border-[var(--border-default)] mt-1 pt-1"><button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); onRestore(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"><RotateCcw size={11} /> Restore File</button></div>}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Details Pane (Inline Sidebar) ───────────────────────────
function CollapsibleDetailsPane({ resource, profile, onClose, onDownload, onEdit, onReplace, onDelete, onRestore, relatedResources }: {
  resource: ResourceItem | null; profile: Profile;
  onClose: () => void; onDownload: (id: string, url: string, count: number) => void;
  onEdit: () => void; onReplace: () => void; onDelete: () => void; onRestore: () => void;
  relatedResources: ResourceItem[];
}) {
  const [tab, setTab] = useState<"details" | "comments" | "history">("details");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!resource) return;
    const activeResource = resource;
    async function loadExtra() {
      setLoadingComments(true);
      const [cRes, vRes] = await Promise.all([
        supabase.from("comments").select("*, user:profiles!user_id(id, name, roll_no)").eq("resource_id", activeResource.id).order("created_at", { ascending: false }),
        supabase.from("resource_versions").select("*, author:profiles!changed_by(name)").eq("resource_id", activeResource.id).order("created_at", { ascending: false })
      ]);
      setComments(Array.isArray(cRes.data) ? cRes.data as CommentType[] : []);
      setVersions(Array.isArray(vRes.data) ? vRes.data as ResourceVersion[] : []);
      setLoadingComments(false);
    }
    void loadExtra();
  }, [resource]);

  const submitComment = async () => {
    if (!resource || !newComment.trim()) return;
    await supabase.from("comments").insert({ resource_id: resource.id, user_id: profile.id, content: newComment.trim() });
    setNewComment("");
    const { data } = await supabase.from("comments").select("*, user:profiles(id, name, roll_no)").eq("resource_id", resource.id).order("created_at", { ascending: false });
    setComments(Array.isArray(data) ? data as CommentType[] : []);
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const copyShareLink = () => {
    if (!resource) return;
    navigator.clipboard.writeText(resource.file_url);
    alert("Resource link copied!");
  };

  if (!resource) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[var(--fg-faint)] select-none">
        <Info size={28} className="mb-2 opacity-50" />
        <p className="text-xs">Select a folder or resource file to inspect metadata details, comments, and versions.</p>
      </div>
    );
  }

  const isOwner = profile.id === resource.uploaded_by;
  const isAdmin = profile.role === "admin";
  const isDeleted = resource.status === "deleted";

  return (
    <div className="h-full flex flex-col bg-[var(--bg-raised)] rounded-xl border border-[var(--border-default)] overflow-hidden">
      
      {/* Pane Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={15} className="text-[var(--accent)] shrink-0" />
          <h3 className="text-xs font-bold text-[var(--fg-default)] truncate" title={resource.title}>{resource.title}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-white transition-colors"><X size={13} /></button>
      </div>

      {/* Mini Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] px-2 bg-[var(--bg-base)]/30 select-none">
        {(["details", "comments", "history"] as const).map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={cn(
              "flex-1 py-2 text-[9px] font-bold uppercase tracking-wider border-b-2 text-center transition-colors", 
              tab === t ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg-default)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Pane Scroll Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        
        {tab === "details" && (
          <div className="space-y-5">
            
            {isDeleted && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-[10px] font-bold text-red-400 flex items-center gap-2 select-none shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <Trash2 size={12} /> Deleted/Archived file
              </div>
            )}
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 select-none">
              <span className="rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md">{resource.category}</span>
              {resource.subject && <span className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 text-[9px] font-extrabold tracking-wider backdrop-blur-md">{resource.subject}</span>}
              {resource.semester && <span className="rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 text-[9px] font-extrabold tracking-wider backdrop-blur-md">Sem {resource.semester}</span>}
            </div>

            {/* Description */}
            {resource.description && (
              <div className="bg-white/[0.02] border border-white/[0.05] p-3.5 rounded-xl shadow-sm">
                <p className="text-[9px] font-bold uppercase text-[var(--fg-faint)] tracking-wider mb-2 select-none flex items-center gap-1.5"><AlignJustify size={10} /> Description</p>
                <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed whitespace-pre-line">{resource.description}</p>
              </div>
            )}

            {/* 2x2 Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 select-none">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center transition-colors hover:bg-white/[0.04]">
                <p className="text-[8px] font-bold uppercase text-[var(--fg-faint)] tracking-wider flex items-center gap-1 mb-1"><Hash size={9} /> Course Code</p>
                <p className="font-bold text-white text-[11px]">{resource.course_code || "—"}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center transition-colors hover:bg-white/[0.04]">
                <p className="text-[8px] font-bold uppercase text-[var(--fg-faint)] tracking-wider flex items-center gap-1 mb-1"><HardDrive size={9} /> File Size</p>
                <p className="font-bold text-white text-[11px]">{formatBytes(resource.file_size) || "—"}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center transition-colors hover:bg-white/[0.04]">
                <p className="text-[8px] font-bold uppercase text-[var(--fg-faint)] tracking-wider flex items-center gap-1 mb-1"><Download size={9} /> Downloads</p>
                <p className="font-bold text-[var(--success)] text-[11px] flex items-center gap-1.5">{resource.download_count || 0}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-center transition-colors hover:bg-white/[0.04]">
                <p className="text-[8px] font-bold uppercase text-[var(--fg-faint)] tracking-wider flex items-center gap-1 mb-1"><RotateCcw size={9} /> Version</p>
                <p className="font-bold text-[var(--accent)] text-[11px]">{resource.version || "v1.0"}</p>
              </div>
            </div>

            {/* Ownership & History */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 space-y-2 select-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><User size={40} /></div>
              <p className="text-[9px] font-bold uppercase text-[var(--fg-faint)] tracking-wider flex items-center gap-1.5 relative z-10 mb-3"><User size={10} /> Ownership & History</p>
              <div className="text-[10px] space-y-1.5 relative z-10">
                <div className="flex justify-between items-center"><span className="text-[var(--fg-muted)]">Uploaded by</span><span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{resource.author?.name || "Unknown"}</span></div>
                <div className="flex justify-between items-center"><span className="text-[var(--fg-muted)]">Upload date</span><span className="font-semibold text-[var(--fg-default)]">{shortDate(resource.created_at)}</span></div>
                <div className="flex justify-between items-center"><span className="text-[var(--fg-muted)]">Last modified</span><span className="font-semibold text-[var(--fg-default)]">{shortDate(resource.updated_at || resource.created_at)}</span></div>
              </div>
            </div>

            {/* Related Resources */}
            {relatedResources.length > 0 && (
              <div className="space-y-2.5 select-none pt-2">
                <p className="text-[9px] font-bold uppercase text-[var(--fg-faint)] tracking-wider flex items-center gap-1.5"><CornerUpRight size={10} /> Related Materials</p>
                <div className="space-y-1.5">
                  {relatedResources.map(rel => (
                    <div 
                      key={rel.id} 
                      onClick={() => {}} 
                      className="group p-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex justify-between items-center hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          {getFileIcon(rel.file_type || "", rel.file_url || "", 14)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate text-[11px] group-hover:text-[var(--accent)] transition-colors">{rel.title}</p>
                          <p className="text-[9px] text-[var(--fg-faint)] mt-0.5">{rel.category} • {rel.course_code || "CY"}</p>
                        </div>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors shrink-0">
                        <Download size={10} className="text-[var(--fg-faint)] group-hover:text-black transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {tab === "comments" && (
          <div className="space-y-4">
            <div className="flex gap-2 select-none relative">
              <input 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && submitComment()} 
                placeholder="Write a comment…"
                className="flex-1 rounded-full border border-white/10 bg-white/5 pl-4 pr-10 py-2.5 text-xs text-white outline-none focus:border-[var(--accent)] focus:bg-white/10 transition-all shadow-inner" 
              />
              <button 
                onClick={submitComment} 
                disabled={!newComment.trim()} 
                className="absolute right-1 top-1 bottom-1 aspect-square rounded-full bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] hover:scale-105 active:scale-95 transition-all disabled:opacity-0 flex items-center justify-center shadow-[0_0_10px_rgba(212,255,0,0.2)]"
              >
                <Send size={11} className="-ml-0.5" />
              </button>
            </div>
            {loadingComments ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 select-none">
                <RefreshCw size={14} className="animate-spin text-[var(--fg-faint)]" />
                <p className="text-[10px] text-[var(--fg-faint)]">Loading discussions...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 select-none">
                <MessageSquare size={24} className="text-[var(--fg-faint)]/50" />
                <p className="text-[10px] text-[var(--fg-faint)]">No discussion comments yet.</p>
              </div>
            ) : (
              <div className="space-y-3 h-[260px] overflow-y-auto pr-2 scrollbar-thin">
                {comments.map(c => (
                  <div key={c.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 shadow-sm hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-2 text-[9px] select-none">
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center"><User size={9} className="text-white/70" /></div>
                        <span className="font-bold text-white">{(c.user as { name: string } | undefined)?.name || "Classmate"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--fg-faint)]">{timeAgo(c.created_at)}</span>
                        {(profile.id === c.user_id || profile.role === "admin") && (
                          <button onClick={() => deleteComment(c.id)} className="text-[var(--fg-faint)] hover:text-red-400 transition-colors p-0.5 rounded hover:bg-red-500/10" title="Delete comment">
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed pl-5">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 flex items-center justify-between select-none shadow-[0_0_15px_rgba(212,255,0,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="font-extrabold text-white text-[11px]">{resource.version || "v1.0"} <span className="text-[var(--accent)] font-semibold ml-1">Current</span></p>
                  <p className="text-[9px] text-[var(--fg-muted)] mt-0.5">{shortDate(resource.updated_at || resource.created_at)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded-md">{formatBytes(resource.file_size)}</span>
            </div>
            
            {versions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 select-none">
                <History size={24} className="text-[var(--fg-faint)]/50" />
                <p className="text-[10px] text-[var(--fg-faint)]">No revision history log.</p>
              </div>
            ) : (
              <div className="relative space-y-4 h-[240px] overflow-y-auto pr-3 pl-2 scrollbar-thin">
                {/* Timeline Line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />
                
                {versions.map((v, i) => (
                  <div key={v.id} className="relative pl-8">
                    {/* Timeline Node */}
                    <div className="absolute left-[3px] top-2 h-2.5 w-2.5 rounded-full bg-white/20 ring-4 ring-[var(--bg-raised)]" />
                    
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 shadow-sm hover:bg-white/[0.04] hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-1.5 select-none">
                        <p className="font-extrabold text-white text-[11px]">{v.version}</p>
                        <button onClick={() => window.open(v.file_url, "_blank")} className="text-[9px] font-bold text-[var(--accent)] hover:text-white flex items-center gap-1 transition-colors bg-[var(--accent)]/10 px-2 py-0.5 rounded-full">
                          <Download size={10} /> Get
                        </button>
                      </div>
                      <p className="text-[9px] text-[var(--fg-muted)] select-none flex items-center gap-1"><User size={10} className="text-[var(--fg-faint)]" /> {v.author?.name || "Uploader"} • {shortDate(v.created_at)}</p>
                      {v.change_note && (
                        <div className="mt-2.5 bg-black/20 border border-white/5 p-2 rounded-lg relative overflow-hidden">
                          <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-[var(--accent)]/50" />
                          <p className="text-[10px] text-[var(--fg-muted)] italic leading-relaxed pl-1">"{v.change_note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pane Footer Action Triggers */}
      <div className="border-t border-white/[0.05] p-4 space-y-3 bg-white/[0.02] backdrop-blur-md select-none">
        <button 
          onClick={() => onDownload(resource.id, resource.file_url, resource.download_count || 0)} 
          disabled={isDeleted}
          className="w-full relative overflow-hidden group flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-xs font-bold text-black hover:bg-[var(--accent-hover)] transition-all active:scale-[0.98] disabled:opacity-40 shadow-[0_0_20px_rgba(212,255,0,0.15)] hover:shadow-[0_0_25px_rgba(212,255,0,0.3)]"
        >
          <Download size={14} /> Download File
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button 
            onClick={copyShareLink} 
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-[10px] font-bold text-[var(--fg-default)] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md"
          >
            <Share2 size={12} /> Copy Link
          </button>
          {(isOwner || isAdmin) && !isDeleted ? (
            <button 
              onClick={onEdit} 
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 py-2 text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/50 transition-all shadow-sm hover:shadow-md"
            >
              <Edit size={12} /> Edit Details
            </button>
          ) : (
            <button 
              onClick={() => alert("Flagged.")} 
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-sm hover:shadow-md group"
            >
              <Flag size={12} className="group-hover:fill-red-400/20 transition-colors" /> Report File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type ViewMode = "details" | "large-icons" | "medium-icons" | "list" | "tiles";

export function ViewMenu({ viewMode, setViewMode }: { viewMode: ViewMode, setViewMode: (v: ViewMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const options: { id: ViewMode; label: string; icon: any }[] = [
    { id: "large-icons", label: "Large icons", icon: LayoutGrid },
    { id: "medium-icons", label: "Medium icons", icon: Grid2x2 },
    { id: "list", label: "List", icon: AlignJustify },
    { id: "details", label: "Details", icon: ListIcon },
    { id: "tiles", label: "Tiles", icon: LayoutList },
  ];

  const current = options.find(o => o.id === viewMode) || options[3];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-bold text-[var(--fg-muted)] hover:bg-[var(--bg-overlay)] hover:text-white transition-colors border border-transparent hover:border-[var(--border-default)]">
        <AppWindow size={14} className="text-[var(--accent)]" /> {current.label} <ChevronDown size={12} className="opacity-50" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-[var(--border-default)] bg-[var(--bg-overlay)] p-1 shadow-2xl animate-scale-in text-left">
          <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--fg-faint)] select-none">Layout</div>
          {options.map(o => (
            <button key={o.id} onClick={() => { setViewMode(o.id); setOpen(false); }} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors", viewMode === o.id ? "bg-[var(--accent)] text-black font-bold" : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white")}>
              <o.icon size={14} className={viewMode === o.id ? "opacity-100" : "opacity-70"} /> {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Vault Page Component ───────────────────────────────────────────────
export default function StudyVaultPage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [stars, setStars] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filter States
  const [selectedSemester, setSelectedSemester] = useState<Semester>("All");
  const [selectedSubject, setSelectedSubject] = useState<Subject>("All");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  
  // Breadcrumb folder state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("details");

  const [sidebarFolders, setSidebarFolders] = useState<FolderType[]>([]);
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  // Search & Navigation History
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Root" }]);

  // Search & sorting
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortOption>("Newest");

  // Local caching states
  const [recentlyViewed, setRecentlyViewed] = useState<ResourceItem[]>([]);

  // Toggles for Sidebars (Responsive)
  const [showNavSidebar, setShowNavSidebar] = useState(false); // Mobile
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(true); // Large screen default

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Storage Tracking
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB limit workspace-wide

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [replacingResource, setReplacingResource] = useState<ResourceItem | null>(null);
  const [deletingResource, setDeletingResource] = useState<{ resource: ResourceItem; isRestore: boolean } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [movingItem, setMovingItem] = useState<{ id: string, name: string, isFolder: boolean, parentId: string | null } | null>(null);

  // Bulk Selection
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  // Clear selections on navigate
  useEffect(() => {
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  }, [currentFolderId, selectedSemester, selectedSubject, selectedCategory, debouncedSearch]);

  const toggleFileSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFolderSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const totalSelected = selectedFiles.size + selectedFolders.size;
    const totalVisible = resources.length + currentFolders.length;
    if (totalSelected === totalVisible && totalVisible > 0) {
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
    } else {
      setSelectedFiles(new Set(resources.map(r => r.id)));
      setSelectedFolders(new Set(currentFolders.map(f => f.id)));
    }
  };

  // Load recently viewed cache from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("recently_viewed_resources");
    if (cached) {
      try {
        setRecentlyViewed(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const addToRecentlyViewed = (res: ResourceItem) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(r => r.id !== res.id);
      const updated = [res, ...filtered].slice(0, 5);
      localStorage.setItem("recently_viewed_resources", JSON.stringify(updated));
      return updated;
    });
  };

  const fetchResources = useCallback(async (reset = false) => {
    if (!profile) return;
    setLoading(true);
    const currentPage = reset ? 0 : page;
    const PAGE_SIZE = 50;

    let query = supabase.from("resources").select("*, uploader:profiles!uploaded_by(name)");
    
    // Apply search filters or browse location
    if (debouncedSearch) {
      query = query.or(`title.ilike.%${debouncedSearch}%,subject.ilike.%${debouncedSearch}%,course_code.ilike.%${debouncedSearch}%`);
    } else {
      // If semester or subject is actively selected, we run a global search ignoring folders to improve discoverability
      const isFilterActive = selectedSemester !== "All" || selectedSubject !== "All";
      if (!isFilterActive) {
        if (currentFolderId === null) {
          query = query.is("folder_id", null);
        } else {
          query = query.eq("folder_id", currentFolderId);
        }
      }
    }

    // Apply metadata filters
    if (selectedSemester !== "All") {
      query = query.eq("semester", selectedSemester);
    }
    if (selectedSubject !== "All") {
      query = query.eq("subject", selectedSubject);
    }
    if (selectedCategory !== "All") {
      query = query.eq("category", selectedCategory);
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

    const [resData, folderData, starsData, storageData] = await Promise.all([
      query,
      supabase.from("folders").select("*, creator:profiles!created_by(name)").eq("type", "general"),
      supabase.from("stars").select("resource_id").eq("user_id", profile.id).not("resource_id", "is", null),
      supabase.from("resources").select("file_size").eq("status", "active")
    ]);

    let data = Array.isArray(resData.data) ? (resData.data as any[]) : [];
    
    // Map uploader to author object format
    data = data.map(r => ({ ...r, author: r.uploader || { id: r.uploaded_by, name: "Student" } }));

    if (reset) {
      setResources(data);
    } else {
      setResources(prev => [...prev, ...data]);
    }

    // Calculate Workspace Storage
    if (storageData.data) {
      const totalBytes = storageData.data.reduce((acc, curr) => acc + (curr.file_size || 0), 0);
      setStorageUsed(totalBytes);
    }

    setHasMore(data.length === PAGE_SIZE);
    setPage(currentPage + 1);
    
    // Filter folders by semester if selected
    let parsedFolders = Array.isArray(folderData.data) ? folderData.data as (FolderType & { creator?: { name: string } })[] : [];
    
    // Sidebar Vaults are all root folders (parent_id === null) that don't belong to a specific semester
    setSidebarFolders(parsedFolders.filter(f => f.parent_id === null && !f.semester));

    if (selectedSemester !== "All") {
      parsedFolders = parsedFolders.filter(f => f.semester === selectedSemester || f.semester === null);
    }
    setFolders(parsedFolders);
    setStars(new Set((starsData.data || []).map((s: { resource_id: string }) => s.resource_id)));
    if (resData.error) setError(resData.error.message);
    setLoading(false);
  }, [profile, debouncedSearch, selectedSemester, selectedSubject, selectedCategory, currentFolderId, sortBy, page]);

  useEffect(() => {
    if (profile?.status === "active") void fetchResources(true);
  }, [profile, debouncedSearch, selectedSemester, selectedSubject, selectedCategory, currentFolderId, sortBy]);

  const loadMore = () => {
    if (!loading && hasMore) fetchResources();
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    // Clear global filters when traversing explicit folders
    setSelectedSemester("All");
    setSelectedSubject("All");
    
    if (folderId === null) { setBreadcrumb([{ id: null, name: "Root" }]); }
    else {
      const idx = breadcrumb.findIndex(b => b.id === folderId);
      if (idx >= 0) setBreadcrumb(breadcrumb.slice(0, idx + 1));
      else setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
    }
    setCurrentFolderId(folderId);
  };

  // Recommendations memo values
  const recommendedResources = useMemo(() => {
    return [...resources]
      .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      .slice(0, 4);
  }, [resources]);

  const relatedResources = useMemo(() => {
    if (!selectedResource) return [];
    return resources
      .filter(r => r.id !== selectedResource.id && (r.subject === selectedResource.subject || r.category === selectedResource.category))
      .slice(0, 3);
  }, [resources, selectedResource]);

  const currentFolders = useMemo(() => {
    // Hide subfolders when filtering globally by Subject
    if (debouncedSearch !== "" || selectedSubject !== "All") return [];
    return folders.filter(f => {
      // Hide custom vault root folders from the main grid because they are accessed via the sidebar
      if (currentFolderId === null && f.parent_id === null && !f.semester) return false;
      return f.parent_id === currentFolderId;
    });
  }, [folders, currentFolderId, selectedSubject, debouncedSearch]);

  const toggleStar = async (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!profile) return;
    const isStar = stars.has(resourceId);
    setStars(prev => { const n = new Set(prev); isStar ? n.delete(resourceId) : n.add(resourceId); return n; });
    if (isStar) await supabase.from("stars").delete().eq("user_id", profile.id).eq("resource_id", resourceId);
    else await supabase.from("stars").insert({ user_id: profile.id, resource_id: resourceId });
  };

  const handleDownload = async (id: string, url: string, count: number) => {
    window.open(url, "_blank");
    // Add to recently viewed cache
    const clickedItem = resources.find(r => r.id === id);
    if (clickedItem) addToRecentlyViewed(clickedItem);

    setResources(c => c.map(r => r.id === id ? { ...r, download_count: (count || 0) + 1 } : r));
    const { data: newCount } = await supabase.rpc("increment_download_count", { p_table: "resources", p_id: id });
    if (typeof newCount === "number") {
      setResources(c => c.map(r => r.id === id ? { ...r, download_count: newCount } : r));
    }
  };

  const handleSelectResource = (r: ResourceItem) => {
    setSelectedResource(r);
    addToRecentlyViewed(r);
  };

  const resetAllFilters = () => {
    setSelectedSemester("All");
    setSelectedSubject("All");
    setSelectedCategory("All");
    setSearch("");
    setCurrentFolderId(null);
    setBreadcrumb([{ id: null, name: "Root" }]);
  };

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Vault locked" description="Only active students can access the Resource Vault." />;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] rounded-xl border border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-2xl overflow-hidden animate-fade-in relative">
      
      {/* ─── Top Explorer Navigation Bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-default)] bg-[var(--bg-base)] shrink-0 select-none z-50 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Folder size={16} fill="currentColor" className="opacity-80" />
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--fg-default)]">
            <span className="text-[var(--fg-muted)]">Vault</span>
            <ChevronRight size={14} className="text-[var(--fg-faint)]" />
            {breadcrumb.map((b, i) => (
              <div key={b.id ?? "root"} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={14} className="text-[var(--fg-faint)]" />}
                <button 
                  onClick={() => navigateToFolder(b.id, b.name)} 
                  className={cn(
                    "rounded px-2 py-1 transition-all", 
                    i === breadcrumb.length - 1 ? "bg-[var(--bg-subtle)] text-white" : "hover:text-white hover:bg-[var(--bg-subtle)]/50"
                  )}
                >
                  {b.id === null ? "Home" : b.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div ref={searchRef} className="relative group w-full sm:w-64 z-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-faint)] group-focus-within:text-[var(--accent)] transition-colors" />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)} 
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search files & folders..."
              className="w-full pl-9 pr-8 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-white placeholder-[var(--fg-faint)] focus:border-[var(--accent)] focus:outline-none transition-all shadow-inner"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--accent)]"><X size={12} /></button>}
            
            {/* Search Suggestions Dropdown */}
            {isSearchFocused && search.trim() && resources.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="p-2 space-y-0.5">
                  <p className="px-2 pb-1.5 text-[9px] font-bold uppercase text-[var(--fg-faint)] tracking-wider">Top Results</p>
                  {resources.slice(0, 5).map(r => (
                    <button 
                      key={r.id} 
                      onClick={() => { handleSelectResource(r); setIsSearchFocused(false); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[var(--accent)]/10 group transition-colors text-left"
                    >
                      <div className="h-6 w-6 rounded bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {getFileIcon(r.file_type || "", r.file_url || "", 12)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">{r.title}</p>
                        <p className="text-[9px] text-[var(--fg-muted)] truncate">{r.course_code || "CY"} • {formatBytes(r.file_size)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-[1px] h-4 bg-[var(--border-default)] mx-1 hidden sm:block" />
          {(!(!currentFolderId && selectedSemester === "All") || profile?.role === "admin") && (
            <button onClick={() => setShowFolderModal(true)} className="p-1.5 rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-white transition-all"><FolderPlus size={16} /></button>
          )}
          <button onClick={() => setShowUploadModal(true)} className="p-1.5 rounded-md bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-all shadow-[0_0_10px_rgba(212,255,0,0.1)]"><Upload size={16} /></button>
          {/* Mobile Sidebar Toggle */}
          <button onClick={() => setShowNavSidebar(!showNavSidebar)} className="p-1.5 rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] lg:hidden transition-all"><ListIcon size={16} /></button>
        </div>
      </div>

      {/* ─── Main 3-Pane Interface ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">
        
        {/* LEFT PANE: Directory Tree */}
        <aside className={cn(
          "flex flex-col w-60 shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-base)]/30 transition-all",
          showNavSidebar ? "absolute inset-y-0 left-0 z-30 bg-[var(--bg-overlay)] shadow-2xl" : "hidden lg:flex"
        )}>
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            
            {/* Quick Access */}
            <div>
              <h3 className="px-3 mb-1 text-[9px] font-bold uppercase tracking-wider text-[var(--fg-faint)] select-none">Quick Access</h3>
              <div className="space-y-0.5">
                <button onClick={() => { resetAllFilters(); }} className={cn("w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors", selectedSemester === "All" && !currentFolderId ? "bg-[var(--bg-subtle)] text-white" : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]/50 hover:text-white")}>
                  <LayoutGrid size={14} className={selectedSemester === "All" && !currentFolderId ? "text-[var(--accent)]" : ""} /> All Resources
                </button>
              </div>
            </div>

            {/* Academic Tree */}
            <div>
              <h3 className="px-3 mb-1 text-[9px] font-bold uppercase tracking-wider text-[var(--fg-faint)] select-none">Academic Vault</h3>
              <div className="space-y-0.5">
                {semesters.filter(s => s !== "All").map(s => (
                  <button 
                    key={s} onClick={() => { setSelectedSemester(s); setCurrentFolderId(null); if (showNavSidebar) setShowNavSidebar(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                      selectedSemester === s ? "bg-[var(--bg-subtle)] text-white" : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]/50 hover:text-white"
                    )}
                  >
                    <Folder size={14} className={selectedSemester === s ? "text-[var(--accent)] fill-[var(--accent)]/20" : "fill-current/10"} />
                    Semester {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Vaults */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1">
                <h3 className="text-[9px] font-bold uppercase tracking-wider text-[var(--fg-faint)] select-none">Custom Vaults</h3>
                {profile?.role === "admin" && (
                  <button 
                    onClick={() => { setIsCreatingVault(true); setShowFolderModal(true); }}
                    className="text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors p-0.5 rounded-sm hover:bg-[var(--accent)]/10"
                    title="Add Custom Vault"
                  >
                    <FolderPlus size={12} />
                  </button>
                )}
              </div>
              {sidebarFolders.length === 0 ? (
                <p className="px-3 py-2 text-[10px] text-[var(--fg-faint)] italic select-none">No custom vaults.</p>
              ) : (
                <div className="space-y-0.5">
                  {sidebarFolders.map(f => (
                    <div 
                      key={f.id} onClick={() => { setSelectedSemester("All"); setCurrentFolderId(f.id); if (showNavSidebar) setShowNavSidebar(false); }}
                      role="button" tabIndex={0}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-semibold transition-colors group cursor-pointer",
                        currentFolderId === f.id ? "bg-[var(--bg-subtle)] text-white" : "text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]/50 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Folder size={14} className={currentFolderId === f.id ? "text-[var(--accent)] fill-[var(--accent)]/20" : "fill-current/10"} />
                        <span className="truncate">{f.name}</span>
                      </div>
                      {profile?.role === "admin" && (
                        <button onClick={(e) => { e.stopPropagation(); setDeletingFolder(f); }} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--fg-faint)] hover:text-red-400 transition-colors" title="Delete Vault">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          
          {/* Bottom Storage Tracker */}
          <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-base)]/50 select-none">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-[var(--fg-faint)] uppercase">Storage</span>
              <span className="text-[10px] font-mono text-[var(--accent)]">{formatBytes(storageUsed)}</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--bg-overlay)] rounded-full overflow-hidden border border-[var(--border-default)]">
              <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${Math.min((storageUsed / STORAGE_LIMIT) * 100, 100)}%` }} />
            </div>
          </div>
        </aside>

        {/* CENTER PANE: Explorer List */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-raised)]">
          
          {/* Explorer Toolbar */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-[var(--border-default)] bg-[var(--bg-raised)] shrink-0 select-none">
            <span className="text-[10px] font-bold text-[var(--fg-faint)] uppercase tracking-wider">
              {currentFolders.length + resources.length} Items
            </span>
            <div className="flex items-center gap-2">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as Category)} className="bg-transparent text-[11px] font-bold text-[var(--fg-muted)] outline-none cursor-pointer hover:text-white">
                {categories.map(c => <option key={c} value={c} className="bg-[var(--bg-overlay)]">{c === "All" ? "Any Type" : c}</option>)}
              </select>
              <div className="w-[1px] h-3 bg-[var(--border-default)]" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent text-[11px] font-bold text-[var(--fg-muted)] outline-none cursor-pointer hover:text-white">
                {(["Newest", "Oldest", "Most Downloaded", "Recently Updated", "Alphabetical"] as const).map(s => <option key={s} value={s} className="bg-[var(--bg-overlay)]">Sort: {s}</option>)}
              </select>
              <div className="w-[1px] h-3 bg-[var(--border-default)]" />
              <ViewMenu viewMode={viewMode} setViewMode={setViewMode} />
            </div>
          </div>

          <InlineAlert tone="error" message={error} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[var(--fg-muted)] text-sm">Loading files...</div>
            ) : currentFolders.length === 0 && resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none text-[var(--fg-muted)]">
                <FileIcon size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold text-white mb-1">Folder is Empty</p>
                <p className="text-xs">Upload a file or create a subfolder.</p>
              </div>
            ) : viewMode === "large-icons" ? (
              <div className="p-4 flex flex-col gap-6">
                {/* Folders Grid */}
                {currentFolders.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-faint)]">Folders</h3>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
                      {currentFolders.map(f => (
                        <div key={f.id} className={cn("group relative flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-raised)] p-3 transition-all hover:border-[var(--accent)]/50 hover:bg-white/[0.01]", selectedFolders.has(f.id) ? "ring-1 ring-[var(--accent)] border-[var(--accent)] bg-[var(--accent)]/5" : "")}>
                          <button onClick={(e) => toggleFolderSelection(f.id, e)} className={cn("p-0.5 rounded shadow-sm transition-all shrink-0", selectedFolders.has(f.id) ? "bg-[var(--accent)] text-black" : "text-[var(--fg-muted)] hover:text-white")}>
                            {selectedFolders.has(f.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                          <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => navigateToFolder(f.id, f.name)}>
                            <Folder size={18} className="text-[var(--accent)] shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)] leading-tight">{f.name}</p>
                              <p className="truncate text-[9px] text-[var(--fg-faint)] mt-0.5">{shortDate(f.created_at)}</p>
                            </div>
                          </div>
                          <FolderActions folder={f} profile={profile} onDelete={() => setDeletingFolder(f)} onMove={() => setMovingItem({ id: f.id, name: f.name, isFolder: true, parentId: f.parent_id })} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Files Grid */}
                {resources.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-faint)]">Files</h3>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                      {resources.map(r => (
                        <article key={r.id} onClick={() => handleSelectResource(r)} className={cn("group relative flex flex-col justify-between cursor-pointer rounded-xl border bg-[var(--bg-raised)] transition-all hover:border-[var(--accent)]/50 overflow-hidden", selectedResource?.id === r.id ? "border-[var(--accent)] shadow-lg shadow-[var(--accent)]/5" : "border-[var(--border-default)]", selectedFiles.has(r.id) ? "ring-1 ring-[var(--accent)] border-[var(--accent)]" : "")}>
                          
                          {/* File Cover Image / Thumbnail */}
                          <div className="relative h-28 w-full bg-[var(--bg-base)] border-b border-[var(--border-default)] flex items-center justify-center overflow-hidden">
                            {r.file_type.startsWith("image/") ? (
                              <>
                                <div className="absolute inset-0 bg-cover bg-center blur-md opacity-30" style={{ backgroundImage: `url(${r.file_url})` }} />
                                <img src={r.file_url} alt={r.title} className="relative h-full w-full object-contain bg-black/20" />
                              </>
                            ) : (
                              getFileIcon(r.file_type, r.file_url, 40, "opacity-50 group-hover:scale-110 transition-transform duration-500")
                            )}
                            
                            <button onClick={(e) => toggleFileSelection(r.id, e)} className={cn("absolute top-2 left-2 z-10 p-0.5 rounded shadow-sm transition-all", selectedFiles.has(r.id) ? "bg-[var(--accent)] text-black opacity-100" : "bg-black/40 text-white opacity-0 group-hover:opacity-100")}>
                              {selectedFiles.has(r.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>
                          </div>

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)] leading-tight">{r.title}</h3>
                                {r.course_code && <span className="text-[9px] font-mono font-bold text-[var(--accent)] block mt-0.5">{r.course_code}</span>}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 select-none">
                                <button onClick={(e) => toggleStar(r.id, e)} className="p-1 text-[var(--fg-faint)] hover:text-amber-400 transition-colors"><Star size={12} className={stars.has(r.id) ? "fill-amber-400 text-amber-400" : ""} /></button>
                                <ResourceActions resource={r} profile={profile} onEdit={() => setEditingResource(r)} onReplace={() => setReplacingResource(r)} onDelete={() => setDeletingResource({ resource: r, isRestore: false })} onRestore={() => setDeletingResource({ resource: r, isRestore: true })} onMove={() => setMovingItem({ id: r.id, name: r.title, isFolder: false, parentId: r.folder_id })} />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-3 select-none">
                              <span className="rounded bg-[var(--accent-muted)] border border-[rgba(212,255,0,0.1)] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[var(--accent)] leading-none">{r.category}</span>
                              {r.subject && <span className="text-[10px] text-[var(--fg-muted)] truncate block max-w-[100px]">{r.subject}</span>}
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <div className="space-y-1 text-[9px] text-[var(--fg-muted)] bg-[var(--bg-base)] rounded p-2 mb-3 select-none">
                              <div className="flex justify-between"><span>By</span><span className="font-semibold text-[var(--fg-default)] truncate max-w-[110px]">{r.author?.name || "Student"}</span></div>
                              <div className="flex justify-between"><span>Date</span><span className="font-semibold text-[var(--fg-default)]">{shortDate(r.created_at)}</span></div>
                            </div>
                            <div className="flex items-center justify-between select-none">
                              <div className="flex items-center gap-2.5 text-[9px] font-bold text-[var(--fg-faint)]">
                                <span className="flex items-center gap-0.5"><Download size={9} className="text-[var(--success)]" /> {r.download_count || 0}</span>
                                <span>{formatBytes(r.file_size)}</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === "medium-icons" ? (
              <div className="p-4 flex flex-col gap-6">
                {currentFolders.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-faint)]">Folders</h3>
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                      {currentFolders.map(f => (
                        <div key={f.id} onClick={() => navigateToFolder(f.id, f.name)} className={cn("group relative flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 transition-all hover:bg-white/[0.03] cursor-pointer", selectedFolders.has(f.id) ? "bg-[var(--accent)]/10" : "")}>
                          <Folder size={32} className="text-[var(--accent)] drop-shadow-md" />
                          <p className="truncate text-[10px] font-bold text-white text-center w-full">{f.name}</p>
                          <button onClick={(e) => toggleFolderSelection(f.id, e)} className={cn("absolute top-1 left-1 p-0.5 rounded shadow-sm transition-all", selectedFolders.has(f.id) ? "bg-[var(--accent)] text-black" : "text-white opacity-0 group-hover:opacity-100")}>
                            {selectedFolders.has(f.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resources.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--fg-faint)]">Files</h3>
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                      {resources.map(r => (
                        <div key={r.id} onClick={() => handleSelectResource(r)} className={cn("group relative flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 transition-all hover:bg-white/[0.03] cursor-pointer", selectedResource?.id === r.id ? "bg-[var(--bg-subtle)] border-[var(--border-default)]" : "", selectedFiles.has(r.id) ? "bg-[var(--accent)]/10" : "")}>
                          {r.file_type.startsWith("image/") ? (
                            <div className="h-8 w-8 rounded overflow-hidden shadow"><img src={r.file_url} className="w-full h-full object-cover" /></div>
                          ) : (
                            getFileIcon(r.file_type, r.file_url, 32, "drop-shadow-md")
                          )}
                          <p className="line-clamp-2 text-[10px] font-bold text-white text-center w-full leading-tight">{r.title}</p>
                          <button onClick={(e) => toggleFileSelection(r.id, e)} className={cn("absolute top-1 left-1 p-0.5 rounded shadow-sm transition-all", selectedFiles.has(r.id) ? "bg-[var(--accent)] text-black" : "text-white opacity-0 group-hover:opacity-100")}>
                            {selectedFiles.has(r.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === "tiles" ? (
              <div className="p-4 flex flex-col gap-6">
                {currentFolders.length > 0 && (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {currentFolders.map(f => (
                      <div key={f.id} onClick={() => navigateToFolder(f.id, f.name)} className={cn("group relative flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-raised)] p-2 transition-all hover:border-[var(--accent)]/50 cursor-pointer", selectedFolders.has(f.id) ? "ring-1 ring-[var(--accent)]" : "")}>
                        <button onClick={(e) => toggleFolderSelection(f.id, e)} className={cn("absolute -left-2 -top-2 z-10 p-0.5 rounded-full shadow-md transition-all bg-[var(--bg-overlay)]", selectedFolders.has(f.id) ? "text-[var(--accent)]" : "text-[var(--fg-muted)] opacity-0 group-hover:opacity-100")}>
                          {selectedFolders.has(f.id) ? <CheckCircle2 size={16} /> : <Square size={16} />}
                        </button>
                        <Folder size={28} className="text-[var(--accent)] shrink-0 ml-1" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-white">{f.name}</p>
                          <p className="truncate text-[9px] text-[var(--fg-muted)]">Folder • {shortDate(f.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {resources.length > 0 && (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {resources.map(r => (
                      <div key={r.id} onClick={() => handleSelectResource(r)} className={cn("group relative flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-raised)] p-2 transition-all hover:border-[var(--accent)]/50 cursor-pointer", selectedFiles.has(r.id) ? "ring-1 ring-[var(--accent)]" : "")}>
                        <button onClick={(e) => toggleFileSelection(r.id, e)} className={cn("absolute -left-2 -top-2 z-10 p-0.5 rounded-full shadow-md transition-all bg-[var(--bg-overlay)]", selectedFiles.has(r.id) ? "text-[var(--accent)]" : "text-[var(--fg-muted)] opacity-0 group-hover:opacity-100")}>
                          {selectedFiles.has(r.id) ? <CheckCircle2 size={16} /> : <Square size={16} />}
                        </button>
                        <div className="shrink-0 ml-1 flex items-center justify-center w-8 h-8">
                          {r.file_type.startsWith("image/") ? (
                            <img src={r.file_url} className="w-8 h-8 object-cover rounded shadow-sm" />
                          ) : (
                            getFileIcon(r.file_type, r.file_url, 28)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-white">{r.title}</p>
                          <p className="truncate text-[9px] text-[var(--fg-muted)]">{formatBytes(r.file_size)} • {r.subject || "General"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : viewMode === "list" ? (
              <div className="p-2 space-y-0.5 select-none">
                {currentFolders.map(f => (
                  <div key={f.id} onClick={() => navigateToFolder(f.id, f.name)} className={cn("group flex items-center gap-3 px-2 py-1 rounded hover:bg-white/[0.05] cursor-pointer text-[11px]", selectedFolders.has(f.id) ? "bg-[var(--accent)]/10" : "")}>
                    <button onClick={(e) => toggleFolderSelection(f.id, e)} className="text-[var(--fg-muted)] hover:text-white transition-colors">
                      {selectedFolders.has(f.id) ? <CheckSquare size={13} className="text-[var(--accent)]" /> : <Square size={13} className="opacity-0 group-hover:opacity-100" />}
                    </button>
                    <Folder size={14} className="text-[var(--accent)]" />
                    <span className="font-semibold text-white">{f.name}</span>
                  </div>
                ))}
                {resources.map(r => (
                  <div key={r.id} onClick={() => handleSelectResource(r)} className={cn("group flex items-center gap-3 px-2 py-1 rounded hover:bg-white/[0.05] cursor-pointer text-[11px]", selectedFiles.has(r.id) ? "bg-[var(--accent)]/10" : "")}>
                    <button onClick={(e) => toggleFileSelection(r.id, e)} className="text-[var(--fg-muted)] hover:text-white transition-colors">
                      {selectedFiles.has(r.id) ? <CheckSquare size={13} className="text-[var(--accent)]" /> : <Square size={13} className="opacity-0 group-hover:opacity-100" />}
                    </button>
                    {getFileIcon(r.file_type, r.file_url, 14)}
                    <span className="font-semibold text-[var(--fg-default)] group-hover:text-white truncate max-w-[80%]">{r.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead className="sticky top-0 bg-[var(--bg-raised)] z-10 shadow-sm border-b border-[var(--border-default)]">
                  <tr className="text-[9px] uppercase tracking-wider text-[var(--fg-faint)]">
                    <th className="w-10 pl-4 py-2">
                      <button onClick={toggleSelectAll} className="text-[var(--fg-muted)] hover:text-white">
                        {selectedFiles.size + selectedFolders.size > 0 && selectedFiles.size + selectedFolders.size === resources.length + currentFolders.length ? <CheckSquare size={13} className="text-[var(--accent)]" /> : <Square size={13} />}
                      </button>
                    </th>
                    <th className="w-8 py-2 font-bold"></th>
                    <th className="py-2 font-bold">Name</th>
                    <th className="py-2 font-bold hidden sm:table-cell">Subject</th>
                    <th className="py-2 font-bold hidden md:table-cell">Date</th>
                    <th className="py-2 font-bold text-right hidden sm:table-cell">Size</th>
                    <th className="w-16 pr-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {/* FOLDERS */}
                  {currentFolders.map(f => (
                    <tr key={`folder-${f.id}`} onClick={() => navigateToFolder(f.id, f.name)} className={cn("group cursor-pointer hover:bg-white/[0.02] transition-colors", selectedFolders.has(f.id) ? "bg-[var(--accent)]/5" : "")}>
                      <td className="pl-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleFolderSelection(f.id, e)} className="text-[var(--fg-muted)] hover:text-white transition-colors block mt-0.5">
                          {selectedFolders.has(f.id) ? <CheckSquare size={14} className="text-[var(--accent)]" /> : <Square size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      </td>
                      <td className="py-2.5"><Folder size={16} className="text-[var(--accent)] fill-[var(--accent)]/20" /></td>
                      <td className="py-2.5 font-bold text-white group-hover:text-[var(--accent)] transition-colors">{f.name}</td>
                      <td className="py-2.5 text-[var(--fg-muted)] hidden sm:table-cell">Folder</td>
                      <td className="py-2.5 text-[var(--fg-muted)] hidden md:table-cell">{shortDate(f.created_at)}</td>
                      <td className="py-2.5 text-[var(--fg-faint)] text-right font-mono hidden sm:table-cell">--</td>
                      <td className="pr-4 py-2.5 text-right"><div onClick={(e) => e.stopPropagation()}><FolderActions folder={f} profile={profile} onDelete={() => setDeletingFolder(f)} onMove={() => setMovingItem({ id: f.id, name: f.name, isFolder: true, parentId: f.parent_id })} /></div></td>
                    </tr>
                  ))}
                  
                  {/* FILES */}
                  {resources.map(r => (
                    <tr 
                      key={`file-${r.id}`} onClick={() => handleSelectResource(r)} 
                      className={cn("group cursor-pointer hover:bg-white/[0.02] transition-colors", selectedResource?.id === r.id ? "bg-[var(--bg-subtle)]" : "", r.status === "deleted" ? "opacity-40" : "", selectedFiles.has(r.id) ? "bg-[var(--accent)]/5" : "")}
                    >
                      <td className="pl-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleFileSelection(r.id, e)} className="text-[var(--fg-muted)] hover:text-white transition-colors block mt-0.5">
                          {selectedFiles.has(r.id) ? <CheckSquare size={14} className="text-[var(--accent)]" /> : <Square size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      </td>
                      <td className="py-2.5">{getFileIcon(r.file_type, r.file_url, 16)}</td>
                      <td className="py-2.5">
                        <div className="font-bold text-white group-hover:text-[var(--accent)] transition-colors flex items-center gap-2">
                          <span className="truncate max-w-[200px] sm:max-w-xs">{r.title}</span>
                          {stars.has(r.id) && <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="py-2.5 hidden sm:table-cell"><span className="text-[10px] bg-[var(--bg-subtle)] text-[var(--fg-muted)] px-1.5 py-0.5 rounded truncate max-w-[120px] inline-block">{r.subject || "General"}</span></td>
                      <td className="py-2.5 text-[10px] text-[var(--fg-muted)] hidden md:table-cell">{shortDate(r.created_at)}</td>
                      <td className="py-2.5 text-[10px] text-[var(--fg-muted)] font-mono text-right hidden sm:table-cell">{formatBytes(r.file_size)}</td>
                      <td className="pr-4 py-2.5 text-right flex items-center justify-end gap-1">
                        <ResourceActions resource={r} profile={profile} onEdit={() => setEditingResource(r)} onReplace={() => setReplacingResource(r)} onDelete={() => setDeletingResource({ resource: r, isRestore: false })} onRestore={() => setDeletingResource({ resource: r, isRestore: true })} onMove={() => setMovingItem({ id: r.id, name: r.title, isFolder: false, parentId: r.folder_id })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {resources.length > 0 && hasMore && (
              <div className="p-4 text-center">
                <button onClick={loadMore} disabled={loading} className="px-4 py-1.5 rounded-lg border border-[var(--border-default)] text-[10px] font-bold text-[var(--fg-muted)] hover:text-white transition-colors">
                  {loading ? "..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Detail Preview */}
        {selectedResource && (
          <aside className="w-80 shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-base)]/50 hidden xl:flex flex-col animate-fade-in z-20">
            <div className="flex-1 overflow-y-auto p-4">
              <CollapsibleDetailsPane 
                resource={selectedResource} profile={profile} onClose={() => setSelectedResource(null)} onDownload={handleDownload} 
                onEdit={() => setEditingResource(selectedResource)} onReplace={() => setReplacingResource(selectedResource)} 
                onDelete={() => setDeletingResource({ resource: selectedResource, isRestore: false })} onRestore={() => setDeletingResource({ resource: selectedResource, isRestore: true })}
                relatedResources={relatedResources}
              />
            </div>
          </aside>
        )}

      </div>

      {/* Mobile Right Pane Overlay */}
      {selectedResource && (
        <div className="xl:hidden">
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs" onClick={() => setSelectedResource(null)} />
          <div className="fixed bottom-0 inset-x-0 max-h-[85vh] rounded-t-2xl bg-[var(--bg-overlay)] border-t border-[var(--border-default)] z-50 flex flex-col animate-sheet-up overflow-hidden">
            <div className="grow overflow-y-auto p-4">
              <CollapsibleDetailsPane resource={selectedResource} profile={profile} onClose={() => setSelectedResource(null)} onDownload={handleDownload} onEdit={() => { setEditingResource(selectedResource); setSelectedResource(null); }} onReplace={() => { setReplacingResource(selectedResource); setSelectedResource(null); }} onDelete={() => { setDeletingResource({ resource: selectedResource, isRestore: false }); setSelectedResource(null); }} onRestore={() => { setDeletingResource({ resource: selectedResource, isRestore: true }); setSelectedResource(null); }} relatedResources={relatedResources} />
            </div>
          </div>
        </div>
      )}

      {/* Dialog Modals */}
      {showUploadModal && <UploadModal uploaderId={profile.id} folderId={currentFolderId} onClose={() => setShowUploadModal(false)} onSuccess={() => fetchResources(true)} />}
      {showFolderModal && <CreateFolderModal parentId={isCreatingVault ? null : currentFolderId} semester={isCreatingVault ? "All" : selectedSemester} userId={profile.id} isVault={isCreatingVault} onClose={() => { setShowFolderModal(false); setIsCreatingVault(false); }} onSuccess={() => { setShowFolderModal(false); setIsCreatingVault(false); fetchResources(true); }} />}
      {editingResource && <EditResourceModal resource={editingResource} onClose={() => setEditingResource(null)} onSuccess={() => { setEditingResource(null); fetchResources(true); }} />}
      {replacingResource && <ReplaceFileModal resource={replacingResource} userId={profile.id} onClose={() => setReplacingResource(null)} onSuccess={() => { setReplacingResource(null); fetchResources(true); }} />}
      {deletingResource && <DeleteModal resource={deletingResource.resource} isRestore={deletingResource.isRestore} onClose={() => setDeletingResource(null)} onSuccess={() => { setDeletingResource(null); fetchResources(true); }} />}
      {deletingFolder && <DeleteFolderModal folder={deletingFolder} onClose={() => setDeletingFolder(null)} onSuccess={() => { setDeletingFolder(null); fetchResources(true); }} />}
      {movingItem && <MoveItemModal item={{ id: movingItem.id, name: movingItem.name }} isFolder={movingItem.isFolder} currentParentId={movingItem.parentId} userId={profile.id} onClose={() => setMovingItem(null)} onSuccess={() => { setMovingItem(null); fetchResources(true); }} />}
      {showBulkMoveModal && <BulkMoveModal selectedFiles={selectedFiles} selectedFolders={selectedFolders} currentParentId={currentFolderId} onClose={() => setShowBulkMoveModal(false)} onSuccess={() => { setShowBulkMoveModal(false); setSelectedFiles(new Set()); setSelectedFolders(new Set()); fetchResources(true); }} />}

      {/* Floating Bulk Action Toolbar */}
      {(selectedFiles.size > 0 || selectedFolders.size > 0) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-full border border-[var(--border-default)] bg-[var(--bg-overlay)] px-4 py-2 shadow-2xl animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-black">{selectedFiles.size + selectedFolders.size}</span>
            <span className="text-xs font-bold text-white">Selected</span>
          </div>
          <div className="h-4 w-[1px] bg-[var(--border-default)]" />
          <button onClick={() => setShowBulkMoveModal(true)} className="flex items-center gap-1.5 text-xs font-bold text-[var(--fg-muted)] hover:text-white transition-colors"><CornerUpRight size={13} /> Move</button>
          <button onClick={() => { setSelectedFiles(new Set()); setSelectedFolders(new Set()); }} className="flex items-center gap-1.5 text-xs font-bold text-[var(--fg-muted)] hover:text-red-400 transition-colors"><X size={13} /> Clear</button>
        </div>
      )}
    </div>
  );
}
