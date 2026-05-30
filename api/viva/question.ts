import { Type } from "@google/genai";
import { generateContentWithFallback } from "../lib/llm.js";

const EXPERIMENT_NAMES: Record<string, string> = {
  black_box: "Black Box Experiment (identifying unknown impedance components in an AC/DC circuit)",
  laser_diffraction: "Laser Diffraction (measuring diffraction fringes, single-slit dimensions, or grating wavelength)",
  optical_fibre: "Optical Fibre Characteristics (measuring Numerical Aperture, attenuation and bending losses)",
  transistor_char: "Transistor Characteristics (Common Emitter CE configuration input and output characteristics)",
  planck_led: "Planck's Constant using LED (voltage turn-on thresholds of monochromatic LEDs vs frequency)",
  energy_gap: "Energy Gap of Semiconductor (reverse bias saturation current of a p-n diode vs temperature change)",
  photodiode: "Characteristics of Photodiode (photocurrent vs light intensity and reverse bias profiles)"
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { experimentId, history, requestMoreSimple } = req.body;
    const expName = EXPERIMENT_NAMES[experimentId] || experimentId;

    const chatHistoryPrompt = history && history.length > 0
      ? `Here is the academic discussion history so far:\n${history.map((h: any) => `${h.role === "user" ? "Student" : "Tutor"}: ${h.text}`).join("\n")}`
      : "No academic history for this session yet.";

    const simplificationInstruction = requestMoreSimple
      ? "CRITICAL: The student has selected 'SIMPLIFY' or is struggling with the concept. Generate a MUCH simpler question. It can be a simple conceptual question or a multiple-choice question (MCQ) with 4 choices. Keep it engaging, fundamental, and highly accessible."
      : "Generate a standard, high-quality verbal interview viva question suitable for an undergraduate engineering physics/electronic instruments lab. Keep it crisp, focusing on theory, safety protocols, or physical interpretations.";

    const systemPrompt = `You are an expert Physics Laboratory Professor conducting a viva-voce oral examination for the app "Yantra Nidhi" for the experiment: ${expName}.
Your goal is to test the student's theoretical grasp, practical insight, and conceptual understanding.
${simplificationInstruction}

${chatHistoryPrompt}

Generate a clear viva question. You MUST return your response as a valid JSON object matching this schema:
{
  "question": "The question string",
  "type": "open" or "mcq",
  "options": ["Option A", "Option B", "Option C", "Option D"] // include only if type is "mcq" (provide 4 realistic options)
}`;

    const userPrompt = `Generate the next ${requestMoreSimple ? 'simplified ' : ''}viva question now.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        type: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["question", "type"]
    };

    const reqKey = req.headers['x-gemini-api-key'] as string | undefined;
    const selectedModel = req.headers['x-ai-model'] || "gemini-3.5-flash";

    const resultText = await generateContentWithFallback(
      systemPrompt, 
      userPrompt, 
      schema, 
      selectedModel as string, 
      reqKey, 
      reqKey
    );

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error generating viva question:", error);
    res.status(550).json({ error: error.message || "Failed to generate viva question" });
  }
}
