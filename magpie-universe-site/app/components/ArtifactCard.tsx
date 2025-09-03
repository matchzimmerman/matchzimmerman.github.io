'use client';

import Link from "next/link";
import { useState } from "react";
import MediaModal from "@/app/components/MediaModal";

export default function ArtifactCard({
  slug, title, type, src, caption
}: {
  slug: string; title: string; type: string; src: string; caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const isImage = type === "image";
  return (
    <div className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl panel">
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          onClick={()=> isImage ? setOpen(true) : null}
          role={isImage ? "button" : undefined}
        />
        <div className="absolute left-2 top-2 text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-black/60 border border-white/10">{type}</div>
      </div>
      <div className="mt-2">
        <Link href={`/artifacts/${slug}`} className="text-base font-medium hover:underline">{title}</Link>
        {caption && <p className="text-sm opacity-80 line-clamp-2">{caption}</p>}
      </div>
      <MediaModal open={open} onClose={()=>setOpen(false)} src={src} alt={title} />
    </div>
  );
}
