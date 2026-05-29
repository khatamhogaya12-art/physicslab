"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full glass border-b-0 shadow-none backdrop-blur-3xl bg-black/40 px-4 md:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-black/90 border-white/10 glass-card">
            <div className="py-6 flex flex-col gap-4">
              <span className="font-bold text-2xl text-white neon-text-cyan px-4">Yantra Nidhi</span>
              <nav className="flex flex-col gap-2 mt-4 px-2">
                {[
                  { name: "Home", href: "/" },
                  { name: "About", href: "/about" },
                  { name: "Virtual Labs", href: "/labs" },
                  { name: "AI Dashboard", href: "/dashboard" },
                  { name: "Research", href: "/research" },
                  { name: "Analytics", href: "/analytics" },
                  { name: "Contact", href: "/contact" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`p-3 rounded-xl transition-all ${
                      pathname === item.href
                        ? "bg-blue-900/40 border border-blue-500/50 text-cyan-400"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-48 focus:w-64 transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </button>
        <div className="md:hidden w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center font-bold text-white text-xs">
          ST
        </div>
      </div>
    </header>
  );
}
