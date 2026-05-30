import { generateContentWithFallback } from "./api/lib/llm.js";
import { Type } from "@google/genai";

const systemPrompt = `You are a testing assistant. Return a JSON object {"success": true}`;

async function test() {
  try {
    const schema = {
      type: Type.OBJECT,
      properties: {
        success: { type: Type.BOOLEAN }
      }
    };

    console.log("Starting test...");
    const result = await generateContentWithFallback(
      systemPrompt, 
      "Test user prompt", 
      schema, 
      "meta-llama/llama-3.3-70b-instruct:free", 
      undefined, 
      "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"
    );
    console.log("Final Result:", result);
  } catch (err) {
    console.error("Fatal Error:", err);
  }
}

test();
