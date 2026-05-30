import { GoogleGenAI, Type } from "@google/genai";

const OPENROUTER_API_KEY_FALLBACK = "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";

export const AVAILABLE_MODELS = [
  "gemini-3.5-flash",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-120b:free",
  "z-ai/glm-4.5-air:free"
];

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

/**
 * Fallback AI Router
 * Tries the primary model. If it fails, iterates through other available models.
 */
export async function generateContentWithFallback(
  systemPrompt: string, 
  userPrompt: string, 
  schema: any, 
  primaryModel: string, 
  geminiKey?: string,
  openrouterKey?: string
): Promise<string> {
  const modelsToTry = [
    primaryModel,
    ...AVAILABLE_MODELS.filter(m => m !== primaryModel)
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[LLM Router] Attempting model: ${model}`);
      
      if (model === "gemini-3.5-flash") {
        const ai = getGeminiClient(geminiKey);
        const contents = [];
        if (systemPrompt) contents.push({ text: systemPrompt });
        if (userPrompt) contents.push({ text: userPrompt });
        
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });
        
        const text = response.text || "{}";
        JSON.parse(text); // Verify valid JSON
        console.log(`[LLM Router] Success with model: ${model}`);
        return text;
      } else {
        // OpenRouter Fallback
        const orKey = openrouterKey || process.env.OPENROUTER_API_KEY || OPENROUTER_API_KEY_FALLBACK;
        
        const messages = [];
        if (systemPrompt) {
            // Reinforce JSON output for OpenRouter models
            messages.push({ role: "system", content: systemPrompt + "\nCRITICAL: Respond ONLY with a valid raw JSON object. Do not wrap in markdown blocks like ```json." });
        }
        if (userPrompt) {
            messages.push({ role: "user", content: userPrompt });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${orKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://yantranidhi.com", 
            "X-Title": "Yantra Nidhi"
          },
          body: JSON.stringify({
            model: model,
            messages: messages
          })
        });

        if (!response.ok) {
           const errText = await response.text();
           throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        
        // Clean up markdown JSON blocks if the model ignored instructions
        content = content.trim();
        if (content.startsWith("```json")) {
           content = content.replace(/^```json\n?/, "");
        }
        if (content.startsWith("```")) {
            content = content.replace(/^```\n?/, "");
        }
        if (content.endsWith("```")) {
           content = content.replace(/\n?```$/, "");
        }
        content = content.trim();
        
        // Quick validate JSON parse
        JSON.parse(content);

        console.log(`[LLM Router] Success with model: ${model}`);
        return content;
      }
    } catch (error) {
      console.warn(`[LLM Router] Model ${model} failed:`, (error as any).message);
      lastError = error;
    }
  }

  throw new Error(`All models failed. Last error: ${(lastError as any)?.message}`);
}
