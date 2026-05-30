import re

files_to_patch = [
    {
        "path": "api/viva/evaluate.ts",
        "system_var": "systemPrompt",
        "user_var": "''",
        "schema_var": "{\n          type: Type.OBJECT,\n          properties: {\n            correct: { type: Type.BOOLEAN },\n            score: { type: Type.INTEGER },\n            feedback: { type: Type.STRING },\n            explanation: { type: Type.STRING },\n            traitMarkers: {\n              type: Type.OBJECT,\n              properties: {\n                openness: { type: Type.INTEGER },\n                conscientiousness: { type: Type.INTEGER },\n                extraversion: { type: Type.INTEGER },\n                agreeableness: { type: Type.INTEGER },\n                neuroticism: { type: Type.INTEGER }\n              },\n              required: [\"openness\", \"conscientiousness\", \"extraversion\", \"agreeableness\", \"neuroticism\"]\n            }\n          },\n          required: [\"correct\", \"score\", \"feedback\", \"explanation\", \"traitMarkers\"]\n        }"
    },
    {
        "path": "api/guru/recommend.ts",
        "system_var": "prompt",
        "user_var": "''",
        "schema_var": "{\n          type: Type.ARRAY,\n          items: {\n            type: Type.OBJECT,\n            properties: {\n              title: { type: Type.STRING },\n              description: { type: Type.STRING },\n              reason: { type: Type.STRING, description: \"How this aligns with the personality profile\" },\n              category: { type: Type.STRING, enum: [\"Project\", \"Career\", \"Hobbies\"] }\n            },\n            required: [\"title\", \"description\", \"reason\", \"category\"]\n          }\n        }"
    },
    {
        "path": "api/ocean/analyze.ts",
        "system_var": "systemPrompt",
        "user_var": "''",
        "schema_var": "{\n          type: Type.OBJECT,\n          properties: {\n            scores: {\n              type: Type.OBJECT,\n              properties: {\n                o: { type: Type.INTEGER },\n                c: { type: Type.INTEGER },\n                e: { type: Type.INTEGER },\n                a: { type: Type.INTEGER },\n                n: { type: Type.INTEGER }\n              },\n              required: [\"o\", \"c\", \"e\", \"a\", \"n\"]\n            },\n            traits: {\n              type: Type.OBJECT,\n              properties: {\n                o: {\n                  type: Type.OBJECT,\n                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },\n                  required: [\"label\", \"val\", \"desc\"]\n                },\n                c: {\n                  type: Type.OBJECT,\n                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },\n                  required: [\"label\", \"val\", \"desc\"]\n                },\n                e: {\n                  type: Type.OBJECT,\n                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },\n                  required: [\"label\", \"val\", \"desc\"]\n                },\n                a: {\n                  type: Type.OBJECT,\n                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },\n                  required: [\"label\", \"val\", \"desc\"]\n                },\n                n: {\n                  type: Type.OBJECT,\n                  properties: { label: { type: Type.STRING }, val: { type: Type.INTEGER }, desc: { type: Type.STRING } },\n                  required: [\"label\", \"val\", \"desc\"]\n                }\n              },\n              required: [\"o\", \"c\", \"e\", \"a\", \"n\"]\n            },\n            archetype: { type: Type.STRING },\n            archetypeSubtitle: { type: Type.STRING },\n            natureDescription: { type: Type.STRING },\n            studyAdvice: {\n              type: Type.OBJECT,\n              properties: {\n                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },\n                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },\n                preparationTips: { type: Type.ARRAY, items: { type: Type.STRING } },\n                examStrategy: { type: Type.STRING }\n              },\n              required: [\"strengths\", \"weaknesses\", \"preparationTips\", \"examStrategy\"]\n            }\n          },\n          required: [\"scores\", \"traits\", \"archetype\", \"archetypeSubtitle\", \"natureDescription\", \"studyAdvice\"]\n        }"
    }
]

for item in files_to_patch:
    with open(item["path"], "r") as f:
        content = f.read()
    
    # 1. Update imports
    content = re.sub(
        r'import \{ GoogleGenAI, Type \} from "@google/genai";',
        'import { Type } from "@google/genai";\nimport { generateContentWithFallback } from "../lib/llm.js";',
        content
    )
    
    # 2. Remove getGeminiClient
    content = re.sub(
        r'function getGeminiClient.*?\}\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # 3. Replace the generation block
    # We find the ai.models.generateContent block and replace it.
    # It starts with `const reqKey` and ends with `const resultText = response.text || "{}";`
    
    replacement = f"""const reqKey = req.headers['x-gemini-api-key'] as string | undefined;
    const selectedModel = req.headers['x-ai-model'] || "gemini-3.5-flash";

    const schema = {item["schema_var"]};

    const resultText = await generateContentWithFallback(
      {item["system_var"]}, 
      {item["user_var"]}, 
      schema, 
      selectedModel as string, 
      reqKey, 
      reqKey
    );"""
    
    # Using regex to find the generation block
    pattern = re.compile(
        r'const reqKey = req\.headers\[\'x-gemini-api-key\'\] as string \| undefined;.*?const resultText = response\.text \|\| "\{\}";',
        re.DOTALL
    )
    
    content = pattern.sub(replacement, content)
    
    with open(item["path"], "w") as f:
        f.write(content)
    
    print(f"Patched {item['path']}")

