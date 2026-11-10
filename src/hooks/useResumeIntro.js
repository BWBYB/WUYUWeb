import { useEffect } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// 首屏吸附 + 内容窗口：入场进度（0 → 1）与窗口内平移量写成 CSS 变量。
// 只写 DOM，不触发 React 重渲染；Lenis 走原生滚动，scroll 事件照常触发。
export default function useResumeIntro(ref, innerRef) {
  useEffect(() => {
    const intro = ref.current
    const inner = innerRef.current
    if (!intro || !inner) return

    const win = inner.parentElement
    const hero = intro.querySelector('.resume-hero')
    const small = window.matchMedia('(max-width: 768px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    let frame = null
    let limit = 0
    let paperCovered = false

    // 纸面盖满视口后导航要换墨色，否则深色主题的浅字会压在浅纸上
    const setPaperCover = (on) => {
      if (on === paperCovered) return
      paperCovered = on
      if (on) root.setAttribute('data-resume-paper', 'cover')
      else root.removeAttribute('data-resume-paper')
    }

    const clear = () => {
      intro.style.removeProperty('--intro-progress')
      intro.style.removeProperty('--window-scroll')
      intro.style.removeProperty('--window-shift')
      setPaperCover(false)
    }

    const update = () => {
      frame = null
      if (small.matches || reduced.matches) {
        clear()
        return
      }
      const top = intro.getBoundingClientRect().top
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight
      const progress = clamp(-top / heroHeight, 0, 1)
      const shift = clamp(-top - heroHeight, 0, limit)
      intro.style.setProperty('--intro-progress', progress.toFixed(4))
      intro.style.setProperty('--window-shift', `${shift.toFixed(1)}px`)
      setPaperCover(progress >= 1)
    }

    const schedule = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(update)
    }

    // 窗口内容比视口高多少，就补多长的占位，让吸附期与内部平移等长。
    const measure = () => {
      if (small.matches || reduced.matches) {
        clear()
        return
      }
      limit = Math.max(0, inner.offsetHeight - win.offsetHeight)
      intro.style.setProperty('--window-scroll', `${limit}px`)
      schedule()
    }

    const modeChange = () => {
      measure()
      schedule()
    }

    const observer = new ResizeObserver(measure)
    observer.observe(inner)
    observer.observe(win)

    measure()
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', modeChange)
    small.addEventListener('change', modeChange)
    reduced.addEventListener('change', modeChange)

    return () => {
      observer.disconnect()
      if (frame !== null) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', modeChange)
      small.removeEventListener('change', modeChange)
      reduced.removeEventListener('change', modeChange)
      setPaperCover(false)
    }
  }, [ref, innerRef])
}
