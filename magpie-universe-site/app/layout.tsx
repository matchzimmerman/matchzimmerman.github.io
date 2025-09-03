import "./globals.css";
import type { Metadata } from "next";
import Header from "@/app/components/Header";
import ConstellationBg from "@/app/components/ConstellationBg";
import { IBM_Plex_Mono } from "next/font/google";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300","400","500","700"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Project: Magpie — Field Station",
  description: "A fictional world and research lab — built with AI, unfolding in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`scanlines antialiased ${plexMono.variable} font-mono bg-rust-50 text-rust-900`}>
        <ConstellationBg />
        <Header />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}
