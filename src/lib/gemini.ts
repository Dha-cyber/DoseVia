/**
 * Google Gemini API utility
 * Set VITE_GEMINI_API_KEY in your .env file to enable real AI responses.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Model priority list — tries each in order on quota/rate-limit errors
const MODELS = [
  'gemini-3.1-flash-lite',
];

const BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

async function callWithModel(
  model: string,
  contents: GeminiMessage[],
  retries = 2,
): Promise<string> {
  const endpoint = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new Error('Empty response from Gemini. Please try again.');
      return text.trim();
    }

    const errText = await res.text();
    let errMsg = `API error ${res.status}: ${errText}`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message ?? errMsg;
    } catch {
      // keep raw text
    }

    const isRateLimit = res.status === 429 || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');

    // On rate-limit, wait then retry (or throw to trigger next model)
    if (isRateLimit && attempt < retries) {
      const waitMs = (attempt + 1) * 3000; // 3s, 6s backoff
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    throw new Error(errMsg);
  }

  throw new Error('Max retries exceeded');
}

export async function callGemini(
  userMessage: string,
  systemPrompt: string,
  history: GeminiMessage[] = []
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file and restart the dev server.');
  }

  // Inject system prompt as a priming exchange (works on all model versions)
  const systemExchange: GeminiMessage[] = [
    { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}` }] },
    { role: 'model', parts: [{ text: 'Understood. I will follow these instructions carefully.' }] },
  ];

  const sanitised = sanitiseHistory(history);

  const contents: GeminiMessage[] = [
    ...systemExchange,
    ...sanitised,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  // Try each model in order until one succeeds
  let lastError: Error = new Error('All models failed');
  for (const model of MODELS) {
    try {
      return await callWithModel(model, contents);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isQuota = lastError.message.includes('quota') || lastError.message.includes('RESOURCE_EXHAUSTED') || lastError.message.includes('429');
      if (!isQuota) throw lastError; // non-quota errors → don't try next model
      // quota error → try next model
    }
  }

  throw lastError;
}

/** Ensures history strictly alternates user → model → user → model */
function sanitiseHistory(history: GeminiMessage[]): GeminiMessage[] {
  const result: GeminiMessage[] = [];
  for (const msg of history) {
    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      result[result.length - 1] = msg; // replace duplicate role
      continue;
    }
    result.push(msg);
  }
  while (result.length > 0 && result[0].role !== 'user') result.shift();
  return result;
}

/** Convert our internal message format to Gemini history format */
export function toGeminiHistory(
  messages: { role: 'user' | 'ai'; text: string }[]
): GeminiMessage[] {
  return messages
    .filter(m => !m.text.startsWith('⚠️')) // exclude previous error messages
    .map(m => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));
}
