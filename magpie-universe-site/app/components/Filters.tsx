'use client';

import { useMemo } from "react";

export default function Filters({
  items,
  category,
  onChange
}: {
  items: { category: string }[];
  category: string;
  onChange: (cat: string) => void;
}){
  const cats = useMemo(()=>{
    const set = new Set(items.map(i => i.category));
    return ["all", ...Array.from(set).sort()];
  }, [items]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {cats.map(cat => (
        <button
          key={cat}
          onClick={()=>onChange(cat)}
          className={`px-3 py-1.5 rounded-full border text-sm transition ${
            category===cat ? "bg-white text-black border-white" : "border-white/20 hover:bg-white/10"
          }`}
        >
          {cat.replace(/-/g," ")}
        </button>
      ))}
    </div>
  );
}
