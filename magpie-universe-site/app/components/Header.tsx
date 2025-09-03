import Link from "next/link";

export default function Header(){
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/30 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide">FS: MAGPIE</Link>
        <nav className="text-sm space-x-5 opacity-90">
          <Link href="/artifacts">Artifacts</Link>
          <Link href="/canon">Canon</Link>
          <Link href="/systems">Live Systems</Link>
          <Link href="/notes">Field Notes</Link>
        </nav>
      </div>
    </header>
  );
}
