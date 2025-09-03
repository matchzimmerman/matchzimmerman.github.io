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
        <h1 className="text-3xl font-semibold">Artifacts</h1>
        <p className="opacity-80">Images, logs, guides, and in-world materials recovered from the Magpie field stations.</p>
      </header>
      <Filters items={items} category={category} onChange={setCategory} />
      <div className="mt-6">
        <ArtifactGrid items={filtered} />
      </div>
    </main>
  );
}
