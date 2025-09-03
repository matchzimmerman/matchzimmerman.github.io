import "./globals.css";
import type { Metadata } from "next";
-import ConstellationBg from "@/app/components/ConstellationBg";
+import StaticGlitchBg from "@/app/components/StaticGlitchBg";
+import { IBM_Plex_Mono } from "next/font/google";

+const plexMono = IBM_Plex_Mono({
+  subsets: ["latin"],
+  weight: ["300","400","500","700"],
+  variable: "--font-plex-mono",
+});

export const metadata: Metadata = {
  title: "Project: Magpie — Field Station",
  description: "A fictional world and research lab — built with AI, unfolding in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
-      <body className="scanlines antialiased">
-        <ConstellationBg />
+      <body className={`${plexMono.variable} font-mono antialiased bg-paper-100 text-rust-900`}>
+        <StaticGlitchBg />
         {children}
       </body>
    </html>
  );
}
