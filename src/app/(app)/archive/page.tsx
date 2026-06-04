"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload, FileText, X, CheckCircle2, AlertCircle, Search, Download, BookOpen,
  Clock, TrendingUp, Filter, Folder, ArrowRight, MoreVertical, Edit, RefreshCw,
  Trash2, Shield, Share2, Flag, RotateCcw, Star, User, SortDesc, ChevronDown,
  Calendar, GraduationCap, Hash, Eye
} from "lucide-react";
import { InlineAlert, LoadingCard, LockedScreen, EmptyState } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ExamPaper, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const examTypes = ["All", "End Sem", "Mid Sem", "Quiz", "Lab Exam"] as const;
const uploadExamTypes = ["End Sem", "Mid Sem", "Quiz", "Lab Exam"] as const;
type ExamTypeFilter = (typeof examTypes)[number];
type UploadExamType = (typeof uploadExamTypes)[number];

const SEMESTERS = ["Odd", "Even"] as const;
const MAX_FILE_SIZE_MB = 50;
const supabase = createClientComponentClient();

type SortOption = "Newest" | "Oldest" | "Most Downloaded" | "Recently Updated";

const HARDCODED_SUBJECTS = [
  { name: "Organic Chemistry", code: "CY1001" },
  { name: "Physical Chemistry", code: "CY1002" },
  { name: "Biochemistry", code: "CY2001" },
  { name: "Analytical Chemistry", code: "CY2002" },
  { name: "Inorganic Chemistry", code: "CY1003" },
  { name: "Spectroscopy", code: "CY3001" },
  { name: "Quantum Chemistry", code: "CY3002" },
  { name: "Polymer Chemistry", code: "CY4001" },
];

const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i);

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

// ─── Upload Modal ────────────────────────────────────────────────────────────
interface UploadModalProps { onClose: () => void; onSuccess: () => void; uploaderId: string; }

