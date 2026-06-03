"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Upload, FileText, X, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ExamPaper } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
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
    });

    if (insertError) { setError(insertError.message); setUploading(false); setProgress(0); return; }
    setProgress(100);
    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1200);
  }, [file, subject, examType, year, semester, uploaderId, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 ">
      <div className="relative w-full max-w-md animate-scale-in  border border-[var(--border)] bg-[var(--surface)] p-7 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Upload Exam Paper</h2>
          <button onClick={onClose} className=" p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`mb-5 flex cursor-pointer flex-col items-center gap-2  border-2 border-dashed px-6 py-7 transition-all ${
            file ? "border-purple-500/50 bg-purple-500/5" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
          }`}
        >
          {file ? (
            <>
              <FileText size={30} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-white">{file.name}</p>
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

        {/* Subject */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Physical Chemistry"
            className="w-full  border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
        </div>

        {/* Exam Type */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Exam Type</label>
          <div className="flex flex-wrap gap-2">
            {uploadExamTypes.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => setExamType(et)}
                className={` px-3.5 py-1.5 text-sm font-semibold transition-all ${
                  examType === et ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                {et}
              </button>
            ))}
          </div>
        </div>

        {/* Year & Semester */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Year</label>
            <input
              type="number"
              value={year}
              min={2000}
              max={new Date().getFullYear()}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full  border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-white outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Semester</label>
            <div className="flex h-[46px] overflow-hidden  border border-[var(--border)]">
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className={`flex-1 text-sm font-semibold transition-all ${
                    semester === s ? "bg-[var(--accent)] text-white" : "bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs text-[var(--muted)]">
              <span>{success ? "Upload complete!" : "Uploading…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden  bg-[var(--surface)]">
              <div
                className="h-full  bg-[var(--accent)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2  bg-emerald-950/40 border border-emerald-800 px-4 py-2.5 text-sm font-medium text-emerald-400">
            <CheckCircle2 size={16} /> Paper uploaded successfully!
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2  bg-red-950/40 border border-red-800 px-4 py-2.5 text-sm font-medium text-red-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1  border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)]">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="flex-1  border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white  transition-all hover:from-purple-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
          >
            {uploading ? "Uploading…" : "Upload"}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [profile, load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return papers.filter((p) => {
      const typeMatch = examType === "All" || p.exam_type === examType;
      const searchMatch = !q || p.subject.toLowerCase().includes(q) || p.exam_type.toLowerCase().includes(q);
      return typeMatch && searchMatch;
    });
  }, [papers, examType, search]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Exam Archive locked" description="Only active users can access archived papers." />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Exam Archive"
        description="Browse past exam papers. Admins can upload new papers with full metadata."
        profile={profile}
        action={
          profile.status === "active" ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex cursor-pointer items-center gap-2  border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white  transition-all hover:from-purple-600 hover:to-violet-700 active:scale-[0.97]"
            >
              <Upload size={16} /> Upload
            </button>
          ) : undefined
        }
      />

      {/* Search + Filters */}
      <div className="mb-6 grid gap-4  border border-[var(--border)] bg-[var(--surface)] p-5  md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject or exam type…"
            className="w-full  border border-[var(--border)] bg-[var(--background)] py-3 pl-10 pr-4 text-sm text-white outline-none ring-0 transition-all placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {examTypes.map((item) => (
            <button
              key={item}
              onClick={() => setExamType(item)}
              className={` px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                examType === item ? "bg-[var(--accent)] text-white " : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-soft)]/60"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <InlineAlert tone="error" message={error} />

      {loading ? <LoadingCard title="Loading papers…" /> : null}
      {!loading && !filtered.length ? (
        <EmptyState
          title="No papers found"
          description={
            search || examType !== "All"
              ? "Try a different search term or exam type filter."
              : profile.role === "admin"
              ? "Click Upload to add the first exam paper."
              : "No exam papers have been uploaded yet."
          }
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((paper) => (
          <article
            key={paper.id}
            className="group animate-fade-in flex flex-col overflow-hidden  border border-[var(--border)] bg-[var(--surface)]  transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border)]/50 hover:bg-[var(--surface)]/60 hover:shadow-lg hover:shadow-purple-950/10"
          >
            {paper.file_url.match(/\.(jpg|jpeg|png|webp|gif|avif)$/i) ? (
              <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-[var(--border)] bg-[var(--background)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paper.file_url} alt={paper.subject} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className=" bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">{paper.exam_type}</span>
                  <h3 className="mt-2.5 truncate text-base font-semibold text-white" title={paper.subject}>{paper.subject}</h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className=" bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold text-[var(--muted)]">
                    {paper.semester} {paper.year}
                  </span>
                  {paper.file_size ? <span className="text-[10px] font-medium text-[var(--muted)]">{formatBytes(paper.file_size)}</span> : null}
                </div>
              </div>
              <p className="mt-auto mb-4 text-xs text-[var(--muted)]">Uploaded {formatDateTime(paper.created_at)}</p>
            <a
              href={paper.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2  bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-purple-500/20"
            >
              <Eye size={15} /> View Paper
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
