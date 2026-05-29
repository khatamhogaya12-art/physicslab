import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OceanScores, IdeaSuggestion } from './types';
import { OceanQuiz } from './components/OceanQuiz';
import { OceanRadarChart } from './components/OceanRadarChart';
import { IdeaCard } from './components/IdeaCard';
import { generateOceanIdeas } from './services/gemini';
import { Brain, Sparkles, RefreshCcw, Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<'welcome' | 'quiz' | 'results'>('welcome');
  const [scores, setScores] = useState<OceanScores | null>(null);
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const startQuiz = () => {
    setScores(null);
    setIdeas([]);
    setStep('quiz');
  };

  const handleQuizComplete = async (newScores: OceanScores) => {
    setScores(newScores);
    setStep('results');
    setLoadingIdeas(true);
    try {
      const suggestions = await generateOceanIdeas(newScores);
      setIdeas(suggestions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const traitDescriptions = {
    Openness: "Your curiosity and willingness to embrace new experiences and unconventional ideas.",
    Conscientiousness: "The level of organization, dependability, and discipline in pursuing goals.",
    Extraversion: "How much you draw energy from social interactions and external stimulation.",
    Agreeableness: "Your tendency to be compassionate, cooperative, and considerate of others.",
    Neuroticism: "Your sensitivity to environment and the degree of emotional responsiveness."
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-blue-600 uppercase">AI GURU</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Analysis Session</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
          
          {step !== 'welcome' && (
            <button 
              onClick={() => setStep('welcome')}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors"
            >
              Restart
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-[1240px] px-6 min-h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto text-center py-24"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-8 uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3" />
                Strategic Personality Logic
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-8 leading-[1] text-slate-900">
                Unlock your <br />
                <span className="text-blue-600 italic">potentiality.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-xl mx-auto mb-12 leading-relaxed font-medium">
                Map your psychological profile and transform core traits into actionable strategies for projects, careers, and personal growth.
              </p>
              <button
                onClick={startQuiz}
                className="px-10 py-5 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
              >
                Begin Assessment
              </button>
            </motion.div>
          )}

          {step === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OceanQuiz onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {step === 'results' && scores && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 py-8"
            >
              {/* Sidebar */}
              <aside className="bg-white rounded-xl border border-slate-200 p-6 h-fit sticky top-24 shadow-sm">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">OCEAN Profile</h2>
                <div className="space-y-6">
                  {(Object.keys(scores) as Array<keyof OceanScores>).map(trait => (
                    <div key={trait}>
                      <div className="flex justify-between items-end mb-1.5 px-0.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{trait}</span>
                        <span className="text-sm font-bold text-blue-600">{scores[trait]}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-600 rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${scores[trait]}%` }}
                          transition={{ delay: 0.2, duration: 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Radar Overview</h2>
                  <div className="scale-110 origin-center bg-slate-50/50 rounded-xl p-2 border border-slate-50">
                    <OceanRadarChart scores={scores} />
                  </div>
                </div>

                <button 
                  onClick={startQuiz}
                  className="w-full mt-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Retake Analysis
                </button>
              </aside>

              {/* Main Content Area */}
              <div className="flex flex-col gap-8">
                <section className="bg-slate-800 text-white rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h2 className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Strategic Diagnostic</h2>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">
                      {scores.Openness > 70 ? 'The Visionary Strategist' : scores.Conscientiousness > 70 ? 'The Project Authority' : 'The Collaborative Driver'}
                    </h1>
                    <p className="text-slate-300 leading-relaxed max-w-2xl font-medium text-lg">
                      Based on your diagnostic of {scores.Openness > 70 ? 'experimental openness' : 'structured focus'} 
                      and {scores.Extraversion > 50 ? 'collective dynamism' : 'independent precision'}, 
                      your profile excels in high-impact environments with specialized logic.
                    </p>
                  </div>
                  <Brain className="absolute -right-12 -bottom-12 w-64 h-64 text-white opacity-5 rotate-12" />
                </section>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logic-Path Recommendations</h3>
                    <button 
                      onClick={() => handleQuizComplete(scores)}
                      disabled={loadingIdeas}
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                    >
                      {loadingIdeas ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                      Re-Analyze
                    </button>
                  </div>

                  {loadingIdeas ? (
                    <div className="bg-white rounded-xl border border-slate-200 py-24 flex flex-col items-center justify-center space-y-4 shadow-sm">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Synthesizing personalized strategies...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ideas.map((idea, i) => (
                        <IdeaCard key={i} idea={idea} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 border-t border-slate-200 mt-20 bg-white">
        <div className="container mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-200 hover:text-slate-400 transition-colors">
            <Brain className="w-5 h-5" />
            <span className="font-extrabold text-lg uppercase tracking-tighter">AI GURU</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Precision Diagnostic</span>
            <span>AI Reasoning</span>
            <span>Strategic Growth</span>
          </div>
          <p className="text-[9px] text-slate-300 uppercase tracking-widest mt-4">© 2026 AI GURU ENGINE</p>
        </div>
      </footer>
    </div>
  );
}
