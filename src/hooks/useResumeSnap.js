import { useEffect } from 'react'
import Lenis from 'lenis'
import Snap from 'lenis/snap'

// 桌面：Lenis 平滑滚动 + Snap；触摸端走 Resume.css 里的原生 scroll-snap。
export default function useResumeSnap() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('resume-snap')

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!finePointer.matches || reducedMotion.matches) {
      return () => root.classList.remove('resume-snap')
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
    })

    const snap = new Snap(lenis, {
      type: 'proximity',
      distanceThreshold: '35%',
      debounce: 300,
      duration: 0.8,
      easing: (t) => 1 - (1 - t) ** 3,
    })

    const sections = [
      document.querySelector('.resume-hero'),
      ...document.querySelectorAll('.resume-section'),
    ].filter(Boolean)

    const removeSnaps = snap.addElements(sections, { align: 'start' })
    let frame = null

    const raf = (time) => {
      lenis.raf(time)
      frame = window.requestAnimationFrame(raf)
    }
    frame = window.requestAnimationFrame(raf)

    const onResize = () => snap.resize()
    window.addEventListener('resize', onResize)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      removeSnaps()
      snap.destroy()
      lenis.destroy()
      root.classList.remove('resume-snap')
    }
  }, [])
}
