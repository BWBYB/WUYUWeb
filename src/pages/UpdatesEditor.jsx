import { useState } from 'react'
import UpdatesPreview from '../components/UpdatesPreview'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'
import Field from '../components/ui/Field'
import { updates } from '../lib/content/updates'
import './UpdatesEditor.css'

const TAG_OPTIONS = [
  { id: 'new', label: '新增' },
  { id: 'improved', label: '优化' },
  { id: 'fixed', label: '修复' },
]
const TAG_LABELS = Object.fromEntries(TAG_OPTIONS.map(option => [option.id, option.label]))

function createEmptyEntry() {
  return {
    date: new Date().toISOString().slice(0, 10),
    title: '',
    tags: [],
    summary: '',
    itemsText: '具体更新内容',
  }
}

function toEditableEntry(record) {
  return {
    date: record.date,
    title: record.title,
    tags: record.tags || [],
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
      const lines = [
        `## ${entry.date}｜${entry.title.trim()}`,
        '',
      ]
      if (entry.tags.length) {
        lines.push(`标签：${entry.tags.map(tag => TAG_LABELS[tag]).join('、')}`, '')
      }
      lines.push(
        `> ${entry.summary.trim()}`,
        '',
        ...items.map(item => `- ${item}`),
        '',
      )
      return lines
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

  const toggleTag = (index, tag) => {
    setEntries(current => current.map((entry, entryIndex) => {
      if (entryIndex !== index) return entry
      const tags = entry.tags.includes(tag)
        ? entry.tags.filter(item => item !== tag)
        : [...entry.tags, tag]
      return { ...entry, tags }
    }))
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
    tags: entry.tags,
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
          <Button variant="secondary" onClick={() => setEntries(updates.map(toEditableEntry))}>重置</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{saving ? '保存中…' : '保存记录'}</Button>
        </div>
      </header>

      {status && <p className="updates-editor-status" role="status">{status}</p>}

      <div className="updates-editor-layout">
        <section className="updates-editor-form" aria-label="更新记录表单">
          {entries.map((entry, index) => (
            <fieldset className="updates-editor-entry" key={`${index}-${entry.date}`}>
              <legend>记录 {index + 1}</legend>
              <button type="button" className="updates-editor-remove" onClick={() => removeEntry(index)} disabled={entries.length === 1}>删除</button>
              <Field label="日期">
                <input className="control" type="date" value={entry.date} onChange={event => updateEntry(index, 'date', event.target.value)} />
              </Field>
              <Field label="标题">
                <input className="control" value={entry.title} placeholder="例如：更新记录页面上线" onChange={event => updateEntry(index, 'title', event.target.value)} />
              </Field>
              <div className="field">
                <span className="field__label" id={`updates-tags-${index}`}>标签</span>
                <div className="updates-editor-tags" role="group" aria-labelledby={`updates-tags-${index}`}>
                  {TAG_OPTIONS.map(option => (
                    <Checkbox
                      key={option.id}
                      label={option.label}
                      checked={entry.tags.includes(option.id)}
                      onChange={() => toggleTag(index, option.id)}
                    />
                  ))}
                </div>
                <span className="field__hint">可选，用于关于页筛选</span>
              </div>
              <Field label="摘要">
                <textarea className="control" rows="2" value={entry.summary} placeholder="一句话说明这次更新" onChange={event => updateEntry(index, 'summary', event.target.value)} />
              </Field>
              <Field label="更新内容" hint="每行一项，可使用 Markdown 链接">
                <textarea className="control" rows="5" value={entry.itemsText} placeholder="每行一项更新内容" onChange={event => updateEntry(index, 'itemsText', event.target.value)} />
              </Field>
            </fieldset>
          ))}
          <button type="button" className="updates-editor-add" onClick={() => setEntries(current => [createEmptyEntry(), ...current])}>+ 添加更新记录</button>
        </section>

        <section className="updates-editor-preview" aria-label="更新记录预览">
          <div className="updates-editor-preview-heading">
            <span>实时预览</span>
            <a href="/about">打开关于页 →</a>
          </div>
          <UpdatesPreview records={previewRecords} />
        </section>
      </div>
    </div>
  )
}

