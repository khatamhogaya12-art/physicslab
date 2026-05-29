import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OceanScores, IdeaSuggestion, Question } from '../types';
import { QUESTIONS } from '../lib/oceanQuestions';
import { generateOceanIdeas } from '../services/gemini';
import { cn } from '../lib/utils';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import {
  Brain,
  Sparkles,
  RefreshCcw,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lightbulb,
  Briefcase,
  Compass
} from 'lucide-react';

/* ==========================================================================
   SUB-COMPONENT: OceanRadarChart
   ========================================================================== */
interface OceanRadarChartProps {
  scores: OceanScores;
}

const OceanRadarChart: React.FC<OceanRadarChartProps> = ({ scores }) => {
  const data = [
    { subject: 'Openness', A: scores.Openness, fullMark: 100 },
    { subject: 'Conscientiousness', A: scores.Conscientiousness, fullMark: 100 },
    { subject: 'Extraversion', A: scores.Extraversion, fullMark: 100 },
    { subject: 'Agreeableness', A: scores.Agreeableness, fullMark: 100 },
    { subject: 'Neuroticism', A: scores.Neuroticism, fullMark: 100 },
  ];

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#71717a', fontSize: 12, fontWeight: 500 }}
          />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ==========================================================================
   SUB-COMPONENT: IdeaCard
   ========================================================================== */
interface IdeaCardProps {
  idea: IdeaSuggestion;
  index: number;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index }) => {
  const icons = {
    Project: <Lightbulb className="w-5 h-5 text-indigo-600" />,
    Career: <Briefcase className="w-5 h-5 text-blue-600" />,
    Hobby: <Compass className="w-5 h-5 text-slate-600" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group h-full"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-tight">
            {idea.category}
          </span>
          <div className="opacity-40 group-hover:opacity-100 transition-opacity">
            {icons[idea.category]}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
          {idea.title}
        </h3>
        
        <p className="text-sm text-slate-500 mb-4 leading-relaxed font-medium">
          {idea.description}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-50 mt-auto">
        <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100/50">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-slate-500 leading-normal italic">
            {idea.reason}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ==========================================================================
   SUB-COMPONENT: OceanQuiz
   ========================================================================== */
interface OceanQuizProps {
  onComplete: (scores: OceanScores) => void;
}

const OceanQuiz: React.FC<OceanQuizProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const currentQuestion = QUESTIONS[currentIndex];

  const handleSelect = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const calculateScores = () => {
    const traitScores: OceanScores = {
      Openness: 0,
      Conscientiousness: 0,
      Extraversion: 0,
      Agreeableness: 0,
      Neuroticism: 0,
    };

    const traitCounts: Record<string, number> = {};

    QUESTIONS.forEach(q => {
      let score = answers[q.id] || 3;
      if (q.isReversed) score = 6 - score;
      
      traitScores[q.trait] += score;
      traitCounts[q.trait] = (traitCounts[q.trait] || 0) + 1;
    });

    Object.keys(traitScores).forEach(key => {
      const trait = key as keyof OceanScores;
      const count = traitCounts[trait];
      const max = count * 5;
      const min = count * 1;
      traitScores[trait] = Math.round(((traitScores[trait] - min) / (max - min)) * 100);
    });

    onComplete(traitScores);
  };

  const isLast = currentIndex === QUESTIONS.length - 1;
  const isComplete = Object.keys(answers).length === QUESTIONS.length;

  return (
    <div className="max-w-xl mx-auto px-6 py-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Diagnostic Phase</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Personality Inventory</h2>
          </div>
          <div className="text-right">
             <span className="text-xl font-bold text-blue-600 leading-none">{currentIndex + 1}</span>
             <span className="text-slate-300 font-bold tracking-tighter"> / {QUESTIONS.length}</span>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          <p className="text-xl text-slate-800 font-semibold leading-snug">
            "{currentQuestion.text}"
          </p>

          <div className="grid grid-cols-1 gap-2">
            {[1, 2, 3, 4, 5].map((val) => {
              const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
              const isSelected = answers[currentQuestion.id] === val;
              return (
                <button
                  key={val}
                  onClick={() => handleSelect(val)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left group",
                    isSelected 
                      ? "bg-slate-800 border-slate-800 text-white shadow-md ring-2 ring-blue-500/20" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="text-sm font-bold tracking-tight">{labels[val-1]}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                  {!isSelected && <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-500 uppercase tracking-widest">{val}</span>}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex justify-between items-center">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        
        {isComplete && isLast && (
          <button
            onClick={calculateScores}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            Generate Report
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   MAIN EXPORT COMPONENT: TalkToAiGuru
   ========================================================================== */
export default function TalkToAiGuru() {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white pb-20">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
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
              className="py-12"
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
              <aside className="bg-white rounded-xl border border-slate-200 p-6 h-fit shadow-sm">
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
    </div>
  );
}
