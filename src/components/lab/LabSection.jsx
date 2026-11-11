import { useCallback, useEffect, useRef, useState } from 'react'
import './LabSection.css'

export default function LabSection({
  id,
  index,
  title,
  description,
  count,
  status,
  disabled = false,
  className = '',
  children,
}) {
  const [isSplit, setIsSplit] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const scrollSettleRef = useRef(null)
  const titleId = `${id}-title`
  const descId = `${id}-desc`
  const bodyId = `${id}-body`

  const open = useCallback(() => {
    if (disabled) return
    setHasMounted(true)
    // 先以收纳态挂载内容，下一帧再分裂，高度与淡入才有可过渡的起点。
    window.requestAnimationFrame(() => setIsSplit(true))
  }, [disabled])

  const scrollToHeader = useCallback(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sectionRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [])

  const settleScrollToHeader = useCallback(() => {
    scrollToHeader()
    // 展开前文档可能太短，滚动会被最大距离截断；等高度长出来再补一次落位。
    if (scrollSettleRef.current) window.clearTimeout(scrollSettleRef.current)
    scrollSettleRef.current = window.setTimeout(scrollToHeader, 520)
  }, [scrollToHeader])

  const collapse = useCallback(() => {
    setIsSplit(false)
    const header = headerRef.current
    if (!header) return
    header.focus({ preventScroll: true })
    // 从底部收起时内容会把页面拉短，顺手回到这一行，避免停在陌生位置。
    scrollToHeader()
  }, [scrollToHeader])

  useEffect(() => () => {
    if (scrollSettleRef.current) window.clearTimeout(scrollSettleRef.current)
  }, [])

  const toggle = useCallback(() => {
    if (disabled) return
    if (isSplit) {
      setIsSplit(false)
      return
    }
    setHasMounted(true)
    window.requestAnimationFrame(() => {
      setIsSplit(true)
      // 从目录下方展开时把这一行带到导航下面，内容才不会被视口底边裁掉。
      if ((sectionRef.current?.getBoundingClientRect().top ?? 0) > 120) {
        settleScrollToHeader()
      }
    })
  }, [disabled, isSplit, settleScrollToHeader])

  useEffect(() => {
    const reveal = () => {
      if (window.location.hash !== `#${id}`) return
      open()
      window.requestAnimationFrame(settleScrollToHeader)
    }

    reveal()
    window.addEventListener('hashchange', reveal)
    return () => window.removeEventListener('hashchange', reveal)
  }, [id, open, settleScrollToHeader])

  const sectionClass = [
    'lab-section',
    isSplit ? 'is-split' : 'is-tucked',
    disabled ? 'is-disabled' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <section
      ref={sectionRef}
      id={id}
      className={sectionClass}
      aria-labelledby={titleId}
    >
      <header className="lab-section__header">
        <h2 className="lab-section__heading">
          <button
            ref={headerRef}
            type="button"
            className="lab-section__toggle"
            aria-expanded={isSplit}
            aria-controls={bodyId}
            aria-disabled={disabled || undefined}
            aria-labelledby={titleId}
            aria-describedby={descId}
            title={disabled ? `${status || '暂不可用'}` : undefined}
            onClick={toggle}
          >
            <span className="lab-section__index" aria-hidden="true">{index}</span>
            <span className="lab-section__label">
              <span className="lab-section__title" id={titleId}>{title}</span>
              <span className="lab-section__desc" id={descId}>{description}</span>
            </span>
            {status ? <span className="lab-section__status">{status}</span> : null}
            {count ? <span className="lab-section__count">{count}</span> : null}
            <span className="lab-section__chevron" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 4.5L6 8l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </h2>
      </header>

      <div className="lab-section__track">
        <div
          className="lab-section__inner"
          id={bodyId}
          role="region"
          aria-labelledby={titleId}
          inert={isSplit ? undefined : true}
        >
          {hasMounted ? (
            <div className="lab-section__content">
              {children}
              <div className="lab-section__footer">
                <button type="button" className="lab-section__collapse" onClick={collapse}>
                  收起
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
