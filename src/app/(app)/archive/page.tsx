"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ExamPaper } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const filters = ["All", "End Sem", "Mid Sem", "Quiz", "Lab Exam"] as const;
const supabase = createClientComponentClient();

export default function ExamArchivePage() {
  const { profile } = useAuth();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [examType, setExamType] = useState<(typeof filters)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const load = async () => {
      const { data, error: fetchError } = await supabase.from<ExamPaper>("exam_papers").select("*").order("created_at", { ascending: false });
      if (fetchError) setError(fetchError.message);
      setPapers(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    void load();
  }, [profile]);

  const filtered = useMemo(() => papers.filter((paper) => examType === "All" || paper.exam_type === examType), [examType, papers]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Exam Archive locked" description="Only active users can access archived papers." />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Exam Archive" description="Historic papers are now read from Supabase tables and storage-backed file URLs." profile={profile} action={profile.role === "admin" ? <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-violet-700 active:scale-[0.97]"><Upload size={16} /> Upload<input type="file" className="hidden" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file || !profile) return;
        setUploading(true);
        setError(null);
        const path = `${Date.now()}-${file.name}`;
        const upload = await supabase.storage.from("exam-archive").upload(path, file);
        if (upload.error) {
          setError(upload.error.message);
          setUploading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from("exam-archive").getPublicUrl(path);
        const { data, error: insertError } = await supabase.from<ExamPaper>("exam_papers").insert({
          subject: file.name.replace(/\.[^.]+$/, ""),
          exam_type: "End Sem",
          year: new Date().getFullYear(),
          semester: "Odd",
          file_url: publicUrlData.publicUrl,
          uploaded_by: profile.id,
        });
        if (insertError) {
          setError(insertError.message);
        } else {
          const inserted = Array.isArray(data) ? data[0] : null;
          if (inserted) setPapers((current) => [inserted as ExamPaper, ...current]);
        }
        setUploading(false);
      }} /></label> : undefined} />

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm">
        {filters.map((item) => (
          <button key={item} onClick={() => setExamType(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${examType === item ? "bg-purple-600 text-white shadow-md shadow-purple-600/25" : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"}`}>
            {item}
          </button>
        ))}
      </div>

      <InlineAlert tone={uploading ? "info" : "error"} message={uploading ? "Uploading paper to Supabase Storage..." : error} />

      {loading ? <LoadingCard title="Loading papers..." /> : null}
      {!loading && !filtered.length ? <EmptyState title="No papers available" description="Upload an archive item or switch the active exam type filter." /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((paper) => (
          <article key={paper.id} className="group animate-fade-in rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/50 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-purple-950/10">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">{paper.exam_type}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{paper.subject}</h3>
              </div>
              <span className="rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-semibold text-slate-400">{paper.semester} {paper.year}</span>
            </div>
            <p className="mb-4 text-sm text-slate-400">Uploaded {formatDateTime(paper.created_at)}</p>
            <a href={paper.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition-all hover:bg-purple-500/20">
              <Eye size={16} /> View Paper
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
