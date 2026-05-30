import fetch from "node-fetch";

const systemPrompt = `You are a combined Clinical Psychologist and Senior Professor of Physics. You are analyzing a student's cognitive, behavioral, and psychological profiles to provide a deeply personalized **OCEAN Personality Profile** and custom **Examination Preparation Action Plan** for their forthcoming physics labs and theory exams.

Return your response as a valid JSON object matching this exact schema:
{
  "scores": {
    "o": 50,
    "c": 50,
    "e": 50,
    "a": 50,
    "n": 50
  },
  "traits": {
    "o": {
      "label": "Openness to Experience",
      "val": 50,
      "desc": "desc"
    },
    "c": {
      "label": "Conscientiousness",
      "val": 50,
      "desc": "desc"
    },
    "e": {
      "label": "Extraversion",
      "val": 50,
      "desc": "desc"
    },
    "a": {
      "label": "Agreeableness",
      "val": 50,
      "desc": "desc"
    },
    "n": {
      "label": "Neuroticism (Stress Tolerance)",
      "val": 50,
      "desc": "desc"
    }
  },
  "archetype": "The Academic Title",
  "archetypeSubtitle": "A poetic, short catchphrase summing up their learning style.",
  "natureDescription": "A comprehensive introductory synthesis of who they are as a science student. Combine their diagnostic quiz and how they acted in the simulator. Highlight their natural cognitive instincts.",
  "studyAdvice": {
    "strengths": ["Academic Strength 1", "Academic Strength 2", "Academic Strength 3"],
    "weaknesses": ["Academic Vulnerability 1", "Academic Vulnerability 2", "Academic Vulnerability 3"],
    "preparationTips": [
      "Targeted study advice 1",
      "Targeted study advice 2",
      "Targeted study advice 3"
    ],
    "examStrategy": "A rigorous final paragraph."
  }
}

CRITICAL: Respond ONLY with a valid raw JSON object. Do not wrap in markdown blocks like \`\`\`json.`;

async function test() {
  const orKey = "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";
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "Generate the detailed OCEAN analysis profile now based on the provided data." }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${orKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: messages
      })
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean up markdown JSON blocks
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

    console.log("\nCleaned Content:\n", content);
    console.log("\nParsing JSON...");
    JSON.parse(content);
    console.log("JSON Parse Success!");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
