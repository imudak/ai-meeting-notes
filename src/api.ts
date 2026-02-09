const SYSTEM_PROMPT = `あなたは会議の議事録を作成する専門家です。
与えられた会議の文字起こしテキストから、以下の構造で議事録をMarkdown形式で出力してください。

## 会議概要
（会議の目的・テーマを1-2文で）

## アジェンダ
- 議題1
- 議題2
...

## 議論の要点
### 議題ごとの要約

## 決定事項
- ✅ 決定事項1
- ✅ 決定事項2

## アクションアイテム
- [ ] 担当者: タスク内容（期限）

## 次のステップ
- 次回会議の予定やフォローアップ事項

注意:
- 簡潔かつ正確に
- 発言者が特定できる場合は名前を含める
- 不明な点は推測せず省略する
- 日本語で出力する`;

export async function generateMinutes(transcript: string, apiKey: string): Promise<string> {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `以下の会議の文字起こしから議事録を作成してください:\n\n${transcript}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}
