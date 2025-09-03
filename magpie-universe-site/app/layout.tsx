import "./globals.css";
import type { Metadata } from "next";
import Header from "@/app/components/Header";
import ConstellationBg from "@/app/components/ConstellationBg";

export const metadata: Metadata = {
  title: "Project: Magpie — Field Station",
  description: "A fictional world and research lab — built with AI, unfolding in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="scanlines antialiased">
        <ConstellationBg />
        <Header />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}
