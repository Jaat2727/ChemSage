import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const pageName = slug.join(" ").replace(/-/g, " ");

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h2 className="font-mono text-3xl font-bold capitalize text-white">{pageName}</h2>
        <p className="mt-3 text-[var(--muted)]">This route is still available as a placeholder. The primary portal pages are now wired to Supabase-backed flows.</p>
        <Link href="/" className="mt-6 inline-flex border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 font-mono text-sm font-bold text-black">backToDashboard()</Link>
      </div>
    </div>
  );
}
