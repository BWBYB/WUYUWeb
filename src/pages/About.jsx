import { useState } from 'react'
import { Link } from 'react-router-dom'
import AboutTimeline from '../components/AboutTimeline'
import { updates } from '../lib/content/updates'
import Icon from '../components/ui/Icon'
import Segmented from '../components/ui/Segmented'
import Tag from '../components/ui/Tag'
import '../styles/effects.css'
import './About.css'

const CHANGELOG_TAG_LABELS = {
  new: '新增',
  improved: '优化',
  fixed: '修复',
}

const changelogFilters = [
  { id: 'all', title: '全部', count: updates.length },
  ...Object.entries(CHANGELOG_TAG_LABELS).map(([id, title]) => ({
    id,
    title,
    count: updates.filter(entry => entry.tags.includes(id)).length,
  })),
]

export default function About() {
  const [changelogFilter, setChangelogFilter] = useState('all')
  const visibleChangelog = changelogFilter === 'all'
    ? updates
    : updates.filter(entry => entry.tags.includes(changelogFilter))

  return (
    <div className="about-page">
      <header className="about-intro fade-in fade-in-1">
        <div className="about-intro-inner">
          <h1 className="about-intro-title">欢迎来到 WUYU 的个人网站。</h1>
          <p className="about-intro-subtitle">这里收录着网站的时间线与更新日志。</p>
          <p className="about-intro-lead">
            这个网站主要用于存放我的一些思考、文章与前端的探索。下滑可以查看网站的更新历史与里程碑。
          </p>
        </div>
      </header>

      <AboutTimeline />

      <section
        className="about-changelog glass-card fade-in fade-in-2"
        aria-labelledby="about-changelog"
      >
        <header className="about-changelog-head">
          <div className="about-changelog-intro">
            <h2 id="about-changelog" className="about-changelog-title">更新日志</h2>
            <p className="about-changelog-desc">站点的细节改动，按时间倒序。</p>
          </div>
          <div className="about-changelog-controls">
            <Segmented
              className="about-changelog-filter"
              label="筛选更新日志"
              options={changelogFilters}
              value={changelogFilter}
              onChange={setChangelogFilter}
            />
            {import.meta.env.DEV && (
              <Link className="about-changelog-all about-changelog-edit" to="/updates-editor">
                本地编辑 <Icon name="pencil" size={14} />
              </Link>
            )}
          </div>
        </header>

        <p className="sr-only" aria-live="polite">当前显示 {visibleChangelog.length} 条更新</p>

        {visibleChangelog.length > 0 ? (
          <div className="about-changelog-list">
            {visibleChangelog.map((entry, index) => (
              <article
                key={`${changelogFilter}-${entry.date}`}
                className="about-changelog-entry"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="about-changelog-meta">
                  <time className="about-changelog-date" dateTime={entry.date}>
                    {entry.date.replaceAll('-', '.')}
                  </time>
                  <span className="about-changelog-version">v{entry.date.slice(0, 7).replace('-', '.')}</span>
                </div>
                <div className="about-changelog-body">
                  {entry.tags.length > 0 && (
                    <div className="about-changelog-tags">
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
                  <h3 className="about-changelog-entry-title">{entry.title}</h3>
                  <ul className="about-changelog-items">
                    {entry.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="about-changelog-empty">这个筛选下还没有记录。</p>
        )}

        <footer className="about-changelog-foot">
          <p>完整提交记录在 GitHub。</p>
          <a
            className="about-changelog-all"
            href="https://github.com/BWBYB/WUYUWeb/commits/main/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub 提交 <Icon name="github" size={14} />
          </a>
        </footer>
      </section>
    </div>
  )
}
