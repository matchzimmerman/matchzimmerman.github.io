'use client';

import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <section className="mb-12 text-center">
        <div className="relative w-full h-64 sm:h-80 md:h-96 mb-6 rounded-2xl overflow-hidden shadow-soft">
          <Image
            src="public/media/FS Mapgie Images/Magpie Signal Code Printout.png" 
            alt="Field Station: Magpie signal discovery"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        <h1 className="text-4xl font-semibold mb-4 text-rust-900">
          Field Station: Magpie
        </h1>
        <p className="text-left leading-relaxed max-w-2xl mx-auto text-rust-800">
          <span className="font-semibold">Project: Magpie</span> is a fictional world and
          research lab — built with generative AI and unfolding in real time.
          This site serves as both an archive and a narrative experiment:
          artifacts, signals, and field reports are recovered and catalogued
          as if discovered within a living, breathing universe. 
          <br /><br />
          Every visual, sound, and interactive element is part of the story and
          part of the research — a recursive human–AI collaboration that explores
          how worlds are built, stories evolve, and systems align.
        </p>
      </section>

      <section className="text-left">
        <p className="text-rust-700 mb-6">
          Explore the visuals, read the canon, or interact with live systems.
        </p>
        <Link
          href="/visuals"
          className="inline-block rounded-xl bg-rust-500 text-white px-6 py-3 font-medium shadow hover:bg-rust-600 transition"
        >
          View Visual Archive →
        </Link>
      </section>
    </main>
  );
}
