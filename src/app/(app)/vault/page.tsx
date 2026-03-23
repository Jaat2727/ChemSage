"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, InlineAlert, LoadingCard, LockedScreen } from "@/components/ui/Feedback";
import { createClientComponentClient } from "@/lib/supabase";
import type { ResourceItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const categories = ["All", "Notes", "Lab Reports", "Assignments", "References"] as const;
const supabase = createClientComponentClient();

export default function StudyVaultPage() {
  const { profile } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.status !== "active") return;
    const load = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase.from<ResourceItem>("resources").select("*").order("created_at", { ascending: false });
      if (fetchError) setError(fetchError.message);
      setResources(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    void load();
  }, [profile]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const categoryMatches = category === "All" || resource.category === category;
      const searchMatches = resource.title.toLowerCase().includes(search.toLowerCase());
      return categoryMatches && searchMatches;
    });
  }, [category, resources, search]);

  if (!profile) return <LoadingCard />;
  if (profile.status !== "active") return <LockedScreen title="Study Vault locked" description="Only active users can browse the shared study vault." />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Study Vault" description="Browse live resources from Supabase Storage and filter them instantly on the client." profile={profile} action={profile.role === "admin" ? <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-600 hover:to-blue-700 active:scale-[0.97]"><Upload size={16} /> Upload<input type="file" className="hidden" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file || !profile) return;
        setUploading(true);
        setError(null);
        const path = `${Date.now()}-${file.name}`;
        const upload = await supabase.storage.from("study-vault").upload(path, file);
        if (upload.error) {
          setError(upload.error.message);
          setUploading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from("study-vault").getPublicUrl(path);
        const { data, error: insertError } = await supabase.from<ResourceItem>("resources").insert({
          title: file.name,
          category: "References",
          file_url: publicUrlData.publicUrl,
          file_type: file.type || "application/octet-stream",
          uploaded_by: profile.id,
        });
        if (insertError) {
          setError(insertError.message);
        } else {
          const inserted = Array.isArray(data) ? data[0] : null;
          if (inserted) setResources((current) => [inserted as ResourceItem, ...current]);
        }
        setUploading(false);
      }} /></label> : undefined} />

      <div className="mb-6 grid gap-4 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm md:grid-cols-[1fr_auto]">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources by title..." className="rounded-xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none ring-0 transition-all placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20" />
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${category === item ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <InlineAlert tone={uploading ? "info" : "error"} message={uploading ? "Uploading resource to Supabase Storage..." : error} />

      {loading ? <LoadingCard title="Loading resources..." /> : null}
      {!loading && !filteredResources.length ? <EmptyState title="No resources found" description="Try another search term or category, or upload the first file if you are an admin." /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredResources.map((resource) => (
          <article key={resource.id} className="group animate-fade-in rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/50 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-blue-950/10">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{resource.category}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{resource.title}</h3>
              </div>
              <span className="rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-semibold text-slate-400">{resource.file_type || "file"}</span>
            </div>
            <p className="mb-4 text-sm text-slate-400">Uploaded {formatDateTime(resource.created_at)}</p>
            <a href={resource.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20">
              <Download size={16} /> Download
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
