"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Settings, Box, Activity } from "lucide-react";

const LABS = [
  {
    title: "Quantum Mechanics: Double Slit",
    category: "Physics",
    level: "Advanced",
    image: "bg-gradient-to-br from-purple-900 to-black",
    icon: Activity,
  },
  {
    title: "Neural Network Visualizer",
    category: "AI/ML",
    level: "Intermediate",
    image: "bg-gradient-to-br from-cyan-900 to-black",
    icon: Settings,
  },
  {
    title: "Structural Load Testing",
    category: "Civil Eng",
    level: "Beginner",
    image: "bg-gradient-to-br from-orange-900 to-black",
    icon: Box,
  },
  {
    title: "Thermodynamics Simulation",
    category: "Physics",
    level: "Intermediate",
    image: "bg-gradient-to-br from-red-900 to-black",
    icon: Activity,
  },
  {
    title: "Genetic Algorithms in Robotics",
    category: "AI/ML",
    level: "Advanced",
    image: "bg-gradient-to-br from-emerald-900 to-black",
    icon: Settings,
  },
  {
    title: "Fluid Dynamics Wind Tunnel",
    category: "Aerospace",
    level: "Advanced",
    image: "bg-gradient-to-br from-blue-900 to-black",
    icon: Box,
  }
];

export default function VirtualLabsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Virtual Labs Sandbox</h1>
        <p className="text-gray-400 mt-1">Immersive simulations for physics, engineering, and AI.</p>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {["All", "Physics", "AI/ML", "Civil Eng", "Aerospace"].map((filter) => (
          <button key={filter} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === "All" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LABS.map((lab, idx) => (
          <Card key={idx} className="group relative overflow-hidden glass-card border-none hover:shadow-[0_0_30px_rgba(0,191,255,0.3)] transition-all duration-500 cursor-pointer">
            <div className={`h-48 w-full ${lab.image} relative flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
              <lab.icon className="w-16 h-16 text-white/50 group-hover:scale-125 group-hover:text-white/80 transition-all duration-500 z-20 relative" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-30 transition-opacity duration-300">
                <div className="bg-black/60 p-4 rounded-full backdrop-blur-md">
                  <PlayCircle className="w-12 h-12 text-cyan-400" />
                </div>
              </div>
            </div>
            <CardContent className="p-6 relative z-20 bg-black/60 backdrop-blur-xl border-t border-white/10">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="border-white/20 text-gray-300">{lab.category}</Badge>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  lab.level === "Beginner" ? "bg-green-500/20 text-green-400" :
                  lab.level === "Intermediate" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {lab.level}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{lab.title}</h3>
              <p className="text-sm text-gray-400">Interactive 3D simulation with real-time data analysis.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
