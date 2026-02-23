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
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: `以下の会議の文字起こしから議事録を作成してください:\n\n${transcript}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `API Error: ${res.status}`);
  }

  const data = await res.json() as { content: Array<{ text: string }> };
  return data.content[0].text;
}
