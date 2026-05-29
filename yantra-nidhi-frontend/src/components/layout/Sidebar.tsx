"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Info,
  Microscope,
  BrainCircuit,
  Lightbulb,
  BarChart3,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/about", icon: Info },
  { name: "Virtual Labs", href: "/labs", icon: Microscope },
  { name: "AI Dashboard", href: "/dashboard", icon: BrainCircuit },
  { name: "Research", href: "/research", icon: Lightbulb },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Contact", href: "/contact", icon: Mail },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen sticky top-0 border-r border-white/10 bg-black/40 backdrop-blur-2xl z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-white/10">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,191,255,0.5)]">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white neon-text-cyan tracking-wide">Yantra Nidhi</span>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,191,255,0.5)]">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-blue-950 border border-cyan-500/50 text-cyan-400 p-1 rounded-full z-10 hover:bg-cyan-900 transition-colors shadow-[0_0_10px_rgba(0,191,255,0.3)]"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center p-3 rounded-xl transition-all duration-300 group cursor-pointer",
                  isActive
                    ? "bg-blue-900/40 border border-blue-500/50 text-cyan-400 shadow-[inset_0_0_15px_rgba(0,191,255,0.2)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-white"
                  )}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-3 font-medium whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="glass p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(255,165,0,0.5)]">
              ST
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">Student User</span>
              <span className="text-xs text-cyan-400 truncate">Level 42 Explorer</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(255,165,0,0.5)]">
              ST
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
