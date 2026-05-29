"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, TrendingUp, Zap } from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  LineChart, 
  Line, 
  XAxis, 
  Tooltip 
} from "recharts";

const skillData = [
  { subject: "Physics", A: 120, fullMark: 150 },
  { subject: "Math", A: 98, fullMark: 150 },
  { subject: "AI/ML", A: 86, fullMark: 150 },
  { subject: "Engineering", A: 99, fullMark: 150 },
  { subject: "Chemistry", A: 85, fullMark: 150 },
  { subject: "Biology", A: 65, fullMark: 150 },
];

const progressData = [
  { name: "Week 1", score: 40 },
  { name: "Week 2", score: 55 },
  { name: "Week 3", score: 68 },
  { name: "Week 4", score: 85 },
  { name: "Week 5", score: 92 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Learning Dashboard</h1>
          <p className="text-gray-400 mt-1">Your personalized learning metrics and AI recommendations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Overall Progress</CardTitle>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white neon-text-cyan">85%</div>
            <Progress value={85} className="h-2 mt-3 bg-white/10 [&>div]:bg-cyan-400" />
            <p className="text-xs text-gray-400 mt-2">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Streaks</CardTitle>
            <Zap className="w-4 h-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" style={{ textShadow: "0 0 10px rgba(255,165,0,0.7)" }}>14 Days</div>
            <p className="text-xs text-gray-400 mt-2">You're on fire! Keep it up.</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Focus Area</CardTitle>
            <Target className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white neon-text-blue">Quantum Mech</div>
            <p className="text-xs text-gray-400 mt-2">Suggested based on your recent labs.</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">AI Readiness</CardTitle>
            <Brain className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" style={{ textShadow: "0 0 10px rgba(168,85,247,0.7)" }}>Level 5</div>
            <Progress value={60} className="h-2 mt-3 bg-white/10 [&>div]:bg-purple-400" />
            <p className="text-xs text-gray-400 mt-2">Intermediate Proficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Skill Analysis Radar</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Radar name="Student" dataKey="A" stroke="#00bfff" fill="#00bfff" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Learning Velocity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#00bfff" strokeWidth={3} dot={{ fill: '#00bfff', r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-6">AI Personalized Roadmap</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Introduction to Neural Networks", category: "AI/ML", duration: "2 Hrs", status: "In Progress" },
          { title: "Thermodynamics Lab 3", category: "Physics", duration: "1.5 Hrs", status: "Recommended" },
          { title: "Structural Analysis: Bridges", category: "Civil Eng", duration: "3 Hrs", status: "Upcoming" }
        ].map((item, idx) => (
          <Card key={idx} className="glass-card border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <Badge variant="outline" className="mb-4 border-cyan-500/50 text-cyan-400 bg-cyan-500/10">{item.category}</Badge>
              <h3 className="font-semibold text-lg text-white mb-2">{item.title}</h3>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{item.duration}</span>
                <span className={item.status === "In Progress" ? "text-orange-400" : "text-blue-400"}>{item.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
