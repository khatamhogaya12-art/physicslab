import { GoogleGenAI, Type } from "@google/genai";
import { OceanScores, IdeaSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateOceanIdeas(scores: OceanScores): Promise<IdeaSuggestion[]> {
  const prompt = `Based on the following Big Five (OCEAN) personality scores (out of 100), generate 6 creative and personalized ideas for projects, careers, or hobbies.
  
  Scores:
  - Openness: ${scores.Openness}
  - Conscientiousness: ${scores.Conscientiousness}
  - Extraversion: ${scores.Extraversion}
  - Agreeableness: ${scores.Agreeableness}
  - Neuroticism: ${scores.Neuroticism}
  
  Provide a diverse set of ideas: 2 Projects, 2 Careers, and 2 Hobbies.
  Explanation should link the trait scores to the suggestion.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              reason: { type: Type.STRING, description: "How this aligns with the personality profile" },
              category: { type: Type.STRING, enum: ["Project", "Career", "Hobbies"] } // Note: Category enum matches my type but I'll tolerate small diffs and map them
            },
            required: ["title", "description", "reason", "category"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((r: any) => ({
      ...r,
      category: r.category === 'Hobbies' ? 'Hobby' : r.category // Normalizing
    }));
  } catch (error) {
    console.error("Error generating ideas:", error);
    return [];
  }
}
