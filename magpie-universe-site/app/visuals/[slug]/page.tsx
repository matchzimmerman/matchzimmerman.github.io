import artifacts from "../../data/artifacts.json";
import { notFound } from "next/navigation";
import Link from "next/link";

export function generateStaticParams() {
  return (artifacts as any[]).map((a) => ({ slug: a.slug }));
}

export default function ArtifactDetail({ params }: { params: { slug: string } }){
  const items = artifacts as any[];
  const art = items.find(a => a.slug === params.slug);
  if(!art) return notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/artifacts" className="text-sm opacity-70 hover:opacity-100">← Back to Artifacts</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          <img src={art.src} alt={art.title} className="w-full h-auto" />
        </div>
        <aside>
          <h1 className="text-3xl font-semibold">{art.title}</h1>
          {art.caption && <p className="mt-2 opacity-80">{art.caption}</p>}
          <div className="mt-6 space-y-2 text-sm">
            <div><span className="opacity-60">Type:</span> {art.type}</div>
            {art.createdAt && <div><span className="opacity-60">Date:</span> {art.createdAt}</div>}
            {art.category && <div><span className="opacity-60">Category:</span> {art.category}</div>}
          </div>
        </aside>
      </div>
    </main>
  );
}
