import { useState, useEffect } from 'react'
import { generateMinutes } from './api'
import './App.css'

function App() {
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude-api-key') || '')
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!apiKey) setShowSettings(true)
  }, [])

  const saveKey = (key: string) => {
    setApiKey(key)
    if (key) localStorage.setItem('claude-api-key', key)
    else localStorage.removeItem('claude-api-key')
  }

  const handleGenerate = async () => {
    if (!apiKey) { setShowSettings(true); return }
    if (!transcript.trim()) return
    setLoading(true); setError(''); setResult('')
    try {
      const md = await generateMinutes(transcript, apiKey)
      setResult(md)
    } catch (e: any) {
      setError(e.message || '生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadMd = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `議事録_${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
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
                <button className="btn-secondary" onClick={copyToClipboard}>
                  {copied ? '✅ コピー済み' : '📋 コピー'}
                </button>
                <button className="btn-secondary" onClick={downloadMd}>
                  💾 Markdownで保存
                </button>
              </div>
            </div>
            <div className="result-content">
              <pre>{result}</pre>
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
