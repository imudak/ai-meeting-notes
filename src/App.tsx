import { useState, useEffect, useRef } from 'react'
import { generateMinutes } from './api'
import { 
  getAllTemplates, 
  getTemplate, 
  isPresetTemplate,
  addCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate
} from './templates'
import type { Template } from './templates'
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
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templates, setTemplates] = useState<Template[]>(getAllTemplates())

  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // APIキー未入力でもGemini Flashで動作するため、自動表示は不要
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

  const refreshTemplates = () => {
    setTemplates(getAllTemplates())
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate({ ...template })
  }

  const handleCreateCustom = () => {
    const baseTemplate = getTemplate(templateId)
    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: `${baseTemplate.name}のコピー`,
      systemPrompt: baseTemplate.systemPrompt
    }
    setEditingTemplate(newTemplate)
  }

  const handleSaveTemplate = () => {
    if (!editingTemplate) return
    if (isPresetTemplate(editingTemplate.id)) {
      // プリセットの場合は新規カスタムテンプレートとして保存
      const newTemplate = {
        ...editingTemplate,
        id: `custom-${Date.now()}`,
        name: `${editingTemplate.name}（カスタム）`
      }
      addCustomTemplate(newTemplate)
      saveTemplateId(newTemplate.id)
    } else {
      // カスタムテンプレートの更新または追加
      const exists = templates.some(t => t.id === editingTemplate.id)
      if (exists) {
        updateCustomTemplate(editingTemplate.id, editingTemplate)
      } else {
        addCustomTemplate(editingTemplate)
      }
      saveTemplateId(editingTemplate.id)
    }
    refreshTemplates()
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = (id: string) => {
    if (isPresetTemplate(id)) return
    if (!confirm('このカスタムテンプレートを削除しますか？')) return
    deleteCustomTemplate(id)
    if (templateId === id) saveTemplateId('default')
    refreshTemplates()
  }

  const handleGenerate = async () => {
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
          <h3>🔑 APIキー設定（任意）</h3>
          <p className="settings-desc">Anthropic APIキーをお持ちの場合は入力してください（任意）。未入力の場合はGemini Flashを使用します。キーはブラウザのlocalStorageに保存され、外部には送信されません。</p>
          <div className="key-input-row">
            <input
              type="password"
              placeholder="sk-ant-... （未入力でもGemini Flashで動作します）"
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
            />
            <button className="btn-secondary" onClick={() => setShowSettings(false)}>閉じる</button>
          </div>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="key-link">
            Anthropic APIキーの取得はこちら →
          </a>

          <h3 style={{ marginTop: '24px' }}>📄 テンプレート管理</h3>
          <p className="settings-desc">議事録の出力フォーマットを選択・カスタマイズできます。</p>
          
          <div className="template-actions">
            <button className="btn-primary" onClick={handleCreateCustom}>
              ➕ カスタムテンプレートを作成
            </button>
          </div>

          <div className="template-list">
            <h4>プリセットテンプレート</h4>
            {templates.filter(t => isPresetTemplate(t.id)).map(t => (
              <div key={t.id} className="template-item">
                <label className="template-option">
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={templateId === t.id}
                    onChange={e => saveTemplateId(e.target.value)}
                  />
                  <span>{t.name}</span>
                </label>
                <button 
                  className="btn-secondary btn-small" 
                  onClick={() => handleEditTemplate(t)}
                  title="このテンプレートをベースにカスタム作成"
                >
                  📝 編集
                </button>
              </div>
            ))}

            {templates.filter(t => !isPresetTemplate(t.id)).length > 0 && (
              <>
                <h4 style={{ marginTop: '16px' }}>カスタムテンプレート</h4>
                {templates.filter(t => !isPresetTemplate(t.id)).map(t => (
                  <div key={t.id} className="template-item">
                    <label className="template-option">
                      <input
                        type="radio"
                        name="template"
                        value={t.id}
                        checked={templateId === t.id}
                        onChange={e => saveTemplateId(e.target.value)}
                      />
                      <span>{t.name}</span>
                    </label>
                    <button 
                      className="btn-secondary btn-small" 
                      onClick={() => handleEditTemplate(t)}
                    >
                      📝 編集
                    </button>
                    <button 
                      className="btn-danger btn-small" 
                      onClick={() => handleDeleteTemplate(t.id)}
                    >
                      🗑️ 削除
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {editingTemplate && (
        <div className="modal-overlay" onClick={() => setEditingTemplate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>✏️ テンプレート編集</h2>
            <div className="form-group">
              <label>テンプレート名</label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                placeholder="例: 週次定例会議"
              />
            </div>
            <div className="form-group">
              <label>システムプロンプト（議事録フォーマット）</label>
              <textarea
                rows={20}
                value={editingTemplate.systemPrompt}
                onChange={e => setEditingTemplate({...editingTemplate, systemPrompt: e.target.value})}
                placeholder="Claudeに送信されるプロンプトを記述してください..."
              />
              <small className="hint">
                このプロンプトが議事録の出力形式を決定します。Markdown形式で構造を指定してください。
              </small>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingTemplate(null)}>
                キャンセル
              </button>
              <button className="btn-primary" onClick={handleSaveTemplate}>
                💾 保存
              </button>
            </div>
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
        <p>Powered by Gemini Flash / Claude API · APIキーはお使いのブラウザにのみ保存されます</p>
      </footer>
    </div>
  )
}

export default App
