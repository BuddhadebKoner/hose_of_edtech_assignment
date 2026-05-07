type GroqMessage = {
   role: "system" | "user";
   content: string;
};

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_BASE_V1 = "https://generativelanguage.googleapis.com/v1";
const GEMINI_API_BASE_V1BETA = "https://generativelanguage.googleapis.com/v1beta";

function normalizeGeminiModelName(name: string) {
   return name.replace(/^models\//, "");
}

async function listGeminiModels(baseUrl: string, apiKey: string) {
   const models: string[] = [];
   let pageToken: string | undefined;

   for (let i = 0; i < 3; i += 1) {
      const url = new URL(`${baseUrl}/models`);
      url.searchParams.set("key", apiKey);
      if (pageToken) {
         url.searchParams.set("pageToken", pageToken);
      }

      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) {
         const message = await res.text();
         throw new Error(`Gemini listModels error (${res.status}): ${message || res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data?.models) ? data.models : [];
      for (const entry of list) {
         const name = normalizeGeminiModelName(entry?.name ?? "");
         const methods = Array.isArray(entry?.supportedGenerationMethods)
            ? entry.supportedGenerationMethods
            : [];
         if (name && methods.includes("generateContent")) {
            models.push(name);
         }
      }

      pageToken = data?.nextPageToken;
      if (!pageToken) {
         break;
      }
   }

   return Array.from(new Set(models));
}

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

   const rawModel = process.env.GEMINI_MODEL ?? "gemini-1.5-flash-latest";
   const model = normalizeGeminiModelName(rawModel);
   const defaultCandidates = Array.from(
      new Set([
         model,
         "gemini-1.5-flash",
         "gemini-1.0-pro",
         "gemini-1.5-pro",
         "gemini-2.0-flash",
      ])
   );

   async function callGemini(baseUrl: string, modelName: string) {
      const res = await fetch(`${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`, {
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
         const raw = await res.text();
         let message = raw;
         try {
            const parsed = JSON.parse(raw);
            message = parsed?.error?.message ?? raw;
         } catch {
            // Keep raw message when JSON parsing fails.
         }
         const error = new Error(`Gemini error (${res.status}): ${message || res.status}`);
         (error as { status?: number }).status = res.status;
         throw error;
      }

      const data = await res.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
         throw new Error("Gemini response missing content");
      }

      return content;
   }

   const baseCandidates = [GEMINI_API_BASE_V1, GEMINI_API_BASE_V1BETA];
   const errors: string[] = [];

   for (const baseUrl of baseCandidates) {
      let modelCandidates = defaultCandidates;
      try {
         const available = await listGeminiModels(baseUrl, apiKey);
         if (available.length > 0) {
            modelCandidates = Array.from(new Set([model, ...available]));
         }
      } catch (err) {
         const message = err instanceof Error ? err.message : String(err);
         errors.push(`${baseUrl}/models: ${message}`);
      }

      for (const modelName of modelCandidates) {
         try {
            const content = await callGemini(baseUrl, modelName);
            return extractJsonArray(content);
         } catch (err) {
            const status = (err as { status?: number }).status;
            const message = err instanceof Error ? err.message : String(err);
            errors.push(`${baseUrl}/models/${modelName}: ${message}`);

            if (status && status !== 404) {
               break;
            }
         }
      }
   }

   throw new Error(`Gemini error: ${errors.join(" | ")}`);
}

export async function generateAiQuestions(topic: string, count: number) {
   const prompt = buildPrompt(topic, count);

   if (process.env.GROQ_API_KEY) {
      return generateWithGroq(prompt);
   }

   return generateWithGemini(prompt);
}
