# AI議事録ジェネレーター

## 概要

会議の文字起こしテキストをClaude APIで構造化された議事録に自動変換するWebアプリケーション。  
React + TypeScript + Viteで構築されたクライアントサイドアプリ。

## 主要機能

- 📝 **議事録自動生成**: 会議の文字起こしテキストから議事録を生成
- 🎨 **Markdownプレビュー**: 生成された議事録をプレビュー表示
- 📤 **エクスポート**: Markdown/PDF/DOCX形式で保存可能
- 🎯 **テンプレート管理**: 議事録フォーマットのカスタマイズ
- 🔒 **セキュア**: APIキーはブラウザのlocalStorageにのみ保存

## プロジェクト構造

```
ai-meeting-notes/
├── src/
│   ├── App.tsx          # メインコンポーネント
│   ├── App.css          # スタイル
│   ├── api.ts           # Claude API連携
│   ├── components/      # UIコンポーネント
│   ├── lib/             # ユーティリティ
│   └── templates/       # 議事録テンプレート
├── public/              # 静的ファイル
├── dist/                # ビルド出力
└── package.json
```

## 技術スタック

- **フレームワーク**: React 19.2 + TypeScript 5.9
- **ビルドツール**: Vite 7.3
- **AI**: Claude API (claude-sonnet-4-20250514)
- **スタイリング**: CSS Variables + CSS Modules
- **エクスポート**: html2canvas + jsPDF, docx

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## APIキー設定

1. [Anthropic Console](https://console.anthropic.com/settings/keys) でAPIキーを取得
2. アプリの「⚙️ 設定」ボタンからAPIキーを入力
3. APIキーはlocalStorageに保存され、外部には送信されません

## 議事録のフォーマット

デフォルトテンプレート:

```markdown
## 会議概要
（会議の目的・テーマ）

## アジェンダ
- 議題1
- 議題2

## 議論の要点
### 議題ごとの要約

## 決定事項
- ✅ 決定事項

## アクションアイテム
- [ ] 担当者: タスク（期限）

## 次のステップ
```

## 開発ガイドライン

### コミット規約

- jjを使用: `jj commit -m "message"`
- コミットメッセージは日本語OK

### 追加予定の機能

- [ ] 複数テンプレートの切り替え
- [ ] 会議録の履歴管理（IndexedDB）
- [ ] リアルタイム音声入力対応
- [ ] 多言語対応（英語議事録）

## デプロイ

### Vercel

```bash
# vercel.jsonが設定済み
vercel deploy
```

### Cloudflare Pages

```bash
# wrangler.tomlが設定済み
npx wrangler pages deploy dist
```

環境変数不要（全てクライアントサイド処理）。

## トラブルシューティング

### APIエラー

- APIキーが正しく設定されているか確認
- Anthropic APIの利用制限を確認
- CORS設定: `anthropic-dangerous-direct-browser-access: true` ヘッダー必須

### ビルドエラー

```bash
# キャッシュクリア
rm -rf node_modules dist
npm install
npm run build
```

## ライセンス

MIT

## 作成者

合同会社まる百工房（Maruhuku Kobo LLC）  
Claude Code Agent

## 作業プロトコル

作業開始・終了時は `~/projects/flow-manager/docs/flows/work-protocol.md` を参照。

百式page_id: 3071aeb6-4b1d-8186-bb65-c0e6a38cd3cc



## 次のアクション
- 議事録形式カスタマイズ等の機能拡張
