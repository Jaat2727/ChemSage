"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Upload, FileText, X, CheckCircle2, AlertCircle, Search, Download, BookOpen, Clock, TrendingUp, Filter, Folder, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ExamPaper } from "@/lib/types";
import { formatDateTime, cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const examTypes = ["All", "End Sem", "Mid Sem", "Quiz", "Lab Exam"] as const;
const uploadExamTypes = ["End Sem", "Mid Sem", "Quiz", "Lab Exam"] as const;
type ExamTypeFilter = (typeof examTypes)[number];
type UploadExamType = (typeof uploadExamTypes)[number];

const SEMESTERS = ["Odd", "Even"] as const;
const MAX_FILE_SIZE_MB = 50;
const supabase = createClientComponentClient();

async function fetchPapers() {
  const { data, error } = await supabase
    .from("exam_papers")
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
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState<UploadExamType>("End Sem");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState<"Odd" | "Even">("Odd");
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
    setSubject(picked.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  };

  const handleUpload = useCallback(async () => {
    if (!file || !subject.trim()) { setError("Please select a file and enter a subject."); return; }
    setUploading(true);
    setError(null);
    setProgress(10);

    const path = `${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("exam-archive").upload(path, file);
    if (upload.error) { setError(upload.error.message); setUploading(false); setProgress(0); return; }
    setProgress(55);

    const { data: publicUrlData } = supabase.storage.from("exam-archive").getPublicUrl(path);
    setProgress(70);

    const { error: insertError } = await supabase.from("exam_papers").insert({
      subject: subject.trim(),
      exam_type: examType,
      year,
      semester,
      file_url: publicUrlData.publicUrl,
      file_size: file.size,
      uploaded_by: uploaderId,
      download_count: 0
    });

    if (insertError) { setError(insertError.message); setUploading(false); setProgress(0); return; }
    setProgress(100);
    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1200);
  }, [file, subject, examType, year, semester, uploaderId, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Upload size={20} className="text-[var(--accent)]" /> Upload to Archive</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`mb-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 transition-all ${
            file ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]"
          }`}
        >
          {file ? (
            <>
              <FileText size={30} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-white truncate max-w-full px-4">{file.name}</p>
              <p className="text-xs text-[var(--muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <Upload size={30} className="text-[var(--muted)]" />
              <p className="text-sm font-medium text-[var(--muted)]">Drop file here or <span className="text-[var(--accent)]">browse</span></p>
              <p className="text-xs text-[var(--muted)]">PDF / Images · Max {MAX_FILE_SIZE_MB} MB</p>
            </>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Subject Name</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Data Structures"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none placeholder:text-[var(--muted)] transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Exam Category</label>
          <div className="flex flex-wrap gap-2">
            {uploadExamTypes.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => setExamType(et)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                  examType === et ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-soft)] text-[var(--muted)] hover:bg-[var(--surface)]"
                }`}
              >
                {et}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Year</label>
            <input
              type="number"
              value={year}
              min={2000}
              max={new Date().getFullYear()}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Semester</label>
            <div className="flex h-[42px] overflow-hidden rounded-lg border border-[var(--border)]">
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className={`flex-1 text-sm font-semibold transition-all ${
                    semester === s ? "bg-[var(--accent)] text-black" : "bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
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
            <CheckCircle2 size={16} /> Paper uploaded successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)]">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex-1 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-[#bce600] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            {uploading ? "Uploading…" : "Upload to Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
}

// ─── Paper Card Component ──────────────────────────────────────────────────
function PaperCard({ paper, onDownload }: { paper: ExamPaper, onDownload: (id: string, url: string, currentCount: number) => void }) {
  const isImage = paper.file_url.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i);
  
  return (
    <article className="group flex animate-fade-in flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-xl active:scale-[0.99]">
      {isImage ? (
        <div className="relative h-32 w-full shrink-0 overflow-hidden border-b border-[var(--border)] bg-[var(--background)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={paper.file_url} alt={paper.subject} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent opacity-60" />
        </div>
      ) : (
        <div className="h-2 w-full bg-gradient-to-r from-[var(--accent)] to-blue-500" />
      )}
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={cn(
              "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              paper.exam_type === "End Sem" ? "bg-red-500/10 text-red-400" :
              paper.exam_type === "Mid Sem" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
            )}>
              {paper.exam_type}
            </span>
            <h3 className="mt-2.5 truncate text-lg font-bold text-white group-hover:text-[var(--accent)] transition-colors" title={paper.subject}>{paper.subject}</h3>
          </div>
        </div>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
            <div className="flex items-center gap-1.5"><Folder size={12} /> {paper.semester} {paper.year}</div>
            {paper.file_size && <div className="flex items-center gap-1.5"><FileText size={12} /> {formatBytes(paper.file_size)}</div>}
          </div>
          
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
            <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(paper.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
            <div className="flex items-center gap-1.5 text-emerald-400"><Download size={12} /> {paper.download_count || 0}</div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-[var(--border)] p-3 flex gap-2 bg-[var(--background)]/50">
        <button
          onClick={() => onDownload(paper.id, paper.file_url, paper.download_count || 0)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--surface)] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[var(--accent)] hover:text-black"
        >
          <Download size={14} /> Download
        </button>
      </div>
    </article>
  );
}


// ─── Page ────────────────────────────────────────────────────────────────────
export default function ExamArchivePage() {
  const { profile } = useAuth();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [examType, setExamType] = useState<ExamTypeFilter>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await fetchPapers();
    if (e) setError(e.message);
    setPapers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    void load();
  }, [profile, load]);

  const handleDownload = async (id: string, url: string, currentCount: number) => {
    // Open in new tab immediately
    window.open(url, "_blank");
    // Increment tracking count silently
    const newCount = currentCount + 1;
    setPapers(current => current.map(p => p.id === id ? { ...p, download_count: newCount } : p));
    await supabase.from("exam_papers").update({ download_count: newCount }).eq("id", id);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return papers.filter((p) => {
      const typeMatch = examType === "All" || p.exam_type === examType;
      const searchMatch = !q || p.subject.toLowerCase().includes(q) || p.exam_type.toLowerCase().includes(q);
      return typeMatch && searchMatch;
    });
  }, [papers, examType, search]);

  const popularPapers = useMemo(() => {
    return [...papers].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 4);
  }, [papers]);

  const recentPapers = useMemo(() => {
    return [...papers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
  }, [papers]);
  
  const subjects = useMemo(() => {
    const subs = new Set<string>();
    papers.forEach(p => subs.add(p.subject));
    return Array.from(subs).slice(0, 8);
  }, [papers]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Exam Archive locked" description="Only active users can access archived papers." />;

  return (
    <div className="mx-auto max-w-7xl pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <BookOpen className="text-[var(--accent)]" size={32} /> Digital Library
          </h1>
          <p className="mt-2 text-[var(--muted)]">Browse, download, and contribute to the university's past paper archive.</p>
        </div>
        {profile.status === "active" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black transition-all hover:bg-[#bce600] active:scale-[0.97] shadow-[0_0_20px_rgba(188,230,0,0.25)]"
          >
            <Upload size={18} /> Contribute Paper
          </button>
        )}
      </div>

      <InlineAlert tone="error" message={error} />

      {loading ? (
        <LoadingCard title="Loading library…" />
      ) : papers.length === 0 ? (
        /* Rich Empty State */
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-soft)] ring-8 ring-[var(--background)]">
            <BookOpen size={40} className="text-[var(--muted)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">The Archive is Empty</h2>
          <p className="text-[var(--muted)] max-w-lg mx-auto mb-8">
            Our digital library relies on student contributions. Be the first to upload previous semester papers to help your classmates prepare!
          </p>
          
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left mb-8">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <Upload className="text-[var(--accent)] mb-3" size={24} />
              <h3 className="font-bold text-white mb-1">1. Upload PDF or Image</h3>
              <p className="text-xs text-[var(--muted)]">Scan or download past papers (Max 50MB).</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <Filter className="text-blue-400 mb-3" size={24} />
              <h3 className="font-bold text-white mb-1">2. Categorize</h3>
              <p className="text-xs text-[var(--muted)]">Tag it by subject, year, and exam type.</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <TrendingUp className="text-emerald-400 mb-3" size={24} />
              <h3 className="font-bold text-white mb-1">3. Help Classmates</h3>
              <p className="text-xs text-[var(--muted)]">Earn points when others download your paper.</p>
            </div>
          </div>
          
          <button onClick={() => setShowModal(true)} className="rounded-lg bg-[var(--surface-soft)] px-6 py-3 font-bold text-white transition hover:bg-[var(--border)]">
            Upload the First Paper
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Library Area */}
          <div className="flex flex-col gap-8">
            
            {/* Search + Filters Area */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search papers by subject or topic…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2.5 pl-11 pr-4 text-sm font-medium text-white outline-none ring-0 transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex flex-wrap gap-2 shrink-0 bg-[var(--background)] rounded-lg p-1 border border-[var(--border)]">
                {examTypes.map((item) => (
                  <button
                    key={item}
                    onClick={() => setExamType(item)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                      examType === item ? "bg-[var(--surface-soft)] text-white" : "text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div>
              {(search || examType !== "All") && (
                <div className="mb-4 text-sm font-bold text-[var(--muted)]">
                  Found {filtered.length} results
                </div>
              )}
              
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} onDownload={handleDownload} />
                ))}
              </div>
              
              {!filtered.length && (
                <EmptyState
                  title="No papers found matching filters"
                  description="Try clearing your search query or changing the exam type filter."
                />
              )}
            </div>
            
            {/* Sections (Hidden if searching heavily) */}
            {!search && examType === "All" && (
              <>
                <div className="mt-8 border-t border-[var(--border)] pt-8">
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                    <Clock size={18} className="text-[var(--accent)]" /> Recently Uploaded
                  </h2>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {recentPapers.map(paper => <PaperCard key={`recent-${paper.id}`} paper={paper} onDownload={handleDownload} />)}
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Right Sidebar */}
          <aside className="flex flex-col gap-6">
            
            {/* Trending / Popular */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                <TrendingUp size={16} className="text-emerald-400" /> Popular Papers
              </h3>
              <div className="space-y-4">
                {popularPapers.map(paper => (
                  <div key={`pop-${paper.id}`} className="group flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors cursor-pointer" onClick={() => handleDownload(paper.id, paper.file_url, paper.download_count || 0)}>{paper.subject}</p>
                      <p className="text-xs text-[var(--muted)]">{paper.exam_type} {paper.year}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded bg-[var(--surface-soft)] px-2 py-1 text-xs font-bold text-emerald-400">
                      <Download size={10} /> {paper.download_count || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Categories */}
            {subjects.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                  <Folder size={16} className="text-blue-400" /> Browse by Subject
                </h3>
                <div className="flex flex-col gap-2">
                  {subjects.map(sub => (
                    <button key={sub} onClick={() => { setSearch(sub); setExamType("All"); }} className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-white text-left">
                      <span className="truncate pr-4">{sub}</span>
                      <ArrowRight size={14} className="opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 text-[var(--accent)] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>
      )}

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
