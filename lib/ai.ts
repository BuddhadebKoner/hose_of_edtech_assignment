type GroqMessage = {
   role: "system" | "user";
   content: string;
};

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_ENDPOINT =
   "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function buildPrompt(topic: string, count: number) {
   return `Generate ${count} multiple choice questions about "${topic}".\nReturn ONLY a JSON array. No markdown. No extra text.\nSchema:\n[{"questionText":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}]`;
}

function extractJsonArray(text: string) {
   const sanitized = text.replace(/```json|```/gi, "").trim();
   const start = sanitized.indexOf("[");
   const end = sanitized.lastIndexOf("]");

   if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response did not include a JSON array");
   }

   const jsonText = sanitized.slice(start, end + 1);
   return JSON.parse(jsonText);
}

async function generateWithGroq(prompt: string) {
   const apiKey = process.env.GROQ_API_KEY;
   if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY in environment");
   }

   const model = process.env.GROQ_MODEL ?? "llama3-8b-8192";
   const messages: GroqMessage[] = [
      {
         role: "system",
         content: "You are a precise quiz generator that outputs valid JSON only.",
      },
      { role: "user", content: prompt },
   ];

   const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
         Authorization: `Bearer ${apiKey}`,
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         model,
         messages,
         temperature: 0.2,
      }),
   });

   if (!res.ok) {
      const message = await res.text();
      throw new Error(`Groq error: ${message || res.status}`);
   }

   const data = await res.json();
   const content = data?.choices?.[0]?.message?.content;
   if (!content) {
      throw new Error("Groq response missing content");
   }

   return extractJsonArray(content);
}

async function generateWithGemini(prompt: string) {
   const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
   if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY in environment");
   }

   const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         contents: [
            {
               role: "user",
               parts: [{ text: prompt }],
            },
         ],
         generationConfig: {
            temperature: 0.2,
         },
      }),
   });

   if (!res.ok) {
      const message = await res.text();
      throw new Error(`Gemini error: ${message || res.status}`);
   }

   const data = await res.json();
   const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
   if (!content) {
      throw new Error("Gemini response missing content");
   }

   return extractJsonArray(content);
}

export async function generateAiQuestions(topic: string, count: number) {
   const prompt = buildPrompt(topic, count);

   if (process.env.GROQ_API_KEY) {
      return generateWithGroq(prompt);
   }

   return generateWithGemini(prompt);
}
