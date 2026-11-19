import { useState } from 'react'
import './UpdatesPreview.css'

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
        {record.summary && (
          <span className="timeline-record-summary">{renderInlineMarkdown(record.summary)}</span>
        )}
      </button>

      <div className="timeline-record-details" hidden={!expanded}>
        <ul>
          {(record.items || []).map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default function UpdatesPreview({ records }) {
  const [expandedIndex, setExpandedIndex] = useState(0)

  return (
    <div className="updates-preview">
      {records.length > 0 ? (
        <div className="timeline-list">
          {records.map((record, index) => (
            <UpdateRecord
              key={`${record.date}-${record.title}-${index}`}
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
