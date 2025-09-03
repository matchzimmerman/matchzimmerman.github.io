import ArtifactCard from "@/app/components/ArtifactCard";

export default function ArtifactGrid({ items }: { items: any[] }){
  return (
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <ArtifactCard key={a.slug} {...a} />
      ))}
    </section>
  );
}
