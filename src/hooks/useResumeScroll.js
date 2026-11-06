import { useEffect } from 'react'
import Lenis from 'lenis'

// 桌面：Lenis 平滑滚动，不做吸附；触摸端保留系统原生滚动。
export default function useResumeScroll() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!finePointer.matches || reducedMotion.matches) return

    const lenis = new Lenis({
      duration: 1.5,
      smoothWheel: true,
      syncTouch: false,
      anchors: true,
      wheelMultiplier: 0.85,
      stopInertiaOnNavigate: true,
    })

    let frame = null
    const raf = (time) => {
      lenis.raf(time)
      frame = window.requestAnimationFrame(raf)
    }
    frame = window.requestAnimationFrame(raf)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])
}
