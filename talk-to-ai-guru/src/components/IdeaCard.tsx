import React from 'react';
import { motion } from 'motion/react';
import { IdeaSuggestion } from '../types';
import { Briefcase, Lightbulb, Compass, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  idea: IdeaSuggestion;
  index: number;
}

export const IdeaCard: React.FC<Props> = ({ idea, index }) => {
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
