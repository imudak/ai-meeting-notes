import { fetchAnthropicContent } from "@maruhuku/ai-client";

export async function generateMinutes(
  transcript: string,
  apiKey: string,
  systemPrompt: string
): Promise<string> {
  // APIキーが未入力の場合はVercel Function経由でGemini Flashを使用
  if (!apiKey) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, systemPrompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `API Error: ${res.status}`);
    }

    const data = await res.json() as { result: string };
    return data.result;
  }

  // APIキーがある場合はAnthropicを直接呼び出す
  return fetchAnthropicContent(
    `以下の会議の文字起こしから議事録を作成してください:\n\n${transcript}`,
    {
      apiKey,
      system: systemPrompt,
      dangerouslyAllowBrowser: true,
    }
  );
}