function UploadModal({ onClose, onSuccess, uploaderId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [examType, setExamType] = useState<UploadExamType>("End Sem");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState<"Odd" | "Even">("Odd");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (picked: File) => {
    if (picked.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setError(`File too large. Max ${MAX_FILE_SIZE_MB} MB.`); return; }
    setError(null); setFile(picked); setSubject(picked.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const dropped = e.dataTransfer.files[0]; if (dropped) pickFile(dropped); };

  const handleUpload = useCallback(async () => {
    if (!file || !subject.trim()) { setError("Please select a file and enter a subject."); return; }
    setUploading(true); setError(null); setProgress(10);
    const path = `${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("past_papers").upload(path, file);
    if (upload.error) { setError(upload.error.message); setUploading(false); setProgress(0); return; }
    setProgress(55);
    const { data: publicUrlData } = supabase.storage.from("past_papers").getPublicUrl(path);
    setProgress(70);
    const { error: insertError } = await supabase.from("exam_papers").insert({
      subject: subject.trim(), exam_type: examType, year, semester,
      file_url: publicUrlData.publicUrl, file_size: file.size,
      uploaded_by: uploaderId, download_count: 0,
      course_code: courseCode.trim() || null, faculty: faculty.trim() || null,
      version: "v1.0", status: "active"
    });
    if (insertError) { setError(insertError.message); setUploading(false); setProgress(0); return; }
    setProgress(100); setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1200);
  }, [file, subject, examType, year, semester, uploaderId, courseCode, faculty, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Upload size={20} className="text-[var(--accent)]" /> Upload to Archive</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-white"><X size={18} /></button>
        </div>
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current?.click()}
          className={`mb-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 transition-all ${file ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]"}`}>
          {file ? (<><FileText size={30} className="text-[var(--accent)]" /><p className="text-sm font-semibold text-white truncate max-w-full px-4">{file.name}</p><p className="text-xs text-[var(--muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p></>) : (<><Upload size={30} className="text-[var(--muted)]" /><p className="text-sm font-medium text-[var(--muted)]">Drop file here or <span className="text-[var(--accent)]">browse</span></p><p className="text-xs text-[var(--muted)]">PDF / Images · Max {MAX_FILE_SIZE_MB} MB</p></>)}
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Subject Name *</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Organic Chemistry" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
        </div>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Course Code</label>
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CY1001" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Faculty</label>
            <input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="e.g. Dr. Sharma" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Exam Category</label>
          <div className="flex flex-wrap gap-2">
            {uploadExamTypes.map((et) => (<button key={et} type="button" onClick={() => setExamType(et)} className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${examType === et ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-soft)] text-[var(--muted)] hover:bg-[var(--surface)]"}`}>{et}</button>))}
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Year</label>
            <input type="number" value={year} min={2000} max={new Date().getFullYear()} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[var(--accent)]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Semester</label>
            <div className="flex h-[42px] overflow-hidden rounded-lg border border-[var(--border)]">
              {SEMESTERS.map((s) => (<button key={s} type="button" onClick={() => setSemester(s)} className={`flex-1 text-sm font-semibold transition-all ${semester === s ? "bg-[var(--accent)] text-black" : "bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--surface)]"}`}>{s}</button>))}
            </div>
          </div>
        </div>
        {uploading && (<div className="mb-4"><div className="mb-1.5 flex justify-between text-xs font-medium text-[var(--muted)]"><span>{success ? "Upload complete!" : "Uploading…"}</span><span>{progress}%</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>)}
        {success && (<div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-2.5 text-sm font-medium text-emerald-400"><CheckCircle2 size={16} /> Paper uploaded successfully!</div>)}
        {error && (<div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-400"><AlertCircle size={16} /> {error}</div>)}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)]">Cancel</button>
          <button onClick={handleUpload} disabled={uploading || !file} className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#bce600] disabled:opacity-50 active:scale-[0.97]">{uploading ? "Uploading…" : "Upload to Archive"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Metadata Modal ──────────────────────────────────────────────────
function EditPaperModal({ paper, onClose, onSuccess }: { paper: ExamPaper; onClose: () => void; onSuccess: () => void }) {
  const [subject, setSubject] = useState(paper.subject);
  const [courseCode, setCourseCode] = useState(paper.course_code || "");
  const [faculty, setFaculty] = useState(paper.faculty || "");
  const [examType, setExamType] = useState<UploadExamType>(paper.exam_type as UploadExamType);
  const [year, setYear] = useState(paper.year);
  const [semester, setSemester] = useState<"Odd" | "Even">(paper.semester as "Odd" | "Even");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!subject.trim()) { setError("Subject cannot be empty."); return; }
    setSaving(true);
    const { error: e } = await supabase.from("exam_papers").update({
      subject: subject.trim(), course_code: courseCode.trim() || null, faculty: faculty.trim() || null,
      exam_type: examType, year, semester, updated_at: new Date().toISOString()
    }).eq("id", paper.id);
    if (e) { setError(e.message); setSaving(false); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit size={18} className="text-[var(--accent)]" /> Edit Paper</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4 mb-6">
          <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Course Code</label><input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Faculty</label><input value={faculty} onChange={(e) => setFaculty(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Exam Type</label>
            <div className="flex flex-wrap gap-2">{uploadExamTypes.map((et) => (<button key={et} type="button" onClick={() => setExamType(et)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${examType === et ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`}>{et}</button>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Year</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" /></div>
            <div><label className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">Semester</label><div className="flex h-[42px] overflow-hidden rounded-lg border border-[var(--border)]">{SEMESTERS.map((s) => (<button key={s} type="button" onClick={() => setSemester(s)} className={`flex-1 text-sm font-semibold ${semester === s ? "bg-[var(--accent)] text-black" : "bg-[var(--background)] text-[var(--muted)]"}`}>{s}</button>))}</div></div>
          </div>
        </div>
        {error && <div className="mb-4 text-xs font-bold text-red-400 bg-red-950/40 p-3 rounded-lg">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] bg-transparent py-2.5 text-sm font-bold text-[var(--muted)] hover:bg-[var(--surface-soft)]">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-sm font-bold text-black hover:bg-[#bce600] disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Replace File Modal ──────────────────────────────────────────────────
function ReplacePaperModal({ paper, onClose, onSuccess }: { paper: ExamPaper; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleReplace = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    const path = `${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("past_papers").upload(path, file);
    if (upload.error) { setError(upload.error.message); setUploading(false); return; }
    const { data: publicUrlData } = supabase.storage.from("past_papers").getPublicUrl(path);
    let newVersion = "v1.1";
    if (paper.version) { const m = paper.version.match(/v(\d+)\.(\d+)/); if (m) newVersion = `v${m[1]}.${parseInt(m[2]) + 1}`; }
    const { error: e } = await supabase.from("exam_papers").update({ file_url: publicUrlData.publicUrl, file_size: file.size, version: newVersion, updated_at: new Date().toISOString() }).eq("id", paper.id);
    if (e) { setError(e.message); setUploading(false); return; }
    onSuccess();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2"><RefreshCw size={18} className="text-amber-400" /> Replace File</h2>
        <p className="mb-6 text-xs text-[var(--muted)]">This will upload a new file, increment the version number, and update the Last Edited date.</p>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4 block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--border)]" />
        {error && <div className="mb-4 text-xs font-bold text-red-400">{error}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--surface-soft)] py-2 text-sm font-bold text-[var(--muted)] hover:text-white">Cancel</button>
          <button onClick={handleReplace} disabled={!file || uploading} className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50">{uploading ? "Replacing..." : "Replace File"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete / Restore Modal ─────────────────────────────────────────────
function DeletePaperModal({ paper, isRestore, onClose, onSuccess }: { paper: ExamPaper; isRestore: boolean; onClose: () => void; onSuccess: () => void }) {
  const [processing, setProcessing] = useState(false);
  const handleConfirm = async () => {
    setProcessing(true);
    const { error } = await supabase.from("exam_papers").update({ status: isRestore ? "active" : "deleted", updated_at: new Date().toISOString() }).eq("id", paper.id);
    setProcessing(false);
    if (!error) onSuccess();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 text-center shadow-2xl">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isRestore ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{isRestore ? <RotateCcw size={24} /> : <Trash2 size={24} />}</div>
        <h2 className="mb-2 text-lg font-bold text-white">{isRestore ? "Restore Paper?" : "Delete Paper?"}</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">{isRestore ? `Restore "${paper.subject}"?` : `Delete "${paper.subject}"? Admins can restore it within 30 days.`}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-[var(--surface-soft)] py-2.5 text-sm font-bold text-[var(--muted)] hover:text-white">Cancel</button>
          <button onClick={handleConfirm} disabled={processing} className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 ${isRestore ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>{processing ? "Processing..." : isRestore ? "Restore" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Actions Dropdown ─────────────────────────────────────────────────────
function PaperActions({ paper, profile, onEdit, onReplace, onDelete, onRestore }: {
  paper: ExamPaper; profile: Profile;
  onEdit: () => void; onReplace: () => void; onDelete: () => void; onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isOwner = profile.id === paper.uploaded_by;
  const isAdmin = profile.role === "admin";
  const isDeleted = paper.status === "deleted";

  useEffect(() => {
    function handleClick(event: MouseEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/archive?q=${encodeURIComponent(paper.subject)}`); setOpen(false); };
  const report = () => { setOpen(false); alert("Paper reported to administrators."); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-white">
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl animate-scale-in">
          <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">Permissions</p>
            <p className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">{isAdmin ? <><Shield size={11} className="text-amber-400" /> Admin</> : isOwner ? "Owner" : "User"}</p>
          </div>
          <button onClick={copyLink} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><Share2 size={14} /> Share Link</button>
          {(isOwner || isAdmin) && !isDeleted && (
            <>
              <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><Edit size={14} /> Edit Metadata</button>
              <button onClick={() => { setOpen(false); onReplace(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white"><RefreshCw size={14} /> Replace File</button>
            </>
          )}
          {(!isOwner && !isAdmin) && !isDeleted && (
            <button onClick={report} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><Flag size={14} /> Report Paper</button>
          )}
          {(isOwner || isAdmin) && !isDeleted && (
            <div className="mt-1 border-t border-[var(--border)] pt-1"><button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={14} /> Delete</button></div>
          )}
          {isAdmin && isDeleted && (
            <div className="mt-1 border-t border-[var(--border)] pt-1"><button onClick={() => { setOpen(false); onRestore(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10"><RotateCcw size={14} /> Restore</button></div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail Side Panel ────────────────────────────────────────────────────
function DetailPanel({ paper, profile, onClose, onDownload, onEdit, onReplace, onDelete, onRestore }: {
  paper: ExamPaper; profile: Profile;
  onClose: () => void;
  onDownload: (id: string, url: string, count: number) => void;
  onEdit: () => void; onReplace: () => void; onDelete: () => void; onRestore: () => void;
}) {
  const isOwner = profile.id === paper.uploaded_by;
  const isAdmin = profile.role === "admin";
  const isDeleted = paper.status === "deleted";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <h2 className="text-lg font-bold text-white truncate pr-4">{paper.subject}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-white shrink-0"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          {isDeleted && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm font-bold text-red-400 flex items-center gap-2"><Trash2 size={16} /> This paper has been soft-deleted.</div>
          )}

          {/* Exam Type Badge */}
          <div className="flex items-center gap-3">
            <span className={cn("rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
              paper.exam_type === "End Sem" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
              paper.exam_type === "Mid Sem" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" :
              paper.exam_type === "Quiz" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" : "bg-purple-500/15 text-purple-400 border border-purple-500/20"
            )}>{paper.exam_type}</span>
            <span className="text-sm font-bold text-white">{paper.year}</span>
            <span className="text-sm text-[var(--muted)]">{paper.semester} Semester</span>
          </div>

          {/* Metadata Grid */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
              <div className="p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Course Code</p>
                <p className="text-sm font-bold text-white">{paper.course_code || "—"}</p>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Faculty</p>
                <p className="text-sm font-bold text-white">{paper.faculty || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-t border-[var(--border)]">
              <div className="p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">File Size</p>
                <p className="text-sm font-bold text-white">{formatBytes(paper.file_size) || "—"}</p>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Downloads</p>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1"><Download size={14} />{paper.download_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Ownership Section */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2"><User size={14} /> Ownership</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--muted)]">Uploaded by</span><span className="font-bold text-white">{(paper as any).uploader_name || "Unknown"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Created</span><span className="font-bold text-white">{shortDate(paper.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Last Updated</span><span className="font-bold text-white">{shortDate(paper.updated_at || paper.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--muted)]">Version</span><span className="font-bold text-[var(--accent)]">{paper.version || "v1.0"}</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => onDownload(paper.id, paper.file_url, paper.download_count || 0)} disabled={isDeleted}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black hover:bg-[#bce600] disabled:opacity-50 active:scale-[0.98] transition-all">
              <Download size={16} /> Download Paper
            </button>

            {(isOwner || isAdmin) && !isDeleted && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onEdit} className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--muted)] hover:text-white"><Edit size={14} /> Edit</button>
                <button onClick={onReplace} className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--muted)] hover:text-white"><RefreshCw size={14} /> Replace</button>
              </div>
            )}
            {(isOwner || isAdmin) && !isDeleted && (
              <button onClick={onDelete} className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10"><Trash2 size={14} /> Delete Paper</button>
            )}
            {isAdmin && isDeleted && (
              <button onClick={onRestore} className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10"><RotateCcw size={14} /> Restore Paper</button>
            )}
            {!isOwner && !isAdmin && !isDeleted && (
              <button onClick={() => alert("Paper reported to administrators.")} className="w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--muted)] hover:text-red-400"><Flag size={14} /> Report Paper</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ExamArchivePage() {
  const { profile } = useAuth();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [examType, setExamType] = useState<ExamTypeFilter>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [replacingPaper, setReplacingPaper] = useState<ExamPaper | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<{ paper: ExamPaper; isRestore: boolean } | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchPapers = useCallback(async (reset = false) => {
    if (!profile) return;
    setLoading(true);
    const currentPage = reset ? 0 : page;
    const PAGE_SIZE = 50;

    let query = supabase.from("exam_papers").select("*, uploader:profiles!uploaded_by(name)");

    if (debouncedSearch) {
      query = query.or(`subject.ilike.%${debouncedSearch}%,course_code.ilike.%${debouncedSearch}%,faculty.ilike.%${debouncedSearch}%`);
    }

    if (examType !== "All") query = query.eq("exam_type", examType);
    if (yearFilter) query = query.eq("year", yearFilter);
    if (semesterFilter) query = query.eq("semester", semesterFilter);
    if (profile.role !== "admin") query = query.neq("status", "deleted");

    switch (sortBy) {
      case "Newest": query = query.order("created_at", { ascending: false }); break;
      case "Oldest": query = query.order("created_at", { ascending: true }); break;
      case "Most Downloaded": query = query.order("download_count", { ascending: false }); break;
      case "Recently Updated": query = query.order("updated_at", { ascending: false }); break;
    }

    query = query.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    const { data, error: err } = await query;
    if (err) setError(err.message);
    
    let items = Array.isArray(data) ? (data as any[]) : [];
    items = items.map(p => ({ ...p, uploader_name: p.uploader?.name }));

    if (reset) {
      setPapers(items);
    } else {
      setPapers(prev => [...prev, ...items]);
    }
    setHasMore(items.length === PAGE_SIZE);
    setPage(currentPage + 1);
    setLoading(false);
  }, [profile, debouncedSearch, examType, yearFilter, semesterFilter, sortBy, page]);

  useEffect(() => {
    if (profile?.status === "active") void fetchPapers(true);
  }, [profile, debouncedSearch, examType, yearFilter, semesterFilter, sortBy]);

  const loadMore = () => {
    if (!loading && hasMore) fetchPapers();
  };

  const handleDownload = async (id: string, url: string, currentCount: number) => {
    window.open(url, "_blank");
    // Optimistic UI update
    setPapers(c => c.map(p => p.id === id ? { ...p, download_count: (currentCount || 0) + 1 } : p));
    // Atomic server-side increment — prevents race conditions with concurrent downloads
    const { data: newCount } = await supabase.rpc("increment_download_count", { p_table: "exam_papers", p_id: id });
    if (typeof newCount === "number") {
      setPapers(c => c.map(p => p.id === id ? { ...p, download_count: newCount } : p));
    }
  };

  const processed = papers;

  const trendingPapers = useMemo(() => [...papers].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5), [papers]);

  const subjectCounts = useMemo(() => {
    const counts = new Map<string, { count: number; downloads: number }>();
    papers.forEach(p => {
      const existing = counts.get(p.subject) || { count: 0, downloads: 0 };
      counts.set(p.subject, { count: existing.count + 1, downloads: existing.downloads + (p.download_count || 0) });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  }, [papers]);

  const hasActiveFilters = examType !== "All" || debouncedSearch || yearFilter || semesterFilter;

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Exam Archive locked" description="Only active users can access archived papers." />;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <BookOpen className="text-[var(--accent)]" size={32} /> Digital Library
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {papers.length} papers · {papers.reduce((a, p) => a + (p.download_count || 0), 0).toLocaleString()} total downloads
          </p>
        </div>
        <button onClick={() => setShowUploadModal(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black hover:bg-[#bce600] active:scale-[0.97] shadow-[0_0_20px_rgba(188,230,0,0.25)]">
          <Upload size={18} /> Contribute Paper
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by subject, course code, or faculty…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
          </div>
          <div className="flex gap-2 shrink-0">
            <select value={yearFilter ?? ""} onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer">
              <option value="">All Years</option>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={semesterFilter ?? ""} onChange={(e) => setSemesterFilter(e.target.value || null)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer">
              <option value="">All Semesters</option>
              <option value="Odd">Odd</option>
              <option value="Even">Even</option>
            </select>
            <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-2">
              <SortDesc size={14} className="text-[var(--muted)]" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                <option className="bg-[var(--surface)]">Newest</option>
                <option className="bg-[var(--surface)]">Oldest</option>
                <option className="bg-[var(--surface)]">Most Downloaded</option>
                <option className="bg-[var(--surface)]">Recently Updated</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 bg-[var(--surface)] rounded-lg p-1 border border-[var(--border)] w-fit">
          {examTypes.map((item) => (
            <button key={item} onClick={() => setExamType(item)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${examType === item ? "bg-[var(--accent)] text-black shadow-sm" : "text-[var(--muted)] hover:text-white hover:bg-[var(--surface-soft)]"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <InlineAlert tone="error" message={error} />

      {loading ? <LoadingCard title="Loading library…" /> : papers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-soft)] ring-8 ring-[var(--background)]"><BookOpen size={40} className="text-[var(--muted)]" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">The Archive is Empty</h2>
          <p className="text-[var(--muted)] max-w-lg mx-auto mb-8">Our digital library relies on student contributions. Be the first to upload previous semester papers!</p>
          <button onClick={() => setShowUploadModal(true)} className="rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-black hover:bg-[#bce600]">Upload the First Paper</button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main Library Grid */}
          <div className="flex flex-col gap-4 min-w-0">
            {/* Results Count Bar */}
            <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)]">
              <span>{processed.length} {processed.length === 1 ? "paper" : "papers"} found{hasActiveFilters ? " (filtered)" : ""}</span>
              {hasActiveFilters && (
                <button onClick={() => { setExamType("All"); setSearch(""); setYearFilter(null); setSemesterFilter(null); }}
                  className="text-[var(--accent)] hover:text-[#bce600]">Clear filters</button>
              )}
            </div>

            {processed.length === 0 ? (
              <EmptyState title="No papers match your filters" description="Try clearing your search query or changing the filters." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {processed.map((paper) => (
                  <article key={paper.id} onClick={() => setSelectedPaper(paper)}
                    className={cn("group relative flex flex-col cursor-pointer rounded-xl border bg-[var(--surface)] p-3.5 transition-all hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5",
                      paper.status === "deleted" ? "border-red-500/20 opacity-60" : "border-[var(--border)]")}>
                    {/* Top Row: Title + Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors" title={paper.subject}>{paper.subject}</h3>
                        {paper.course_code && <p className="text-[10px] font-mono font-bold text-[var(--accent)] mt-0.5">{paper.course_code}</p>}
                      </div>
                      <PaperActions paper={paper} profile={profile}
                        onEdit={() => setEditingPaper(paper)} onReplace={() => setReplacingPaper(paper)}
                        onDelete={() => setDeletingPaper({ paper, isRestore: false })} onRestore={() => setDeletingPaper({ paper, isRestore: true })} />
                    </div>

                    {/* Badge Row */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        paper.exam_type === "End Sem" ? "bg-red-500/10 text-red-400" :
                        paper.exam_type === "Mid Sem" ? "bg-amber-500/10 text-amber-400" :
                        paper.exam_type === "Quiz" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                      )}>{paper.exam_type}</span>
                      <span className="text-[10px] font-bold text-[var(--muted)]">{paper.year}</span>
                      <span className="text-[10px] text-[var(--muted)]">{paper.semester}</span>
                      {paper.status === "deleted" && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">DEL</span>}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-[10px] text-[var(--muted)] bg-[var(--background)] rounded-lg p-2.5 mb-3">
                      {paper.faculty && <div className="flex items-center justify-between"><span>Faculty</span><span className="font-bold text-white truncate ml-2">{paper.faculty}</span></div>}
                      <div className="flex items-center justify-between"><span>Uploaded by</span><span className="font-bold text-white truncate ml-2">{(paper as any).uploader_name || "Unknown"}</span></div>
                      <div className="flex items-center justify-between"><span>Last Updated</span><span className="font-bold text-white">{shortDate(paper.updated_at || paper.created_at)}</span></div>
                      <div className="flex items-center justify-between border-t border-[var(--border)] pt-1.5 mt-1"><span>Version</span><span className="font-bold text-[var(--accent)]">{paper.version || "v1.0"}</span></div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--muted)]">
                        <span className="flex items-center gap-1"><Download size={10} className="text-emerald-400" />{paper.download_count || 0}</span>
                        <span>{formatBytes(paper.file_size)}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(paper.id, paper.file_url, paper.download_count || 0); }}
                        disabled={paper.status === "deleted"}
                        className="flex items-center gap-1 rounded-md bg-[var(--surface-soft)] px-2 py-1 text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all disabled:opacity-50">
                        <Download size={10} /> Get
                      </button>
                    </div>
                  </article>
                ))}
                {processed.length > 0 && hasMore && (
                  <div className="col-span-full flex justify-center mt-4">
                    <button onClick={loadMore} disabled={loading} className="px-6 py-2 rounded-xl border border-[var(--border)] text-sm font-bold text-white hover:bg-[var(--surface-soft)]">
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Trending */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <TrendingUp size={14} className="text-emerald-400" /> Trending This Week
              </h3>
              <div className="space-y-3">
                {trendingPapers.map((paper, i) => (
                  <div key={`tr-${paper.id}`} className="group flex items-start gap-2.5 cursor-pointer" onClick={() => setSelectedPaper(paper)}>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--surface-soft)] text-[10px] font-bold text-[var(--muted)]">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)] transition-colors">{paper.subject}</p>
                      <p className="text-[10px] text-[var(--muted)]">{paper.exam_type} · {paper.year}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 shrink-0"><Download size={10} />{paper.download_count || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Stats */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <Folder size={14} className="text-blue-400" /> Subjects
              </h3>
              <div className="space-y-1.5">
                {subjectCounts.map(([sub, stats]) => (
                  <button key={sub} onClick={() => { setSearch(sub); setExamType("All"); }}
                    className="group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-soft)]">
                    <span className="truncate text-xs font-medium text-[var(--muted)] group-hover:text-white pr-2">{sub}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted)]">{stats.count}</span>
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5"><Download size={8} />{stats.downloads}</span>
                    </div>
                  </button>
                ))}
                {subjectCounts.length === 0 && <p className="text-xs text-[var(--muted)] text-center py-4">No papers uploaded yet</p>}
              </div>
            </div>

            {/* Quick Subjects */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <GraduationCap size={14} className="text-[var(--accent)]" /> Browse by Course
              </h3>
              <div className="flex flex-col gap-1">
                {HARDCODED_SUBJECTS.map(sub => (
                  <button key={sub.name} onClick={() => { setSearch(sub.name); setExamType("All"); }}
                    className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-soft)]">
                    <span className="truncate text-xs font-medium text-[var(--muted)] group-hover:text-white">{sub.name}</span>
                    <span className="text-[9px] font-mono text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">{sub.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Detail Side Panel */}
      {selectedPaper && (
        <DetailPanel paper={selectedPaper} profile={profile} onClose={() => setSelectedPaper(null)}
          onDownload={handleDownload}
          onEdit={() => { setEditingPaper(selectedPaper); setSelectedPaper(null); }}
          onReplace={() => { setReplacingPaper(selectedPaper); setSelectedPaper(null); }}
          onDelete={() => { setDeletingPaper({ paper: selectedPaper, isRestore: false }); setSelectedPaper(null); }}
          onRestore={() => { setDeletingPaper({ paper: selectedPaper, isRestore: true }); setSelectedPaper(null); }}
        />
      )}

      {/* Modals */}
      {showUploadModal && <UploadModal uploaderId={profile.id} onClose={() => setShowUploadModal(false)} onSuccess={() => fetchPapers(true)} />}
      {editingPaper && <EditPaperModal paper={editingPaper} onClose={() => setEditingPaper(null)} onSuccess={() => { setEditingPaper(null); fetchPapers(true); }} />}
      {replacingPaper && <ReplacePaperModal paper={replacingPaper} onClose={() => setReplacingPaper(null)} onSuccess={() => { setReplacingPaper(null); fetchPapers(true); }} />}
      {deletingPaper && <DeletePaperModal paper={deletingPaper.paper} isRestore={deletingPaper.isRestore} onClose={() => setDeletingPaper(null)} onSuccess={() => { setDeletingPaper(null); fetchPapers(true); }} />}
    </div>
  );
}
