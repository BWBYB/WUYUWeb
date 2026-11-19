import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updates } from '../lib/content/updates'
import Icon from './ui/Icon'
import Segmented from './ui/Segmented'
import Tag from './ui/Tag'
import './Changelog.css'

const CHANGELOG_TAG_LABELS = {
  new: '新增',
  improved: '优化',
  fixed: '修复',
}

const normalizeFilter = value => (CHANGELOG_TAG_LABELS[value] ? value : 'all')

const changelogFilters = [
  { id: 'all', title: '全部', count: updates.length },
  ...Object.entries(CHANGELOG_TAG_LABELS).map(([id, title]) => ({
    id,
    title,
    count: updates.filter(entry => entry.tags.includes(id)).length,
  })),
]

export default function Changelog({
  limit = null,
  headingId = 'changelog',
  title = '更新日志',
  allLogsHref = null,
  initialFilter = 'all',
  showEditorLink = false,
}) {
  const [filter, setFilter] = useState(() => normalizeFilter(initialFilter))
  const filtered = filter === 'all'
    ? updates
    : updates.filter(entry => entry.tags.includes(filter))
  const visible = limit == null ? filtered : filtered.slice(0, limit)

  const links = (
    <div className="changelog-links">
      {allLogsHref && (
        <Link className="btn btn--secondary btn--sm" to={allLogsHref}>
          全部日志（共 {updates.length} 条）<Icon name="chevronRight" size={14} />
        </Link>
      )}
      <a
        className="btn btn--secondary btn--sm"
        href="https://github.com/BWBYB/WUYUWeb/commits/main/"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub 提交 <Icon name="github" size={14} />
      </a>
      {showEditorLink && import.meta.env.DEV && (
        <Link className="btn btn--primary btn--sm" to="/updates-editor">
          本地编辑 <Icon name="pencil" size={14} />
        </Link>
      )}
    </div>
  )

  return (
    <section className="changelog glass-card fade-in fade-in-2" aria-labelledby={headingId}>
      <header className="changelog-head">
        <h2 id={headingId} className="changelog-title">{title}</h2>
        <div className="changelog-toolbar">
          <Segmented
            className="segmented--compact"
            label="筛选更新日志"
            options={changelogFilters}
            value={filter}
            onChange={setFilter}
          />
          {links}
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        当前显示 {visible.length} 条{visible.length === filtered.length ? '' : `，共 ${filtered.length} 条`}
      </p>

      {visible.length > 0 ? (
        <div className="changelog-list">
          {visible.map((entry, index) => (
            <article
              key={`${filter}-${entry.date}-${index}`}
              className="changelog-entry"
              style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
            >
              <div className="changelog-meta">
                <time className="changelog-date" dateTime={entry.date}>
                  {entry.date.replaceAll('-', '.')}
                </time>
                <span className="changelog-version">v{entry.date.slice(0, 7).replace('-', '.')}</span>
              </div>
              <div className="changelog-body">
                {entry.tags.length > 0 && (
                  <div className="changelog-tags">
                    {entry.tags.map(kind => (
                      <Tag
                        key={kind}
                        className={`changelog-tag changelog-tag--${kind}`}
                      >
                        {CHANGELOG_TAG_LABELS[kind]}
                      </Tag>
                    ))}
                  </div>
                )}
                <h3 className="changelog-entry-title">{entry.title}</h3>
                <ul className="changelog-items">
                  {entry.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="changelog-empty">这个筛选下还没有记录。</p>
      )}

      <footer className="changelog-foot">
        {links}
      </footer>
    </section>
  )
}
