import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import { OceanScores } from '../types';

interface Props {
  scores: OceanScores;
}

export const OceanRadarChart: React.FC<Props> = ({ scores }) => {
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
