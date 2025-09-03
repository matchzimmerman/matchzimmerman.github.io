'use client';

import artifacts from "@/app/data/artifacts.json";
import { useMemo, useState } from "react";
import ArtifactGrid from "@/app/components/ArtifactGrid";
import Filters from "@/app/components/Filters";

export default function HomePage(){
  const [category, setCategory] = useState("all");
  const items = artifacts as any[];

  const filtered = useMemo(()=>{
    return category==="all" ? items : items.filter(i => i.category === category);
  }, [items, category]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-10">
        <h1 className="text-4xl font-semibold">Project: Magpie — Field Station</h1>
        <p className="mt-2 max-w-2xl text-white/80">
          Signals recovered from distributed nodes. Explore artifacts, read the canon, or interact with live systems.
        </p>
        <div className="mt-6">
          <Filters items={items} category={category} onChange={setCategory} />
        </div>
      </section>
      <ArtifactGrid items={filtered} />
    </main>
  );
}
