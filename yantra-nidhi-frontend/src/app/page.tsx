import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Atom, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="space-y-6 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Next Generation Learning Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          Engineering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Future</span> of Education
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Yantra Nidhi brings immersive virtual labs, AI-driven insights, and a multidisciplinary curriculum directly to your screen. Explore, experiment, and excel.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
          <Link href="/dashboard" className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(0,191,255,0.6)] transition-all hover:-translate-y-1 flex items-center gap-2">
            Go to Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/labs" className="px-8 py-4 rounded-xl glass border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2">
            Explore Labs
          </Link>
        </div>
      </div>

      {/* Feature Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-16">
        <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-cyan-500/50 transition-colors group">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Atom className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white">Virtual Labs</h3>
          <p className="text-gray-400">Interactive physics and engineering simulations in real-time 3D.</p>
        </div>
        
        <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-blue-500/50 transition-colors group">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white">AI Recommendations</h3>
          <p className="text-gray-400">Personalized learning paths tailored to your skill progression.</p>
        </div>

        <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-purple-500/50 transition-colors group">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Rocket className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white">Future Ready</h3>
          <p className="text-gray-400">Advanced tools and analytics to prepare you for industry 4.0.</p>
        </div>
      </div>
    </div>
  );
}
