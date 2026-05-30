import { OceanScores, IdeaSuggestion } from "../types";

export async function generateOceanIdeas(scores: OceanScores): Promise<IdeaSuggestion[]> {
  try {
    const customKey = localStorage.getItem("yantra_nidhi_gemini_api_key");
    const aiModel = localStorage.getItem("yantra_nidhi_ai_model") || "gemini-3.5-flash";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (customKey) {
      headers["x-gemini-api-key"] = customKey;
    }
    headers["x-ai-model"] = aiModel;

    const response = await fetch("/api/guru/recommend", {
      method: "POST",
      headers,
      body: JSON.stringify({ scores }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate recommendations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating ideas:", error);
    return [];
  }
}
