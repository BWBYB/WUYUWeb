import { useState } from 'react'
import Timeline from './Timeline'
import { updates } from '../lib/content/updates'
import './UpdatesEditor.css'

function createEmptyEntry() {
  return {
    date: new Date().toISOString().slice(0, 10),
    title: '',
    summary: '',
    itemsText: '具体更新内容',
  }
}

function toEditableEntry(record) {
  return {
    date: record.date,
    title: record.title,
    summary: record.summary,
    itemsText: record.items.join('\n'),
  }
}

function serializeEntries(entries) {
  return [
    '---',
    'title: 网站更新记录',
    '---',
    '',
    ...entries.flatMap(entry => {
      const items = entry.itemsText.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
      return [
        `## ${entry.date}｜${entry.title.trim()}`,
        '',
        `> ${entry.summary.trim()}`,
        '',
        ...items.map(item => `- ${item}`),
        '',
      ]
    }),
  ].join('\n').trimEnd()
}

export default function UpdatesEditor() {
  const [entries, setEntries] = useState(() => updates.map(toEditableEntry))
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const updateEntry = (index, field, value) => {
    setEntries(current => current.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    )))
  }

  const removeEntry = (index) => {
    setEntries(current => current.filter((_entry, entryIndex) => entryIndex !== index))
  }

  const save = async () => {
    if (entries.some(entry => !entry.date || !entry.title.trim() || !entry.summary.trim() || !entry.itemsText.trim())) {
      setStatus('请填写每条记录的日期、标题、摘要和至少一项更新内容。')
      return
    }

    setSaving(true)
    setStatus('正在保存…')
    try {
      const response = await fetch('/__wuyu/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: serializeEntries(entries) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '保存失败')
      setStatus('已保存到 content/updates.md，页面会自动刷新。')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const previewRecords = entries.map(entry => ({
    date: entry.date,
    title: entry.title || '未命名更新',
    summary: entry.summary,
    items: entry.itemsText.split(/\r?\n/).map(item => item.trim()).filter(Boolean),
    count: entry.itemsText.split(/\r?\n/).map(item => item.trim()).filter(Boolean).length,
  }))

  return (
    <div className="updates-editor-page">
      <header className="updates-editor-header">
        <div>
          <p className="updates-editor-eyebrow">仅本地开发环境</p>
          <h1>编辑更新记录</h1>
          <p>填写后保存到 <code>content/updates.md</code>，Vercel 公网版本不会包含此编辑入口。</p>
        </div>
        <div className="updates-editor-actions">
          <button type="button" className="updates-editor-secondary" onClick={() => setEntries(updates.map(toEditableEntry))}>重置</button>
          <button type="button" className="updates-editor-primary" onClick={save} disabled={saving}>{saving ? '保存中…' : '保存记录'}</button>
        </div>
      </header>

      {status && <p className="updates-editor-status" role="status">{status}</p>}

      <div className="updates-editor-layout">
        <section className="updates-editor-form" aria-label="更新记录表单">
          {entries.map((entry, index) => (
            <fieldset className="updates-editor-entry" key={`${index}-${entry.date}`}>
              <legend>记录 {index + 1}</legend>
              <button type="button" className="updates-editor-remove" onClick={() => removeEntry(index)} disabled={entries.length === 1}>删除</button>
              <label>
                日期
                <input type="date" value={entry.date} onChange={event => updateEntry(index, 'date', event.target.value)} />
              </label>
              <label>
                标题
                <input value={entry.title} placeholder="例如：更新记录页面上线" onChange={event => updateEntry(index, 'title', event.target.value)} />
              </label>
              <label>
                摘要
                <textarea rows="2" value={entry.summary} placeholder="一句话说明这次更新" onChange={event => updateEntry(index, 'summary', event.target.value)} />
              </label>
              <label>
                更新内容 <span>每行一项，可使用 Markdown 链接</span>
                <textarea rows="5" value={entry.itemsText} placeholder="每行一项更新内容" onChange={event => updateEntry(index, 'itemsText', event.target.value)} />
              </label>
            </fieldset>
          ))}
          <button type="button" className="updates-editor-add" onClick={() => setEntries(current => [createEmptyEntry(), ...current])}>+ 添加更新记录</button>
        </section>

        <section className="updates-editor-preview" aria-label="更新记录预览">
          <div className="updates-editor-preview-heading">
            <span>实时预览</span>
            <a href="/timeline">打开展示页 →</a>
          </div>
          <Timeline records={previewRecords} preview />
        </section>
      </div>
    </div>
  )
}

