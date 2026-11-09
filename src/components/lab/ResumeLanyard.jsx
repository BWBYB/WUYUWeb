import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import badgeBack from '../../assets/lanyard/badge-back.svg'
import badgeFront from '../../assets/lanyard/badge-front.svg'

const Lanyard = lazy(() => import('./Lanyard.jsx'))

export default function ResumeLanyard() {
  const hostRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [near, setNear] = useState(false)
  const [size, setSize] = useState(0.44)
  const [nudge, setNudge] = useState(0)

  useEffect(() => {
    const small = window.matchMedia('(max-width: 900px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setEnabled(!small.matches && !reduced.matches)
    sync()
    small.addEventListener('change', sync)
    reduced.addEventListener('change', sync)
    return () => {
      small.removeEventListener('change', sync)
      reduced.removeEventListener('change', sync)
    }
  }, [])

  // 画布铺满窗口，按高度把卡片稳定在 ~320px 高，避免高瘦屏幕把卡片放大。
  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const fit = () => {
      const height = host.clientHeight
      if (height <= 0) return
      const next = Math.min(0.44, Math.max(0.15, 320 / height))
      setSize((current) => (Math.abs(current - next) < 0.004 ? current : next))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  // 纸面完全盖住（工牌完整伸下来）的瞬间给一个摆动冲量，像被轻轻碰了一下
  useEffect(() => {
    if (!enabled) return undefined
    const root = document.documentElement
    let covered = root.getAttribute('data-resume-paper') === 'cover'
    if (covered) setNudge((n) => n + 1)
    const observer = new MutationObserver(() => {
      const next = root.getAttribute('data-resume-paper') === 'cover'
      if (next && !covered) setNudge((n) => n + 1)
      covered = next
    })
    observer.observe(root, { attributes: true, attributeFilter: ['data-resume-paper'] })
    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    if (!enabled) return undefined
    // 首屏空闲时就把模块和 WebGL 场景建好，否则第一次滚进关于屏会卡一下；
    // 滚动很快时仍由窗口的相交观察兜底，保证进入面板前已挂载。
    let canceled = false
    const warm = () => {
      if (!canceled) setNear(true)
    }
    const idleId = 'requestIdleCallback' in window
      ? window.requestIdleCallback(warm, { timeout: 900 })
      : window.setTimeout(warm, 300)
    const host = hostRef.current?.parentElement
    let observer
    if (host && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        setNear(true)
        observer.disconnect()
      })
      observer.observe(host)
    }
    return () => {
      canceled = true
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
      observer?.disconnect()
    }
  }, [enabled])

  return (
    <div ref={hostRef} className="resume-lanyard" aria-hidden="true">
      {enabled && near && (
        <Suspense fallback={null}>
          <Lanyard
            frontImage={badgeFront}
            backImage={badgeBack}
            orientation="portrait"
            size={size}
            anchor="center"
            anchorX={0.235}
            centerY={0.5}
            pointerTarget="window"
            strapLength={1}
            strapColor="#c4713f"
            strapWidth={0.55}
            cardColor="#efe7d6"
            cornerRadius={0.22}
            finish="glossy"
            metal="silver"
            gravity={1}
            damping={0.55}
            elasticity={0.5}
            breeze={0.3}
            interactive
            intro={false}
            nudge={nudge}
          />
        </Suspense>
      )}
    </div>
  )
}
