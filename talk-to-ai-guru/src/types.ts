export type OceanTrait = 'Openness' | 'Conscientiousness' | 'Extraversion' | 'Agreeableness' | 'Neuroticism';

export interface Question {
  id: number;
  text: string;
  trait: OceanTrait;
  isReversed: boolean;
}

export interface OceanScores {
  Openness: number;
  Conscientiousness: number;
  Extraversion: number;
  Agreeableness: number;
  Neuroticism: number;
}

export interface IdeaSuggestion {
  title: string;
  description: string;
  reason: string;
  category: 'Project' | 'Career' | 'Hobby';
}
