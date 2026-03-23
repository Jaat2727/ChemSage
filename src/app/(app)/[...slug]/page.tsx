export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params;
  const pageName = slug.join(" ").replace(/-/g, " ");

  return (
    <div className="h-full w-full flex items-center justify-center">
      <h2 className="text-3xl font-bold text-slate-400 capitalize">{pageName}</h2>
    </div>
  );
}
