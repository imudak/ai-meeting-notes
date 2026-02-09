# AI議事録ジェネレーター

会議の文字起こしテキストからAIが構造化された議事録を自動生成するWebアプリ。

## 機能

- 📝 会議の文字起こしテキストを貼り付けて議事録を生成
- 🤖 Claude API（claude-sonnet-4-20250514）による高品質な要約
- 📋 クリップボードにコピー / Markdownファイルとして保存
- 🔒 APIキーはブラウザのlocalStorageにのみ保存（サーバーに送信されません）
- 🇯🇵 日本語UI

## 生成される議事録の構造

- 会議概要
- アジェンダ
- 議論の要点
- 決定事項
- アクションアイテム
- 次のステップ

## セットアップ

```bash
npm install
npm run dev
```

## APIキーの取得

[Anthropic Console](https://console.anthropic.com/settings/keys) からAPIキーを取得し、アプリの設定画面で入力してください。

## 技術スタック

- React + TypeScript + Vite
- Claude API (Anthropic)

## ライセンス

MIT
