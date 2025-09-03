import Link from "next/link";

export default function Header(){
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-rust-50/40 bg-rust-50/30 border-b border-rust-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide">Field Station: MAGPIE</Link>
        <nav className="text-sm space-x-5 opacity-90">
          <Link href="/about">About</Link>
          <Link href="/visuals">Visuals</Link>
          <Link href="/canon">Canon</Link>
          <Link href="/systems">Live Systems</Link>
          <Link href="/logs">Field Logs</Link>
        </nav>
      </div>
    </header>
  );
}
