import handler from "./api/ocean/analyze.js";

async function run() {
  const req = {
    method: "POST",
    headers: {
      "x-gemini-api-key": process.env.GEMINI_API_KEY,
      "x-ai-model": "meta-llama/llama-3.3-70b-instruct:free"
    },
    body: {
      quizAnswers: [ { aspectName: "Openness", questionText: "I like art", value: 5 } ],
      labStats: {}
    }
  };

  const res = {
    status: (code: number) => {
      console.log("Status:", code);
      return res;
    },
    json: (data: any) => {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  };

  await handler(req, res);
}

run();
