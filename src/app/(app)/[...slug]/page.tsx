import Link from "next/link";

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const pageName = slug.join(" ").replace(/-/g, " ");

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <h2 className="text-3xl font-bold capitalize text-white">{pageName}</h2>
        <p className="mt-3 text-slate-400">This route is still available as a placeholder. The primary portal pages are now wired to Supabase-backed flows.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
      </div>
    </div>
  );
}
