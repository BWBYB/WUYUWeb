// dissolve 字块移植自 ascii.rest（MIT，见 DissolveText.LICENSE.md）。
// 笔画骨架、烘焙与粒子消散算法保持原样，渲染改为 canvas 逐格绘制。
import { useEffect, useRef } from 'react'
import './DissolveText.css'

const COLS = 64
const ROWS = 13
const RAMP = ' .·░▒▓█'
const HOLD = 1.6
const TRANS = 2.6
const STAGGER = 0.2
const JITTER = 0.22
const ERODE = 0.3
const FADE = 0.5
const LATER = 1
const R = 0.5
const RD = 0.6
const GAP = 4

// Capitals as polylines in a 4 by 6 box, y down.
const STROKES = {
  A: [[0, 6, 1.6, 0, 2.4, 0, 4, 6], [0.7, 4, 3.3, 4]],
  B: [[0, 0, 0, 6, 3, 6, 4, 5, 4, 4, 3, 3, 0, 3], [0, 0, 2.5, 0, 3.5, 1, 3.5, 2, 2.5, 3]],
  C: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5]],
  D: [[0, 0, 0, 6, 2.5, 6, 4, 4.5, 4, 1.5, 2.5, 0, 0, 0]],
  E: [[4, 0, 0, 0, 0, 6, 4, 6], [0, 3, 3, 3]],
  F: [[4, 0, 0, 0, 0, 6], [0, 3, 3, 3]],
  G: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 5, 1, 6, 3, 6, 4, 5, 4, 3, 2, 3]],
  H: [[0, 0, 0, 6], [4, 0, 4, 6], [0, 3, 4, 3]],
  I: [[1, 0, 3, 0], [2, 0, 2, 6], [1, 6, 3, 6]],
  J: [[1.5, 0, 4, 0], [3, 0, 3, 5, 2, 6, 1, 6, 0, 5]],
  K: [[0, 0, 0, 6], [4, 0, 0, 3.6], [1.5, 2.25, 4, 6]],
  L: [[0, 0, 0, 6, 4, 6]],
  M: [[0, 6, 0, 0, 2, 3.5, 4, 0, 4, 6]],
  N: [[0, 6, 0, 0, 4, 6, 4, 0]],
  O: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  P: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3]],
  Q: [[1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0], [2.4, 4.4, 4, 6.2]],
  R: [[0, 6, 0, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3], [2.2, 3, 4, 6]],
  S: [[4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]],
  T: [[0, 0, 4, 0], [2, 0, 2, 6]],
  U: [[0, 0, 0, 5, 1, 6, 3, 6, 4, 5, 4, 0]],
  V: [[0, 0, 2, 6, 4, 0]],
  W: [[0, 0, 1, 6, 2, 2, 3, 6, 4, 0]],
  X: [[0, 0, 4, 6], [4, 0, 0, 6]],
  Y: [[0, 0, 2, 3], [4, 0, 2, 3, 2, 6]],
  Z: [[0, 0, 4, 0, 0, 6, 4, 6]],
  0: [[1, 0, 2, 0, 3, 1, 3, 5, 2, 6, 1, 6, 0, 5, 0, 1, 1, 0]],
  1: [[0.5, 1, 1.5, 0, 1.5, 6], [0.5, 6, 2.5, 6]],
  2: [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 0, 6, 4, 6]],
  3: [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1.5, 3], [3, 3, 4, 4, 4, 5, 3, 6, 1, 6, 0, 5]],
  4: [[3, 6, 3, 0, 0, 4, 4, 4]],
  5: [[4, 0, 0, 0, 0, 3, 3, 3, 4, 4, 4, 5, 3, 6, 0, 6]],
  6: [[3.5, 0, 1.5, 0, 0, 1.5, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3, 1, 3, 0, 4]],
  7: [[0, 0, 4, 0, 1.5, 6]],
  8: [[1, 3, 0, 2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3]],
  9: [[0.5, 6, 2.5, 6, 4, 4.5, 4, 1, 3, 0, 1, 0, 0, 1, 0, 2, 1, 3, 4, 3]],
  '.': [[2, 6, 2, 6]],
  ',': [[2, 5.6, 1.5, 7]],
  '!': [[2, 0, 2, 4], [2, 6, 2, 6]],
  '?': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 2, 3.5, 2, 4.2], [2, 6, 2, 6]],
  "'": [[2, 0, 2, 1.5]],
  '-': [[1, 3, 3, 3]]
}

