import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ParticleBackground } from "@/components/layout/ParticleBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yantra Nidhi | Engineering the Future",
  description: "A futuristic and modern multidisciplinary education platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col font-sans`}>
        <ParticleBackground />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
