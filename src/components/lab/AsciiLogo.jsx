import { useEffect, useRef } from 'react'
import './AsciiLogo.css'

const START = 0.5
const PASS = 2
const HALF = 5
const LEAN = 0.9
const SOLID = new Set('8dbqpPYOo0')

const artBounds = (art) => {
  let lo = Infinity
  let hi = -Infinity
  art.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== ' ') {
        lo = Math.min(lo, x + LEAN * y)
        hi = Math.max(hi, x + LEAN * y)
      }
    }
  })
  return Number.isFinite(lo) ? { lo, hi } : { lo: 0, hi: 0 }
}

export default function AsciiLogo({ piece }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined

    const { cols, rows, art, ink, colors, shine } = piece
    const every = shine > 0 ? Math.max(shine, PASS + 0.5) : 0
    const { lo, hi } = artBounds(art)
    const span = hi - lo + 2 * HALF

    let cellW = 0
    let cellH = 0
    let time = 0
    let raf = 0
    let last = 0
    let seen = false
    let disposed = false
    const states = new Uint8Array(cols * rows).fill(255)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const cellState = (x, y) => {
      const char = art[y][x]
      if (char === ' ') return null

      const inkIndex = parseInt(ink[y][x], 36) || 0
      const since = time - START
      const at = every && since >= 0 ? lo - HALF + (span * (since % every)) / PASS : -Infinity
      const distance = Math.abs(x + LEAN * y - at)
      let strength = distance < HALF ? 1 - distance / HALF : 0
      strength = strength * strength * (3 - 2 * strength)

      const tier = strength > 0.6 ? 2 : strength > 0.25 ? 1 : 0
      const solid = strength > 0.55 && SOLID.has(char)
      return {
        glyph: solid ? '/' : char,
        color: colors[inkIndex][tier],
        key: ((solid ? 1 : 0) * 3 + tier) * colors.length + inkIndex,
      }
    }

    const paintCell = (x, y, state) => {
      const left = x * cellW
      const top = y * cellH
      ctx.clearRect(left, top, cellW, cellH)
      if (!state) return
      ctx.fillStyle = state.color
      ctx.fillText(state.glyph, left + cellW / 2, top + cellH / 2)
    }

    const draw = () => {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const state = cellState(x, y)
          const key = state ? state.key : 255
          const index = y * cols + x
          if (key !== states[index]) {
            states[index] = key
            paintCell(x, y, state)
          }
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      cellW = width / cols
      cellH = cellW * 2
      canvas.width = width
      canvas.height = Math.max(1, Math.round(cellH * rows))
      ctx.font = `${cellW / 0.6}px ${getComputedStyle(canvas).fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      states.fill(255)
    }

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const delta = now - last
      if (delta < 1000 / 30 - 2) return
      last = now
      time += Math.min(delta, 100) / 1000
      draw()
    }

    const run = () => {
      const active = seen && !document.hidden && !reduced.matches
      if (active && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      } else if (!active && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onReducedChange = () => {
      if (reduced.matches) {
        time = 0
        states.fill(255)
        draw()
      }
      run()
    }

    let width = canvas.clientWidth
    resize()
    draw()

    const ro = new ResizeObserver(() => {
      if (canvas.clientWidth === width) return
      width = canvas.clientWidth
      resize()
      draw()
    })
    ro.observe(canvas)

    const io = new IntersectionObserver((entries) => {
      seen = entries[entries.length - 1].isIntersecting
      run()
    })
    io.observe(canvas)

    document.addEventListener('visibilitychange', run)
    reduced.addEventListener('change', onReducedChange)

    document.fonts?.ready.then(() => {
      if (disposed) return
      resize()
      draw()
    })

    return () => {
      disposed = true
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', run)
      reduced.removeEventListener('change', onReducedChange)
      cancelAnimationFrame(raf)
    }
  }, [piece])

  return (
    <canvas
      ref={canvasRef}
      className="ascii-logo"
      style={{ aspectRatio: `${piece.cols} / ${piece.rows * 2}` }}
      role="img"
      aria-label={`${piece.label} ASCII 徽标，${piece.source === 'custom' ? 'WUYUWeb 自绘' : '来自 ascii.rest'}`}
    />
  )
}
