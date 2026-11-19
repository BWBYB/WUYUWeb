// heatmap 移植自 ascii.rest（MIT，© 2026 bas3line）：
// https://ascii.rest/heatmap/ · 格子由构建时快照的 git 提交日期点亮；
// 日期锚到当天，进入视口时一次性填充，避免滑进未来月份。
import { useEffect, useRef } from 'react'

const COLS = 66
const WEEKS = 30
const TOTAL_DAYS = WEEKS * 7
const START = Math.floor(Date.now() / 864e5) // today, as days since 1970-01-01
const LEVELS = '·░▒▓█'
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAYS = ['mon', '', 'wed', '', 'fri', '', '']
const LEFT = 6 // weekday labels

// Month (0 to 11) of a day counted from 1970-01-01, after Howard Hinnant.
function monthOf(z) {
  const doe = (((z + 719468) % 146097) + 146097) % 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  return (mp + 2) % 12
}

const toDay = date => {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 864e5)
}

// One update is visible; a day with several goes to the brightest level.
const level = n => (n === 0 ? 0 : n === 1 ? 3 : 4)

function frame(daysShown, days, unit) {
  const today = START
  const monday = today - ((today + 3) % 7)
  const first = monday - (WEEKS - 1) * 7
  const grid = Array.from({ length: 7 }, (_, r) => (DAYS[r].padEnd(LEFT - 2) + '  ').split(''))
  let total = 0
  for (let w = 0; w < WEEKS; w++) {
    for (let r = 0; r < 7; r++) {
      const d = first + w * 7 + r
      let ch = ' '
      if (d <= today && d - first < daysShown) {
        const n = days.get(d) ?? 0
        total += n
        ch = LEVELS[level(n)]
      }
      grid[r].push(ch, ' ')
    }
  }
  // A month's name sits over the first week that starts in it.
  const head = new Array(COLS).fill(' ')
  let free = 0
  for (let w = 0; w < WEEKS; w++) {
    const m = monthOf(first + w * 7)
    if (w > 0 && m === monthOf(first + (w - 1) * 7)) continue
    const x = LEFT + w * 2
    if (x < free || x + 3 > COLS) continue
    if (w === 0 && monthOf(first + 14) !== m) continue
    for (let k = 0; k < 3; k++) head[x + k] = MONTHS[m][k]
    free = x + 5
  }
  const lines = ['', head.join('')]
  for (let r = 0; r < 7; r++) lines.push(grid[r].join(''))
  lines.push('')
  const sum = `${total} ${unit}${total === 1 ? '' : 's'} in the last ${WEEKS} weeks`
  const key = 'less ' + [...LEVELS].join(' ') + ' more'
  lines.push(' '.repeat(LEFT) + sum.padEnd(COLS - LEFT - key.length - 1) + key)
  lines.push('')
  return lines.map(l => l.slice(0, COLS).padEnd(COLS)).join('\n')
}

export default function AsciiHeatmap({ className = '', entries = [], unit = 'update' }) {
  const preRef = useRef(null)

  useEffect(() => {
    const el = preRef.current
    if (!el) return undefined

    const days = new Map()
    for (const entry of entries) {
      const d = toDay(entry.date)
      days.set(d, (days.get(d) ?? 0) + 1)
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const REVEAL = 2400
    let raf = 0
    let last = 0
    let shown = 0
    let startedAt = 0
    let seen = false
    let text = ''

    const draw = () => {
      const next = frame(shown, days, unit)
      if (next !== text) {
        text = next
        el.textContent = next
      }
    }

    const tick = now => {
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / 20 - 2) return
      last = now
      shown = Math.min(TOTAL_DAYS, Math.floor(((now - startedAt) / REVEAL) * TOTAL_DAYS))
      draw()
      if (shown >= TOTAL_DAYS) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const run = () => {
      const active = seen && !document.hidden && !reduced.matches && shown < TOTAL_DAYS
      if (active && !raf) {
        last = performance.now()
        startedAt = last - (shown / TOTAL_DAYS) * REVEAL
        raf = requestAnimationFrame(tick)
      } else if (!active && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onReducedChange = () => {
      if (reduced.matches) {
        shown = TOTAL_DAYS
        draw()
      }
      run()
    }

    if (reduced.matches) shown = TOTAL_DAYS
    draw()

    const io = new IntersectionObserver(entries => {
      seen = entries[entries.length - 1].isIntersecting
      run()
    })
    io.observe(el)

    document.addEventListener('visibilitychange', run)
    reduced.addEventListener('change', onReducedChange)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', run)
      reduced.removeEventListener('change', onReducedChange)
      cancelAnimationFrame(raf)
    }
  }, [entries, unit])

  return (
    <pre
      ref={preRef}
      className={`ascii-heatmap${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    />
  )
}
