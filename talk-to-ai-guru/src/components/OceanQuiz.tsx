import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUESTIONS } from '../lib/oceanQuestions';
import { OceanScores } from '../types';
import { cn } from '../lib/utils';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

interface OceanQuizProps {
  onComplete: (scores: OceanScores) => void;
}

export const OceanQuiz: React.FC<OceanQuizProps> = ({ onComplete }) => {
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
      let score = answers[q.id] || 3; // default to neutral if missing (shouldn't happen)
      if (q.isReversed) score = 6 - score;
      
      traitScores[q.trait] += score;
      traitCounts[q.trait] = (traitCounts[q.trait] || 0) + 1;
    });

    // Normalize to 0-100
    // Max per trait = counts * 5, Min = counts * 1
    // Ratio = (sum - min) / (max - min) * 100
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
