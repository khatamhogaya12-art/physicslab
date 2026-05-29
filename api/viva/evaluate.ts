import { GoogleGenAI, Type } from "@google/genai";

const EXPERIMENT_NAMES: Record<string, string> = {
  black_box: "Black Box Experiment (identifying unknown impedance components in an AC/DC circuit)",
  laser_diffraction: "Laser Diffraction (measuring diffraction fringes, single-slit dimensions, or grating wavelength)",
  optical_fibre: "Optical Fibre Characteristics (measuring Numerical Aperture, attenuation and bending losses)",
  transistor_char: "Transistor Characteristics (Common Emitter CE configuration input and output characteristics)",
  planck_led: "Planck's Constant using LED (voltage turn-on thresholds of monochromatic LEDs vs frequency)",
  energy_gap: "Energy Gap of Semiconductor (reverse bias saturation current of a p-n diode vs temperature change)",
  photodiode: "Characteristics of Photodiode (photocurrent vs light intensity and reverse bias profiles)"
};

function getGeminiClient(reqKey?: string): GoogleGenAI {
  const key = reqKey || process.env.GEMINI_API_KEY || "";
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
    const { experimentId, question, answer, type } = req.body;
    const expName = EXPERIMENT_NAMES[experimentId] || experimentId;

    const systemPrompt = `You are a strict yet supportive Physics Professor evaluating a student's answer in a lab viva-voce for the experiment: "${expName}".
    The question active: "${question}"
    The student's answer: "${answer}" (Question format was: ${type}).
    
    Evaluate the answer. Score it from 0 to 10 (10 being pristine). Be academically rigorous:
    - If the student is guessing blindly or gives completely wrong physics, score low.
    - If they are partially correct, give a medium score with gentle corrections.
    - Celebrate precise technical responses and accurate formulas.
    
    Additionally, analyze their academic behavior for the OCEAN Big Five personality model. Extrapolate trait markers shown by this answer transaction:
    - HIGH Conscientiousness: Detail-oriented, tries to write full equations, gives structured layout.
    - LOW Conscientiousness: Lazy answers ("i don't know", single-word guesses, messy response).
    - HIGH Openness: Asks analytical sub-questions, shows curiosity, refers to physical analogies.
    - HIGH Neuroticism: Shows excessive exam anxiety, makes nervous self-deprecating remarks.
    - HIGH Agreeableness or Extraversion: Expresses warm greetings or highly interactive dialogue.
    
    Provide the behavioral trait score adjustments (from -2 to +2, where 0 is neutral) to apply to the student's background session profile based on this transaction.
    
    Return your response as a valid JSON object matching this schema:
    {
      "correct": true/false (whether answer can be considered generally correct/acceptable),
      "score": number (0 to 10),
      "feedback": "Warm, constructive professor feedback addressed directly to the student",
      "explanation": "Brief, rigorous scientific explanation of the exact physics concept tested by the question",
      "traitMarkers": {
        "openness": number (-2 to 2),
        "conscientiousness": number (-2 to 2),
        "extraversion": number (-2 to 2),
        "agreeableness": number (-2 to 2),
        "neuroticism": number (-2 to 2)
      }
    }`;

    const reqKey = req.headers['x-gemini-api-key'] as string | undefined;
    const ai = getGeminiClient(reqKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: systemPrompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correct: { type: Type.BOOLEAN },
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            explanation: { type: Type.STRING },
            traitMarkers: {
              type: Type.OBJECT,
              properties: {
                openness: { type: Type.INTEGER },
                conscientiousness: { type: Type.INTEGER },
                extraversion: { type: Type.INTEGER },
                agreeableness: { type: Type.INTEGER },
                neuroticism: { type: Type.INTEGER }
              },
              required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
            }
          },
          required: ["correct", "score", "feedback", "explanation", "traitMarkers"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error evaluating viva response:", error);
    res.status(550).json({ error: error.message || "Failed to evaluate viva response" });
  }
}
