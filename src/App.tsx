import { useState, useEffect, useRef } from 'react'
import { generateMinutes } from './api'
import { TEMPLATES, getTemplate } from './templates'
import { copyMarkdown, downloadMarkdown, downloadPDF, downloadDOCX } from './export'
import { MarkdownPreview } from './components/MarkdownPreview'
import './App.css'

function App() {
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude-api-key') || '')
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const [templateId, setTemplateId] = useState(() => localStorage.getItem('template-id') || 'default')
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')
  const [exporting, setExporting] = useState(false)

  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!apiKey) setShowSettings(true)
  }, [])

  const saveKey = (key: string) => {
    setApiKey(key)
    if (key) localStorage.setItem('claude-api-key', key)
    else localStorage.removeItem('claude-api-key')
  }

  const saveTemplateId = (id: string) => {
    setTemplateId(id)
    localStorage.setItem('template-id', id)
  }

  const handleGenerate = async () => {
    if (!apiKey) { setShowSettings(true); return }
    if (!transcript.trim()) return
    setLoading(true); setError(''); setResult('')
    try {
      const template = getTemplate(templateId)
      const md = await generateMinutes(transcript, apiKey, template.systemPrompt)
      setResult(md)
    } catch (e: any) {
      setError(e.message || '生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await copyMarkdown(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMd = () => {
    downloadMarkdown(result)
  }

  const handleDownloadPDF = async () => {
    if (!resultRef.current) return
    setExporting(true)
    try {
      await downloadPDF(resultRef.current)
    } catch (e: any) {
      setError('PDF出力に失敗しました: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadDOCX = async () => {
    setExporting(true)
    try {
      await downloadDOCX(result)
    } catch (e: any) {
      setError('DOCX出力に失敗しました: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>📝 AI議事録ジェネレーター</h1>
          <button className="btn-secondary settings-btn" onClick={() => setShowSettings(!showSettings)}>
            ⚙️ 設定
          </button>
        </div>
        <p className="subtitle">会議の文字起こしを貼り付けて、構造化された議事録を自動生成</p>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <h3>🔑 APIキー設定</h3>
          <p className="settings-desc">Anthropic APIキーを入力してください。キーはブラウザのlocalStorageに保存され、外部には送信されません。</p>
          <div className="key-input-row">
            <input
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
            />
            <button className="btn-secondary" onClick={() => setShowSettings(false)}>閉じる</button>
          </div>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="key-link">
            APIキーの取得はこちら →
          </a>

          <h3 style={{ marginTop: '24px' }}>📄 テンプレート選択</h3>
          <p className="settings-desc">議事録の出力フォーマットを選択できます。</p>
          <div className="template-selector">
            {TEMPLATES.map(t => (
              <label key={t.id} className="template-option">
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={templateId === t.id}
                  onChange={e => saveTemplateId(e.target.value)}
                />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <main>
        <section className="input-section">
          <h2>会議の文字起こし</h2>
          <textarea
            rows={12}
            placeholder="ここに会議の文字起こしテキストを貼り付けてください..."
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
          />
          <div className="input-footer">
            <span className="char-count">{transcript.length.toLocaleString()} 文字</span>
            <button className="btn-primary generate-btn" onClick={handleGenerate} disabled={loading || !transcript.trim()}>
              {loading ? '⏳ 生成中...' : '✨ 議事録を生成'}
            </button>
          </div>
        </section>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {result && (
          <section className="result-section">
            <div className="result-header">
              <h2>生成された議事録</h2>
              <div className="result-actions">
                <div className="view-toggle">
                  <button
                    className={`btn-toggle ${viewMode === 'preview' ? 'active' : ''}`}
                    onClick={() => setViewMode('preview')}
                  >
                    👁️ プレビュー
                  </button>
                  <button
                    className={`btn-toggle ${viewMode === 'raw' ? 'active' : ''}`}
                    onClick={() => setViewMode('raw')}
                  >
                    📝 Markdown
                  </button>
                </div>
                <button className="btn-secondary" onClick={handleCopy}>
                  {copied ? '✅ コピー済み' : '📋 コピー'}
                </button>
                <button className="btn-secondary" onClick={handleDownloadMd}>
                  💾 Markdown
                </button>
                <button className="btn-secondary" onClick={handleDownloadPDF} disabled={exporting}>
                  {exporting ? '⏳' : '📄'} PDF
                </button>
                <button className="btn-secondary" onClick={handleDownloadDOCX} disabled={exporting}>
                  {exporting ? '⏳' : '📘'} DOCX
                </button>
              </div>
            </div>
            <div className="result-content" ref={resultRef}>
              {viewMode === 'preview' ? (
                <MarkdownPreview markdown={result} />
              ) : (
                <pre>{result}</pre>
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Powered by Claude API · APIキーはお使いのブラウザにのみ保存されます</p>
      </footer>
    </div>
  )
}

export default App
