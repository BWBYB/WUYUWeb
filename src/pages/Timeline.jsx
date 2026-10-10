import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updates as defaultUpdates } from '../lib/content/updates'
import '../styles/effects.css'
import './Timeline.css'

function renderInlineMarkdown(value) {
  return String(value || '').split(/(\[[^\]]+\]\((?:\/(?!\/)|https?:|mailto:)[^)]+\))/g).map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (!match) return part
    const external = /^(https?:|mailto:)/i.test(match[2])
    return (
      <a
        key={`${match[2]}-${index}`}
        href={match[2]}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {match[1]}
      </a>
    )
  })
}

function UpdateRecord({ record, expanded, onToggle }) {
  return (
    <article className={`timeline-record ${expanded ? 'is-expanded' : ''}`}>
      <div className="timeline-marker" aria-hidden="true" />
      <button
        className="timeline-record-trigger"
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="timeline-record-meta">
          <time dateTime={record.date}>{record.date}</time>
          <span>{record.count} 项</span>
        </span>
        <span className="timeline-record-heading">
          <strong>{record.title}</strong>
          <span className="timeline-record-arrow" aria-hidden="true">{expanded ? '↑' : '↓'}</span>
        </span>
        {record.summaryHtml ? (
          <span className="timeline-record-summary" dangerouslySetInnerHTML={{ __html: record.summaryHtml }} />
        ) : record.summary ? <span className="timeline-record-summary">{renderInlineMarkdown(record.summary)}</span> : null}
      </button>

      <div className="timeline-record-details" hidden={!expanded}>
        {record.detailsHtml ? (
          <div dangerouslySetInnerHTML={{ __html: record.detailsHtml }} />
        ) : (
          <ul>
            {(record.items || []).map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}
          </ul>
        )}
      </div>
    </article>
  )
}

export default function Timeline({ records = defaultUpdates, preview = false }) {
  const [expandedIndex, setExpandedIndex] = useState(preview ? 0 : null)

  return (
    <div className={`timeline-page ${preview ? 'timeline-preview' : ''}`}>
      {!preview && (
        <header className="timeline-header fade-in fade-in-1">
          <div>
            <p className="timeline-eyebrow">网站迭代</p>
            <h1 className="timeline-title">更新记录</h1>
            <p className="timeline-desc">记录功能、体验与架构的每次变化。</p>
          </div>
          <div className="timeline-header-actions">
            {import.meta.env.DEV && <Link className="timeline-editor-link" to="/updates-editor">本地编辑 <span aria-hidden="true">✎</span></Link>}
            <Link className="timeline-back-link" to="/about">关于我 <span aria-hidden="true">→</span></Link>
          </div>
        </header>
      )}

      {records.length > 0 ? (
        <div className="timeline-list">
          {records.map((record, index) => (
            <UpdateRecord
              key={`${record.date}-${record.title}`}
              record={record}
              expanded={expandedIndex === index}
              onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            />
          ))}
        </div>
      ) : (
        <div className="timeline-empty glass-card">还没有更新记录。</div>
      )}
    </div>
  )
}

