'use client';

import artifacts from "../data/artifacts.json";
import { useMemo, useState } from "react";
import ArtifactGrid from "@/app/components/ArtifactGrid";
import Filters from "@/app/components/Filters";

export default function ArtifactsPage(){
  const [category, setCategory] = useState("all");
  const items = artifacts as any[];
  const filtered = useMemo(()=> category==="all" ? items : items.filter(i => i.category === category), [items, category]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Visuals</h1>
        <p className="opacity-80">This is an evolving archive of images, logs, guides, and in-world materials created for Match Zimmerman's human-ai world building project, "Field Station: Magpie." All outputs and artifacts are a result of a recursive human-AI creative process that is built around a custom HARIL Narrative Alignment Engine. This Engine serves as the projects canonical anchoring, allowing for a massive amount of outputs in different media, fields, genres, and styles while remaining aligned with the evolving, fictional world's canon.</p>
      </header>
      <Filters items={items} category={category} onChange={setCategory} />
      <div className="mt-6">
        <ArtifactGrid items={filtered} />
      </div>
    </main>
  );
}
