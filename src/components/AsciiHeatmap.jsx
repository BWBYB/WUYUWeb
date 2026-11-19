// heatmap 移植自 ascii.rest（MIT，© 2026 bas3line）：
// https://ascii.rest/heatmap/ · 格子由构建时快照的 git 提交日期点亮；
// 日期锚到当天，进入视口时一次性填充，避免滑进未来月份。
// 网格符号必须留在等宽字体里才能对齐；月份、汇总和图例是真正的文字，走站点衬线栈。
import { useEffect, useMemo, useRef, useState } from 'react'

const LEFT = 6 // weekday labels
const LEVELS = '·░▒▓█'
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DAYS = ['mon', '', 'wed', '', 'fri', '', '']
const REPO = 'https://github.com/BWBYB/WUYUWeb/commits/main/'

// 本地日历日编码成 1970 起的 UTC 天数：和 toDay 的编码一致，
// 避免凌晨 0–8 点（UTC+8）按 UTC 取日差一天
const START = (() => {
  const now = new Date()
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5)
})()

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

const isoOf = day => new Date(day * 864e5).toISOString().slice(0, 10)

// One update is visible; a day with several goes to the brightest level.
const level = n => (n === 0 ? 0 : n === 1 ? 3 : 4)

// 画幅从周一列开始；窗口按周回推，和统计、命中检测共用同一起点
function windowStart(weeks) {
  const monday = START - ((START + 3) % 7)
  return monday - (weeks - 1) * 7
}

// 月名居中于它覆盖的整段周；首尾不满两周的残月不标
function monthLabels(weeks) {
  const first = windowStart(weeks)
  const cols = LEFT + weeks * 2
  const labels = []
  let spanStart = 0
  for (let w = 1; w <= weeks; w++) {
    if (w < weeks && monthOf(first + w * 7) === monthOf(first + spanStart * 7)) continue
    const spanEnd = w - 1
    if (spanEnd > spanStart) {
      const center = Math.min(Math.max(LEFT + spanStart + spanEnd + 0.5, 2), cols - 2)
      labels.push({
        key: spanStart,
        text: MONTHS[monthOf(first + spanStart * 7)],
        left: center * 0.6, // 等宽字每列 0.6em，标签按列位换算成 em
      })
    }
    spanStart = w
  }
  return labels
}

function grid(daysShown, days, weeks) {
  const first = windowStart(weeks)
  const rows = []
  for (let r = 0; r < 7; r++) {
    let line = DAYS[r].padEnd(LEFT - 2) + '  '
    for (let w = 0; w < weeks; w++) {
      const d = first + w * 7 + r
      let cell = ' '
      if (d <= START && d - first < daysShown) {
        const lv = level(days.get(d) ?? 0)
        cell = lv === 0 ? '·' : `<span class="hm hm-${lv}">${LEVELS[lv]}</span>`
      }
      line += `${cell} `
    }
    rows.push(line)
  }
  return rows.join('\n')
}

