import { Question } from '../types';

export const QUESTIONS: Question[] = [
  // Openness
  { id: 1, text: "I have a rich vocabulary.", trait: 'Openness', isReversed: false },
  { id: 2, text: "I have a vivid imagination.", trait: 'Openness', isReversed: false },
  { id: 3, text: "I have excellent ideas.", trait: 'Openness', isReversed: false },
  { id: 4, text: "I am quick to understand things.", trait: 'Openness', isReversed: false },
  
  // Conscientiousness
  { id: 5, text: "I am always prepared.", trait: 'Conscientiousness', isReversed: false },
  { id: 6, text: "I pay attention to details.", trait: 'Conscientiousness', isReversed: false },
  { id: 7, text: "I get chores done right away.", trait: 'Conscientiousness', isReversed: false },
  { id: 8, text: "I like order.", trait: 'Conscientiousness', isReversed: false },
  
  // Extraversion
  { id: 9, text: "I am the life of the party.", trait: 'Extraversion', isReversed: false },
  { id: 10, text: "I feel comfortable around people.", trait: 'Extraversion', isReversed: false },
  { id: 11, text: "I start conversations.", trait: 'Extraversion', isReversed: false },
  { id: 12, text: "I talk to a lot of different people at parties.", trait: 'Extraversion', isReversed: false },
  
  // Agreeableness
  { id: 13, text: "I am interested in people.", trait: 'Agreeableness', isReversed: false },
  { id: 14, text: "I sympathize with others' feelings.", trait: 'Agreeableness', isReversed: false },
  { id: 15, text: "I have a soft heart.", trait: 'Agreeableness', isReversed: false },
  { id: 16, text: "I take time out for others.", trait: 'Agreeableness', isReversed: false },
  
  // Neuroticism (Emotional Stability)
  { id: 17, text: "I get irritated easily.", trait: 'Neuroticism', isReversed: false },
  { id: 18, text: "I get stressed out easily.", trait: 'Neuroticism', isReversed: false },
  { id: 19, text: "I worry about things.", trait: 'Neuroticism', isReversed: false },
  { id: 20, text: "I am easily disturbed.", trait: 'Neuroticism', isReversed: false },
];
