import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './ui/Icon'
import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import useTocActive from '../hooks/useTocActive'
import './TocIsland.css'

const prefersReducedMotion = () => (
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

export default function TocIsland({ chapters, label = '目录' }) {
  const { settings } = useThemeSwitcherTheme()
  const { current, progress, direction } = useTocActive(chapters, { progress: true })
  const [open, setOpen] = useState(false)

  const pillRef = useRef(null)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const wasOpenRef = useRef(false)

  const count = chapters.length
  const safeIndex = Math.min(Math.max(current, 0), Math.max(count - 1, 0))
  const activeChapter = chapters[safeIndex]
  const activeTitle = activeChapter?.title ?? ''
  const minLevel = Math.min(...chapters.map((chapter) => chapter.level))
  const dashOffset = (100 - progress * 100).toFixed(2)

  // 原组件用 AnimatePresence 做标题切换：旧标题上滑淡出，新标题从下方滑入。
  // 这里保留同一套节奏，previous 只在新旧交替的 360ms 内存在。
  const [titleSwap, setTitleSwap] = useState({ current: activeTitle, previous: null, seq: 0 })

  if (titleSwap.current !== activeTitle) {
    setTitleSwap({ current: activeTitle, previous: titleSwap.current, seq: titleSwap.seq + 1 })
  }

  useEffect(() => {
    if (!titleSwap.previous) return undefined
    const timer = window.setTimeout(() => {
      setTitleSwap((prev) => ({ ...prev, previous: null }))
    }, 360)
    return () => window.clearTimeout(timer)
  }, [titleSwap.previous, titleSwap.seq])

  useEffect(() => {
    if (open) closeRef.current?.focus()
    else if (wasOpenRef.current) pillRef.current?.focus()
    wasOpenRef.current = open
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const media = window.matchMedia('(max-width: 1200px)')
    const sync = () => { if (media.matches) setOpen(false) }
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [open])

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open || event.key !== 'Tab') return

    const focusable = panelRef.current
      ? [...panelRef.current.querySelectorAll('button')].filter((element) => !element.disabled)
      : []
    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function handleSelect(event, chapter) {
    event.preventDefault()
    setOpen(false)
    const heading = document.getElementById(chapter.id)
    if (!heading) return
    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
      block: 'start',
    })
    window.history.replaceState(null, '', `#${chapter.id}`)
  }

  function handleBackToTitle() {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    })
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }

  const height = (settings?.height ?? 70) * 0.9

  return createPortal(
    <>
      <div
        className={`toc-island__backdrop${open ? ' is-visible' : ''}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <div
        className={`toc-island glass-card${open ? ' is-open' : ''}`}
        style={{ '--toc-h': `${height}px` }}
        onKeyDown={handleKeyDown}
      >
        <div className="toc-island__pill-layer" inert={open || undefined}>
          <button
            ref={pillRef}
            type="button"
            className="toc-island__pill"
            aria-expanded={open}
            aria-controls="toc-island-panel"
            aria-label={`展开${label}`}
            onClick={() => setOpen(true)}
          >
            <span className={`toc-island__titles${direction === 'up' ? ' is-up' : ''}`}>
              {titleSwap.previous !== null && (
                <span
                  key={`toc-out-${titleSwap.seq}`}
                  className="toc-island__title toc-island__title--out"
                  aria-hidden="true"
                >
                  {titleSwap.previous}
                </span>
              )}
              <span
                key={`toc-in-${titleSwap.seq}`}
                className={`toc-island__title${titleSwap.previous !== null ? ' toc-island__title--in' : ''}`}
              >
                {titleSwap.current}
              </span>
            </span>
          </button>
          <button
            type="button"
            className="toc-island__ring"
            aria-label="回到文章标题"
            title="回到文章标题"
            onClick={handleBackToTitle}
          >
            <svg className="toc-island__ring-graphic" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="toc-island__ring-track" cx="12" cy="12" r="10.75" />
              <circle
                className={`toc-island__ring-progress${progress <= 0 ? ' is-empty' : ''}`}
                cx="12"
                cy="12"
                r="10.75"
                pathLength="100"
                strokeDasharray="100"
                style={{ strokeDashoffset: dashOffset }}
                transform="rotate(-90 12 12)"
              />
            </svg>
            <Icon name="arrowUp" size={16} />
          </button>
        </div>

        <div
          ref={panelRef}
          id="toc-island-panel"
          className="toc-island__panel"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          inert={!open || undefined}
        >
          <div className="toc-island__header">
            <span className="toc-island__label">{label}</span>
            <button
              ref={closeRef}
              type="button"
              className="toc-island__close"
              aria-label="关闭目录"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="toc-island__list">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                type="button"
                className={[
                  'toc-island__item',
                  index === safeIndex ? 'is-current' : '',
                ].filter(Boolean).join(' ')}
                style={{ '--toc-indent': `${(chapter.level - minLevel) * 14 + 12}px` }}
                aria-current={index === safeIndex ? 'location' : undefined}
                onClick={(event) => handleSelect(event, chapter)}
              >
                <span className="toc-island__item-title">{chapter.title}</span>
                <span className="toc-island__item-dot" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