export default function AsciiHeatmap({ className = '', entries = [], weeks = 30, snapshot = '' }) {
  const preRef = useRef(null)
  const boxRef = useRef(null)
  const [tip, setTip] = useState(null)
  const cols = LEFT + weeks * 2
  const months = useMemo(() => monthLabels(weeks), [weeks])

  const days = useMemo(() => {
    const map = new Map()
    for (const entry of entries) {
      const d = toDay(entry.date)
      map.set(d, (map.get(d) ?? 0) + 1)
    }
    return map
  }, [entries])

  const stats = useMemo(() => {
    const first = windowStart(weeks)
    let total = 0
    let longest = 0
    let run = 0
    for (let d = first; d <= START; d += 1) {
      if (days.get(d)) {
        total += days.get(d)
        run += 1
        longest = Math.max(longest, run)
      } else {
        run = 0
      }
    }
    let current = 0
    for (let d = days.get(START) ? START : START - 1; days.get(d); d -= 1) current += 1
    return { total, current, longest }
  }, [days, weeks])

  useEffect(() => {
    const el = preRef.current
    if (!el) return undefined
    setTip(null)

    const totalDays = weeks * 7
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const REVEAL = 2400
    let raf = 0
    let last = 0
    let shown = 0
    let startedAt = 0
    let seen = false
    let text = ''

    const draw = () => {
      const next = grid(shown, days, weeks)
      if (next !== text) {
        text = next
        el.innerHTML = next
      }
    }

    const tick = now => {
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / 20 - 2) return
      last = now
      shown = Math.min(totalDays, Math.floor(((now - startedAt) / REVEAL) * totalDays))
      draw()
      if (shown >= totalDays) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const run = () => {
      const active = seen && !document.hidden && !reduced.matches && shown < totalDays
      if (active && !raf) {
        last = performance.now()
        startedAt = last - (shown / totalDays) * REVEAL
        raf = requestAnimationFrame(tick)
      } else if (!active && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onReducedChange = () => {
      if (reduced.matches) {
        shown = totalDays
        draw()
      }
      run()
    }

    if (reduced.matches) shown = totalDays
    draw()

    const io = new IntersectionObserver(entries => {
      seen = entries[entries.length - 1].isIntersecting
      run()
    })
    io.observe(el)

    const clearTip = () => setTip(null)
    document.addEventListener('visibilitychange', run)
    window.addEventListener('scroll', clearTip, { passive: true })
    reduced.addEventListener('change', onReducedChange)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('scroll', clearTip)
      reduced.removeEventListener('change', onReducedChange)
      cancelAnimationFrame(raf)
    }
  }, [days, weeks])

  // 指针坐标 → 字符行列 → 具体日期；画幅与命中检测共用同一套几何
  const locate = event => {
    const el = preRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
    if (!lineHeight) return null
    const charWidthPx = el.clientWidth / cols
    const row = Math.floor((event.clientY - rect.top) / lineHeight)
    const col = Math.floor((event.clientX - rect.left) / charWidthPx)
    const week = Math.floor((col - LEFT) / 2)
    if (row < 0 || row > 6 || week < 0 || week >= weeks) return null
    const day = windowStart(weeks) + week * 7 + row
    if (day > START) return null
    return { day, count: days.get(day) ?? 0 }
  }

  const onMove = event => {
    if (event.pointerType !== 'mouse') return
    const hit = locate(event)
    const box = boxRef.current
    if (!hit || !box) {
      setTip(null)
      return
    }
    const anchor = box.getBoundingClientRect()
    setTip({
      day: hit.day,
      count: hit.count,
      x: Math.round(event.clientX - anchor.left),
      y: Math.round(event.clientY - anchor.top - 12),
    })
  }

  const onClick = event => {
    const hit = locate(event)
    if (!hit || hit.count === 0) return
    const since = isoOf(hit.day)
    const until = isoOf(hit.day + 1)
    window.open(`${REPO}?since=${since}&until=${until}`, '_blank', 'noopener,noreferrer')
  }

  const snapshotLabel = snapshot ? snapshot.replaceAll('-', '.') : ''
  const pointable = tip !== null && tip.count > 0

  return (
    <>
      <div
        ref={boxRef}
        className={`ascii-heatmap-box${className ? ` ${className}` : ''}`}
        style={{ '--heatmap-cols': cols }}
      >
        <div className="ascii-heatmap__months" aria-hidden="true">
          {months.map(month => (
            <span key={month.key} style={{ left: `${month.left}em` }}>
              {month.text}
            </span>
          ))}
        </div>
        <pre
          ref={preRef}
          className={`ascii-heatmap${pointable ? ' is-pointable' : ''}`}
          aria-hidden="true"
          onPointerMove={onMove}
          onPointerLeave={() => setTip(null)}
          onClick={onClick}
        />
        {tip ? (
          <span className="ascii-heatmap__tip" style={{ left: tip.x, top: tip.y }} aria-hidden="true">
            {isoOf(tip.day).replaceAll('-', '.')}
            {tip.count ? ` · ${tip.count} 次提交` : ' · 无提交'}
          </span>
        ) : null}
      </div>
      <p className="ascii-heatmap__foot">
        <span className="ascii-heatmap__sum">
          近 {weeks} 周 <strong>{stats.total}</strong> 次提交
        </span>
        <span className="ascii-heatmap__legend" aria-hidden="true">
          less
          {[...LEVELS].map((ch, index) => (
            <span key={ch} className={`hm hm-${index}`}>{ch}</span>
          ))}
          more
        </span>
      </p>
      <p className="ascii-heatmap__meta">
        {stats.total === 0
          ? '这个时段还没有提交'
          : `当前连续 ${stats.current} 天 · 最长连续 ${stats.longest} 天`}
      </p>
      <p className="ascii-heatmap__sr">
        {`提交热力图，最近 ${weeks} 周共 ${stats.total} 次提交`}
        {stats.total === 0
          ? '。'
          : `，当前连续 ${stats.current} 天，最长连续 ${stats.longest} 天。`}
        {snapshotLabel ? `数据来自 git 提交，截至 ${snapshotLabel} 构建。` : ''}
      </p>
    </>
  )
}
