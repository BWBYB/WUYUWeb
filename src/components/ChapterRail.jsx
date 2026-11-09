import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { audioEngine } from '../lib/audio-engine'

const SPY_OFFSET = 120
const FALLOFF_ROWS = 2.6
const MAX_ROWS = 18
const MIN_ROWS = 10

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const pad = (value) => String(value).padStart(2, '0')
const bump = (distance) => (
  distance >= FALLOFF_ROWS ? 0 : 0.5 * (1 + Math.cos((Math.PI * distance) / FALLOFF_ROWS))
)

export default function ChapterRail({ chapters, label = '章节目录' }) {
  const [current, setCurrent] = useState(0)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  const navRef = useRef(null)
  const hoverRef = useRef(null)
  const reducedRef = useRef(false)
  const rafRef = useRef(0)
  const springRef = useRef({ pointer: 0, strength: 0, targetPointer: 0, targetStrength: 0 })

  const count = chapters.length
  const rowHeight = Math.max(MIN_ROWS, Math.min(MAX_ROWS, 360 / Math.max(count, 1)))
  const safePreview = clamp(previewIndex, 0, Math.max(count - 1, 0))

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => { reducedRef.current = media.matches }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!count) return undefined
    let raf = 0
    let playing = false
    let timeData = null
    const levels = new Float32Array(count)
    const ticks = navRef.current ? [...navRef.current.querySelectorAll('.chapter-rail__tick')] : []

    const clearWave = () => {
      ticks.forEach((tick) => tick.style.removeProperty('--wave'))
      levels.fill(0)
    }

    const frame = () => {
      raf = 0
      if (reducedRef.current) {
        clearWave()
        return
      }

      const analyser = audioEngine.getAnalyser()
      let level = 0
      if (playing && analyser) {
        if (!timeData || timeData.length !== analyser.fftSize) {
          timeData = new Uint8Array(analyser.fftSize)
        }
        analyser.getByteTimeDomainData(timeData)
        let sum = 0
        for (let i = 0; i < timeData.length; i += 1) {
          const sample = (timeData[i] - 128) / 128
          sum += sample * sample
        }
        level = Math.min(1, Math.sqrt(sum / timeData.length) * 3.2)
      }

      const phase = performance.now() * 0.004
      let peak = 0
      levels.forEach((value, index) => {
        const envelope = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(phase - index * 0.75))
        const target = playing ? level * envelope : 0
        const next = value + (target - value) * 0.18
        levels[index] = next
        peak = Math.max(peak, next)
        ticks[index]?.style.setProperty('--wave', next.toFixed(3))
      })

      if (!playing && peak < 0.004) {
        clearWave()
        return
      }
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const unsubscribe = audioEngine.subscribe((next) => {
      if (next.isPlaying === playing) return
      playing = next.isPlaying
      start()
    })

    playing = audioEngine.getState().isPlaying
    if (playing) start()

    return () => {
      unsubscribe()
      if (raf) cancelAnimationFrame(raf)
      clearWave()
    }
  }, [count])

  useEffect(() => {
    if (!count) return undefined
    let frame = 0
    let last = -1

    const update = () => {
      frame = 0
      let next = 0
      chapters.forEach((chapter, index) => {
        const heading = document.getElementById(chapter.id)
        if (heading && heading.getBoundingClientRect().top <= SPY_OFFSET) next = index
      })
      const root = document.documentElement
      const scrollable = root.scrollHeight > window.innerHeight + 8
      if (scrollable && window.innerHeight + window.scrollY >= root.scrollHeight - 4) {
        next = count - 1
      }
      if (next !== last) {
        last = next
        setCurrent(next)
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
  }, [chapters, count])

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  function railLinks() {
    return navRef.current ? [...navRef.current.querySelectorAll('.chapter-rail__link')] : []
  }

  function clearRise() {
    navRef.current?.querySelectorAll('.chapter-rail__tick').forEach((tick) => {
      tick.style.removeProperty('--rise')
    })
  }

  function paint() {
    const { pointer, strength } = springRef.current
    navRef.current?.querySelectorAll('.chapter-rail__tick').forEach((tick, index) => {
      const rise = strength * bump(Math.abs(index - pointer))
      tick.style.setProperty('--rise', rise.toFixed(3))
    })
  }

  function step() {
    const spring = springRef.current
    spring.strength += (spring.targetStrength - spring.strength) * 0.2
    spring.pointer += (spring.targetPointer - spring.pointer) * 0.3

    const settled = Math.abs(spring.targetStrength - spring.strength) < 0.004
      && Math.abs(spring.targetPointer - spring.pointer) < 0.004

    if (settled) {
      spring.strength = spring.targetStrength
      spring.pointer = spring.targetPointer
      rafRef.current = 0
      if (spring.strength === 0) clearRise()
      else paint()
      return
    }

    paint()
    rafRef.current = requestAnimationFrame(step)
  }

  function moveSpring(pointer, strength) {
    const spring = springRef.current
    spring.targetPointer = pointer
    spring.targetStrength = strength

    if (reducedRef.current) {
      spring.pointer = pointer
      spring.strength = strength
      if (strength === 0) clearRise()
      else paint()
      return
    }

    if (!rafRef.current) rafRef.current = requestAnimationFrame(step)
  }

  function pointerIndex(event) {
    const rect = navRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return clamp((event.clientY - rect.top) / rowHeight - 0.5, 0, count - 1)
  }

  function handlePointerMove(event) {
    if (event.pointerType === 'touch' || count === 0) return
    const pointer = pointerIndex(event)
    const nearest = Math.round(pointer)
    hoverRef.current = nearest
    setPreviewIndex(nearest)
    setPreviewOpen(true)
    moveSpring(pointer, 1)
  }

  function handlePointerLeave() {
    hoverRef.current = null
    if (navRef.current?.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) {
      const index = railLinks().indexOf(document.activeElement)
      moveSpring(index >= 0 ? index : current, 1)
      return
    }
    setPreviewOpen(false)
    moveSpring(current, 0)
  }

  function handleFocus(index) {
    setPreviewIndex(index)
    setPreviewOpen(true)
    moveSpring(index, 1)
  }

  function handleBlur(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    if (hoverRef.current !== null) {
      setPreviewIndex(hoverRef.current)
      return
    }
    setPreviewOpen(false)
    moveSpring(current, 0)
  }

  function handleKeyDown(event) {
    const links = railLinks()
    const focusedIndex = links.indexOf(document.activeElement)
    let next = focusedIndex >= 0 ? focusedIndex : current
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = Math.min(count - 1, next + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        next = Math.max(0, next - 1)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = count - 1
        break
      default:
        return
    }
    event.preventDefault()
    links[next]?.focus()
  }

  function handleClick(event, chapter) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    const heading = document.getElementById(chapter.id)
    if (!heading) return
    event.preventDefault()
    heading.scrollIntoView({
      behavior: reducedRef.current ? 'instant' : 'smooth',
      block: 'start',
    })
    window.history.replaceState(null, '', `#${chapter.id}`)
  }

  if (!count) return null

  return createPortal(
    <div className="chapter-rail">
      <nav
        ref={navRef}
        className="chapter-rail__nav"
        aria-label={label}
        style={{ '--rail-row': `${rowHeight}px` }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        {chapters.map((chapter, index) => (
          <a
            key={chapter.id}
            className={[
              'chapter-rail__link',
              chapter.level <= 2 ? 'is-major' : 'is-minor',
              index === current ? 'is-current' : '',
              index < current ? 'is-passed' : '',
            ].filter(Boolean).join(' ')}
            href={`#${chapter.id}`}
            aria-label={chapter.title}
            aria-current={index === current ? 'location' : undefined}
            tabIndex={index === current ? 0 : -1}
            onFocus={() => handleFocus(index)}
            onClick={(event) => handleClick(event, chapter)}
          >
            <span className="chapter-rail__tick" aria-hidden="true" />
          </a>
        ))}
      </nav>
      <div
        className={`chapter-rail__card${previewOpen ? ' is-visible' : ''}`}
        style={{ top: `${(safePreview + 0.5) * rowHeight}px` }}
        aria-hidden="true"
      >
        <span className="chapter-rail__meta">{pad(safePreview + 1)} / {pad(count)}</span>
        <span className="chapter-rail__title">{chapters[safePreview].title}</span>
      </div>
    </div>,
    document.body,
  )
}
