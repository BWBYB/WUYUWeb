import { useEffect, useState } from 'react'

const SPY_OFFSET = 120

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

// 文章目录的滚动定位：当前章节 + 可选的全页阅读进度。
// ChapterRail 与 TocIsland 共用，保证两处高亮永远一致。
export default function useTocActive(chapters, { offset = SPY_OFFSET, progress: trackProgress = false } = {}) {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState('down')
  const count = chapters.length

  useEffect(() => {
    if (!count) return undefined
    let frame = 0
    let lastCurrent = -1
    let lastProgress = -1
    let lastY = window.scrollY
    let lastDirection = 'down'

    const update = () => {
      frame = 0
      const y = window.scrollY
      if (y !== lastY) {
        const nextDirection = y > lastY ? 'down' : 'up'
        lastY = y
        if (nextDirection !== lastDirection) {
          lastDirection = nextDirection
          setDirection(nextDirection)
        }
      }

      const root = document.documentElement
      const maxScroll = root.scrollHeight - window.innerHeight
      const scrollable = maxScroll > 8

      let next = 0
      chapters.forEach((chapter, index) => {
        const heading = document.getElementById(chapter.id)
        if (heading && heading.getBoundingClientRect().top <= offset) next = index
      })
      if (scrollable && window.innerHeight + window.scrollY >= root.scrollHeight - 4) {
        next = count - 1
      }
      if (next !== lastCurrent) {
        lastCurrent = next
        setCurrent(next)
      }

      if (trackProgress) {
        const nextProgress = scrollable
          ? Math.round(clamp(window.scrollY / maxScroll, 0, 1) * 1000) / 1000
          : 1
        if (nextProgress !== lastProgress) {
          lastProgress = nextProgress
          setProgress(nextProgress)
        }
      }
    }

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [chapters, count, offset, trackProgress])

  return { current, progress, direction }
}
