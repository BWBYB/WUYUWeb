import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ChapterRail from '../components/ChapterRail'
import Badge from '../components/ui/Badge'
import Empty from '../components/ui/Empty'
import Icon from '../components/ui/Icon'
import Segmented from '../components/ui/Segmented'
import {
  libraryCategories,
  libraryComponents,
  libraryStatus,
  libraryStatusTone,
} from '../lib/library/catalog'
import './Library.css'

const pad = (value) => String(value).padStart(2, '0')

function ComponentCard({ component, index }) {
  const Preview = component.preview

  return (
    <Link className="library-card" to={`/components/${component.slug}`}>
      <span className="library-card__preview" aria-hidden="true">
        <Preview />
      </span>
      <span className="library-card__body">
        <span className="library-card__meta">
          <span>{pad(index)}</span>
          <span>{component.en}</span>
          <Badge className="library-card__status" tone={libraryStatusTone[component.status]}>
            {libraryStatus[component.status]}
          </Badge>
        </span>
        <span className="library-card__title-row">
          <span className="library-card__title">{component.name}</span>
          <span className="library-card__arrow" aria-hidden="true">↗</span>
        </span>
      </span>
    </Link>
  )
}

export default function Library() {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  const counts = useMemo(() => (
    Object.fromEntries(
      libraryCategories.map((item) => [
        item.id,
        libraryComponents.filter((component) => component.category === item.id).length,
      ]),
    )
  ), [])

  const tabs = useMemo(
    () => [
      { id: 'all', title: '全部', count: libraryComponents.length },
      ...libraryCategories.map((category) => ({
        id: category.id,
        title: category.title,
        count: counts[category.id],
      })),
    ],
    [counts],
  )

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = libraryComponents.filter((component) => {
      if (category !== 'all' && component.category !== category) return false
      if (!needle) return true
      return [component.name, component.en, component.summary]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })

    return libraryCategories
      .map((item) => ({
        ...item,
        items: matches.filter((component) => component.category === item.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [category, query])

  const chapters = useMemo(
    () => groups.map((group) => ({ id: `library-${group.id}`, title: group.title, level: 2 })),
    [groups],
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const typing = target instanceof HTMLElement
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const visible = groups.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <div className="library-page">
      <header className="library-header fade-in fade-in-1">
        <span className="library-kicker">COMPONENT LIBRARY</span>
        <h1 className="library-title">组件库</h1>
      </header>

      <div className="library-toolbar fade-in fade-in-2">
        <Segmented
          className="library-filter"
          label="组件分类"
          options={tabs}
          value={category}
          onChange={setCategory}
        />
        <div className="library-search">
          <Icon name="search" size={16} className="library-search__icon" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="搜索组件"
            aria-label="搜索组件"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
            }}
          />
          {query ? (
            <button
              type="button"
              className="library-search__clear"
              aria-label="清除搜索"
              onClick={() => setQuery('')}
            >
              <Icon name="close" size={14} />
            </button>
          ) : (
            <kbd className="library-search__key">/</kbd>
          )}
        </div>
      </div>

      {visible === 0 ? (
        <Empty
          className="empty--panel"
          text={`没有匹配「${query}」的组件。`}
        >
          <button
            type="button"
            className="btn btn--text btn--sm"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
          >
            清除筛选
          </button>
        </Empty>
      ) : (
        <div className="library-groups">
          {groups.map((group, groupIndex) => (
            <section
              key={group.id}
              id={`library-${group.id}`}
              className="library-group"
              aria-labelledby={`library-${group.id}-title`}
            >
              <div className="library-group__head">
                <div className="library-group__heading">
                  <span className="library-group__index" aria-hidden="true">{pad(groupIndex + 1)}</span>
                  <h2 id={`library-${group.id}-title`}>{group.title}</h2>
                  <span className="library-group__en">{group.en}</span>
                </div>
                <span className="library-group__count">{pad(group.items.length)} 个</span>
              </div>
              <div className="library-grid">
                {group.items.map((component) => (
                  <ComponentCard
                    key={component.slug}
                    component={component}
                    index={libraryComponents.indexOf(component) + 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ChapterRail
        chapters={groups.length >= 3 ? chapters : []}
        mode={groups.length >= 3 ? 'chapters' : 'progress'}
        label={groups.length >= 3 ? '分类目录' : '页面进度'}
      />
    </div>
  )
}