const hash = (a, b) => {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

// Distance from (x, y) to the segment a-b, less the stroke's radius.
function seg(x, y, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const l = dx * dx + dy * dy
  const k = l ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)) : 0
  return Math.hypot(x - ax - k * dx, y - ay - k * dy) - (dx && dy ? RD : R)
}

const glyph = (ch) => STROKES[ch] || (ch === ' ' ? [] : STROKES['?'])
const span = (g) => {
  const xs = g.flatMap((p) => p.filter((_, i) => i % 2 === 0))
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 2]
}
// One unit is a row tall and two columns wide, smaller if the longest word needs it.
const wide = (w, u) =>
  w.reduce((a, ch) => a + Math.round(2 * u * (span(glyph(ch))[1] - span(glyph(ch))[0])) + Math.max(2, Math.round(GAP * u)), 0) -
  Math.max(2, Math.round(GAP * u)) +
  4 * u * R

function bake(words) {
  const list = words.map((w) => [...String(w).toUpperCase()])
  let unit = Math.min(1, (ROWS - 2) / (6 + 2 * R))
  while (unit > 0.3 && Math.max(...list.map((w) => wide(w, unit))) > COLS - 4) unit -= 0.02
  const gap = Math.max(2, Math.round(GAP * unit))

  return list.map((w) => {
    const cover = new Float32Array(COLS * ROWS)
    const slot = new Int8Array(COLS)
    const y0 = ROWS / 2 - 3 * unit
    let pen = Math.round((COLS - wide(w, unit)) / 2 + 2 * unit * R)
    const centres = []
    for (const ch of w) {
      const g = glyph(ch)
      const [lo, hi] = span(g)
      const width = Math.round(2 * unit * (hi - lo))
      centres.push(pen + width / 2)
      for (let r = 0; r < ROWS; r++) {
        for (let c = Math.max(0, pen - 3); c < Math.min(COLS, pen + width + 3); c++) {
          let hit = 0
          for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 3; i++) {
              const gx = lo + (c + (i + 0.5) / 3 - pen) / (2 * unit)
              const gy = (r + (j + 0.5) / 3 - y0) / unit
              let d = 9
              for (const p of g) for (let k = 0; k + 3 < p.length; k += 2) d = Math.min(d, seg(gx, gy, p[k], p[k + 1], p[k + 2], p[k + 3]))
              if (d <= 0) hit++
            }
          }
          cover[r * COLS + c] = Math.max(cover[r * COLS + c], hit / 9)
        }
      }
      pen += width + gap
    }
    for (let c = 0; c < COLS; c++) {
      let best = 0
      centres.forEach((x, i) => Math.abs(x - c) < Math.abs(centres[best] - c) && (best = i))
      slot[c] = best
    }
    return { cover, slot }
  })
}

const DEFAULT_WORDS = ['hello', 'hola', 'ciao', 'salut']

