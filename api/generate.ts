import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchGeminiContent } from "@maruhuku/ai-client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { transcript, systemPrompt } = req.body as { transcript: string; systemPrompt: string };

  if (!transcript || !systemPrompt) {
    return res.status(400).json({ error: 'transcript and systemPrompt are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  try {
    const text = await fetchGeminiContent(
      `以下の会議の文字起こしから議事録を作成してください:\n\n${transcript}`,
      {
        apiKey,
        model: 'gemini-2.5-flash',
        maxOutputTokens: 4096,
        system: systemPrompt,
      }
    );

    if (!text) {
      return res.status(500).json({ error: 'Gemini APIから応答が取得できませんでした' });
    }

    return res.status(200).json({ result: text });
  } catch (err) {
    const error = err as { message?: string; status?: number };
    return res.status(error.status ?? 500).json({ error: error.message || 'Gemini API Error' });
  }
}
