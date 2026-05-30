import { Type } from "@google/genai";
import { generateContentWithFallback } from "../lib/llm.js";

    }
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quizAnswers, labStats } = req.body;

    const quizText = quizAnswers && quizAnswers.length > 0
      ? quizAnswers.map((q: any) => `- Aspect: ${q.aspectName} ("${q.questionText}") -> Response Scale: ${q.value}/5`).join("\n")
      : "No direct OCEAN questionnaire answers filled.";

    const statsText = `
Student Lab Behavioral Dynamics:
- Virtual experiments played: ${labStats?.experimentsCompletedCount || 0}
- Total viva questions attempted: ${labStats?.totalQuestionsAttempted || 0}
- Average score achieved: ${labStats?.averageVivaScore || 0}/10
- Total times skipped questions: ${labStats?.totalSkips || 0}
- Total times requested question simplification (struggle pointer/patience index): ${labStats?.totalSimplifications || 0}
- Seconds spent under critical exam timer pressure (<30s left): ${labStats?.timerUrgentSeconds || 0} seconds
- Total number of core countdown expirations (ran out of time): ${labStats?.timerExpirationsCount || 0} times
- Extrapolated session traits: Openness index=${labStats?.sessionTraits?.openness || 0}, Conscientiousness index=${labStats?.sessionTraits?.conscientiousness || 0}, Extraversion index=${labStats?.sessionTraits?.extraversion || 0}, Agreeableness index=${labStats?.sessionTraits?.agreeableness || 0}, Neuroticism index=${labStats?.sessionTraits?.neuroticism || 0}
`;

    const systemPrompt = `You are a combined Clinical Psychologist and Senior Professor of Physics. You are analyzing a student's cognitive, behavioral, and psychological profiles to provide a deeply personalized **OCEAN Personality Profile** and custom **Examination Preparation Action Plan** for their forthcoming physics labs and theory exams.

The data consists of:
1. Direct psychological diagnostic answers:
${quizText}

2. Behavioral dynamics during physical laboratory simulations:
${statsText}

Evaluate and synthesize these inputs into highly detailed, scientifically grounded, and encouraging profiles.
Generate a beautiful academic Archetype representing their learning profile (e.g. 'The Persistent Perfectionist', 'The Inquisitive Tinkerer', 'The High-Anxiety Achiever', etc.).
Synthesize scores for the O, C, E, A, N dimensions from 0 to 100 based on both direct quiz and lab struggle factors (e.g., requesting simplification shows a desire for support, frequent skips show avoidance, detailed viva responses show high conscientious precision, etc.).

Return your response as a valid JSON object matching this exact schema:
{
  "scores": {
    "o": number (0 to 100),
    "c": number (0 to 100),
    "e": number (0 to 100),
    "a": number (0 to 100),
    "n": number (0 to 100)
  },
  "traits": {
    "o": {
      "label": "Openness to Experience",
      "val": number,
      "desc": "A specific paragraph describing how their Openness scores manifest in laboratory curiosity, theoretical experimentation, and abstract physics concepts."
    },
    "c": {
      "label": "Conscientiousness",
      "val": number,
      "desc": "A specific paragraph describing how their high or low Conscientiousness affects their notebook maintenance, experiment replication accuracy, adherence to mathematical safety, and grit."
    },
    "e": {
      "label": "Extraversion",
      "val": number,
      "desc": "A paragraph explaining their interactive group work capabilities, verbal explanations in viva vocas, and preference for studying in groups or solo."
    },
    "a": {
      "label": "Agreeableness",
      "val": number,
      "desc": "A paragraph detailing how they accept academic feedback, interact with strict evaluators, and cooperate with laboratory teaching assistants."
    },
    "n": {
      "label": "Neuroticism (Stress Tolerance)",
      "val": number,
      "desc": "A paragraph outlining their resilience under exam timer stress, anxiety during tricky viva cross-examinations, and risk of exam blockages."
    }
  },
  "archetype": "The Academic Title",
  "archetypeSubtitle": "A poetic, short catchphrase summing up their learning style.",
  "natureDescription": "A comprehensive introductory synthesis of who they are as a science student. Combine their diagnostic quiz and how they acted in the simulator. Highlight their natural cognitive instincts.",
  "studyAdvice": {
    "strengths": ["Academic Strength 1", "Academic Strength 2", "Academic Strength 3"],
    "weaknesses": ["Academic Vulnerability 1", "Academic Vulnerability 2", "Academic Vulnerability 3"],
    "preparationTips": [
      "Targeted study advice 1 related specifically to their personality (e.g., if neuroticism is high, practice breathing or simulated timers)",
      "Targeted study advice 2 based on conscientiousness level",
      "Targeted study advice 3 for high-yield laboratory conceptual mapping"
    ],
    "examStrategy": "A rigorous final paragraph outlining exactly how this specific profile can score maximum marks in a physical lab examination hall. Describe their optimal pacing, approach to viva cross-questions, and graph writing precision."
  }
}`;

    const reqKey = req.headers['x-gemini-api-key'] as string | undefined;
    const selectedModel = req.headers['x-ai-model'] || "gemini-3.5-flash";

    const schema = {
          type: Type.OBJECT,
          properties: {
            scores: {
              type: Type.OBJECT,
              properties: {
                o: { type: Type.INTEGER },
                c: { type: Type.INTEGER },
                e: { type: Type.INTEGER },
                a: { type: Type.INTEGER },
                n: { type: Type.INTEGER }
              },
              required: ["o", "c", "e", "a", "n"]
            },
            traits: {
              type: Type.OBJECT,
              properties: {
                o: {
                  type: Type.OBJECT,
                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },
                  required: ["label", "val", "desc"]
                },
                c: {
                  type: Type.OBJECT,
                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },
                  required: ["label", "val", "desc"]
                },
                e: {
                  type: Type.OBJECT,
                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },
                  required: ["label", "val", "desc"]
                },
                a: {
                  type: Type.OBJECT,
                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },
                  required: ["label", "val", "desc"]
                },
                n: {
                  type: Type.OBJECT,
                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },
                  required: ["label", "val", "desc"]
                }
              },
              required: ["o", "c", "e", "a", "n"]
            },
            archetype: { type: Type.STRING },
            archetypeSubtitle: { type: Type.STRING },
            natureDescription: { type: Type.STRING },
            studyAdvice: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                preparationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                examStrategy: { type: Type.STRING }
              },
              required: ["strengths", "weaknesses", "preparationTips", "examStrategy"]
            }
          },
          required: ["scores", "traits", "archetype", "archetypeSubtitle", "natureDescription", "studyAdvice"]
        };

    const resultText = await generateContentWithFallback(
      systemPrompt, 
      '', 
      schema, 
      selectedModel as string, 
      reqKey, 
      reqKey
    );
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error analyzing personality profile:", error);
    res.status(550).json({ error: error.message || "Failed to analyze personality profile" });
  }
}
