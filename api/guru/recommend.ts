import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient(reqKey?: string): GoogleGenAI {
  const key = reqKey || process.env.GEMINI_API_KEY || "AIzaSyDl9DpiTEZrWrl5OqpRekCNdJGhjBMjjQY";
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scores } = req.body;

    const prompt = `Based on the following Big Five (OCEAN) personality scores (out of 100), generate 6 creative and personalized ideas for projects, careers, or hobbies.
    
    Scores:
    - Openness: ${scores.Openness}
    - Conscientiousness: ${scores.Conscientiousness}
    - Extraversion: ${scores.Extraversion}
    - Agreeableness: ${scores.Agreeableness}
    - Neuroticism: ${scores.Neuroticism}
    
    Provide a diverse set of ideas: 2 Projects, 2 Careers, and 2 Hobbies.
    Explanation should link the trait scores to the suggestion.`;

    const reqKey = req.headers['x-gemini-api-key'] as string | undefined;
    const ai = getGeminiClient(reqKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
              category: { type: Type.STRING, enum: ["Project", "Career", "Hobbies"] }
            },
            required: ["title", "description", "reason", "category"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    const normalized = results.map((r: any) => ({
      ...r,
      category: r.category === 'Hobbies' ? 'Hobby' : r.category
    }));
    res.json(normalized);
  } catch (error: any) {
    console.error("Error generating ideas:", error);
    res.status(550).json({ error: error.message || "Failed to generate ideas" });
  }
}