export default function DissolveText({ words = DEFAULT_WORDS, className = '', ...rest }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined

    const source = words.length ? words : DEFAULT_WORDS
    const baked = bake(source)
    const list = source.map((w) => [...String(w).toUpperCase()])
    const period = list.length * (HOLD + TRANS)
    const val = new Float32Array(COLS * ROWS)
    const dust = new Float32Array(COLS * ROWS)
    const splat = (x, y, d) => {
      const c = Math.round(x)
      const r = Math.round(y)
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) dust[r * COLS + c] = Math.max(dust[r * COLS + c], d)
    }

    const frame = (t) => {
      const u = (((t + 1) % period) + period) % period
      const n = Math.floor(u / (HOLD + TRANS))
      const tau = u - n * (HOLD + TRANS) - HOLD
      const A = baked[n]
      const B = baked[(n + 1) % list.length]
      dust.fill(0)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const k = r * COLS + c
          const a = A.cover[k]
          const b = B.cover[k]
          let v = a
          if (tau > 0) {
            v = 0
            // The old cell wears thin, then about half of them let go as a grain
            // that falls out of the letter, drifting a little right, and fades.
            if (a > 0) {
              const go = A.slot[c] * STAGGER + hash(k, n) * JITTER
              const e = (tau - go) / ERODE
              if (a <= 0.3 || hash(k, n + 7) > 0.5) v = a * (1 - ease(e))
              else if (e < 1) v = a * (1 - 0.5 * Math.max(0, e))
              else {
                const age = tau - go - ERODE
                const life = 0.5 + 0.35 * hash(k, n + 57)
                if (age < life) {
                  const vx = 0.6 + 1.4 * hash(k, n + 31)
                  const vy = 0.3 + 0.6 * hash(k, n + 83)
                  splat(c + 0.5 + vx * age, r + vy * age + 4 * age * age, 0.5 * (1 - (0.7 * age) / life))
                }
              }
            }
            // The new cell's grain, for about half of them, gathers in toward its
            // stroke from a cell or two away, and the cell fills in around it.
            if (b > 0) {
              const land = LATER + B.slot[c] * STAGGER + hash(k, n + 977) * JITTER
              if (tau >= land) v = Math.max(v, b * (b > 0.3 ? 0.4 + 0.6 * ease((tau - land) / FADE) : ease((tau - land) / FADE)))
              else if (b > 0.3 && hash(k, n + 9) < 0.55) {
                const life = 0.45 + 0.3 * hash(k, n + 211)
                const f = (land - tau) / life
                if (f < 1) {
                  const q = f * f
                  const th = 6.283 * hash(k, n + 401)
                  const d = 0.8 + 1.2 * hash(k, n + 613)
                  splat(c + 1.8 * d * Math.cos(th) * q, r + d * Math.sin(th) * q, 0.17 + 0.3 * (1 - f))
                }
              }
            }
          }
          val[k] = v
        }
      }
      const lines = []
      for (let r = 0; r < ROWS; r++) {
        let line = ''
        for (let c = 0; c < COLS; c++) line += RAMP[Math.round(Math.max(val[r * COLS + c], dust[r * COLS + c]) * (RAMP.length - 1))]
        lines.push(line)
      }
      return lines
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const codes = new Uint16Array(COLS * ROWS).fill(32)
    let cellW = 0
    let cellH = 0
    let color = ''
    let time = 0
    let raf = 0
    let last = 0
    let width = 0
    let seen = false
    let disposed = false

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      cellW = width / COLS
      cellH = cellW * 2
      canvas.width = width
      canvas.height = Math.max(1, Math.round(cellH * ROWS))
      ctx.font = `${cellW / 0.6}px ${getComputedStyle(canvas).fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      codes.fill(32)
      color = ''
    }

    const paintCell = (c, r, code) => {
      const left = c * cellW
      const top = r * cellH
      ctx.clearRect(left, top, cellW, cellH)
      if (code === 32) return
      ctx.fillStyle = color
      ctx.fillText(String.fromCharCode(code), left + cellW / 2, top + cellH / 2)
    }

    const draw = (t) => {
      const lines = frame(t)
      const next = getComputedStyle(canvas).color
      const force = next !== color
      color = next
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const code = lines[r].charCodeAt(c)
          const index = r * COLS + c
          if (force || code !== codes[index]) {
            codes[index] = code
            paintCell(c, r, code)
          }
        }
      }
    }

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const delta = now - last
      if (delta < 1000 / 20 - 2) return
      last = now
      time += Math.min(delta, 100) / 1000
      draw(time)
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
        draw(0)
      }
      run()
    }

    resize()
    draw(0)

    const ro = new ResizeObserver(() => {
      if (canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2) === width) return
      resize()
      draw(time)
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
      draw(time)
    })

    return () => {
      disposed = true
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', run)
      reduced.removeEventListener('change', onReducedChange)
      cancelAnimationFrame(raf)
    }
  }, [words])

  return (
    <canvas
      ref={canvasRef}
      className={`dissolve-text${className ? ` ${className}` : ''}`}
      style={{ aspectRatio: `${COLS} / ${ROWS * 2}` }}
      role="img"
      aria-label={(words.length ? words : DEFAULT_WORDS).map((w) => String(w).toUpperCase()).join(' · ')}
      {...rest}
    />
  )
}
