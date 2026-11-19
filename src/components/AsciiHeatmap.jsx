// heatmap 移植自 ascii.rest（MIT，© 2026 bas3line）：
// https://ascii.rest/heatmap/ · 格子由构建时快照的 git 提交日期点亮；
// 日期锚到当天，进入视口时一次性填充，避免滑进未来月份。
// 网格符号必须留在等宽字体里才能对齐；星期标签、月份、汇总和图例是真正的文字，走站点衬线栈。
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './ui/Icon'

const LEFT = 6 // weekday labels
const LEVELS = '·░▒▓█'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const REPO = 'https://github.com/BWBYB/WUYUWeb/commits/main/'
const SR_ID = 'wuyu-heatmap-sr'

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

// 统计条副行用短日期（MM.DD）；区间两端同天只写一次
const shortDate = day => isoOf(day).slice(5).replaceAll('-', '.')
const spanText = (start, end) => (start === end ? shortDate(start) : `${shortDate(start)} — ${shortDate(end)}`)

// GitHub 风格千分位
const formatCount = n => n.toLocaleString('en-US')

// One update is visible; a day with several goes to the brightest level.
const level = n => Math.min(n, 4)

// 揭示进度走 ease-out：起步快，临近结尾速度慢慢收住，不再匀速扫描
const easeOut = p => 1 - (1 - p) ** 3
const easeOutInverse = q => 1 - Math.cbrt(1 - q)

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

// 一次性建好整块网格：每格是独立 span，揭示时只切类名，
// 元素保持稳定，弹出动画才能完整播放
function buildGrid(days, weeks) {
  const first = windowStart(weeks)
  const rows = []
  for (let r = 0; r < 7; r++) {
    // 标签占 6 个等宽列宽，替换成衬线字也不改变网格与月份的位置
    let line = `<span class="ascii-heatmap__day">${DAYS[r]}</span>`
    for (let w = 0; w < weeks; w++) {
      const d = first + w * 7 + r
      if (d <= START) {
        const lv = level(days.get(d) ?? 0)
        line += `<span class="hm hm-${lv} is-off" data-d="${d - first}">${LEVELS[lv]}</span> `
      } else {
        line += '  '
      }
    }
    rows.push(line)
  }
  return rows.join('\n')
}

export default function AsciiHeatmap({ className = '', entries = [], weeks = 30, snapshot = '' }) {
  const preRef = useRef(null)
  const boxRef = useRef(null)
  const sumRef = useRef(null)
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

  // 窗口内统计：总量、活跃天数、最忙一天、最长连续与当前连续的起止
  const stats = useMemo(() => {
    const first = windowStart(weeks)
    let total = 0
    let activeDays = 0
    let busiest = { day: first, count: 0 }
    let longest = { length: 0, start: first }
    let run = 0
    let runStart = first
    for (let d = first; d <= START; d += 1) {
      const count = days.get(d) ?? 0
      total += count
      if (count > busiest.count) busiest = { day: d, count }
      if (count) {
        activeDays += 1
        if (run === 0) runStart = d
        run += 1
        if (run > longest.length) longest = { length: run, start: runStart }
      } else {
        run = 0
      }
    }
    // 今天还没提交时从昨天往回数，和 GitHub 的当前连续口径一致
    const currentEnd = days.get(START) ? START : START - 1
    let current = 0
    for (let d = currentEnd; days.get(d); d -= 1) current += 1
    // 环比口径：近 7 天 vs 前 7 天，不受窗口切换影响
    let weekCurrent = 0
    for (let d = START - 6; d <= START; d += 1) weekCurrent += days.get(d) ?? 0
    let weekPrev = 0
    for (let d = START - 13; d <= START - 7; d += 1) weekPrev += days.get(d) ?? 0
    return {
      first,
      total,
      activeDays,
      // 日均按活跃日摊：总量 ÷ 有提交的天数，一位小数
      perDay: activeDays ? (total / activeDays).toFixed(1) : '0.0',
      // 活跃率按窗口摊：活跃天数 ÷ 窗口天数（周数 × 7）
      rate: activeDays ? ((activeDays / (weeks * 7)) * 100).toFixed(1) : '0.0',
      busiest,
      longest,
      week: { current: weekCurrent, prev: weekPrev },
      current: { length: current, start: currentEnd - current + 1, end: currentEnd },
    }
  }, [days, weeks])

  useEffect(() => {
    const el = preRef.current
    if (!el) return undefined
    setTip(null)

    const totalDays = weeks * 7
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const REVEAL = 1500
    let raf = 0
    let last = 0
    let shown = 0
    let revealed = 0
    let startedAt = 0
    let seen = false

    // 最后一周里属于未来的日子不画；网格只建一次，揭示只切类名
    const first = windowStart(weeks)
    const drawable = Math.min(totalDays, START - first + 1)
    el.innerHTML = buildGrid(days, weeks)
    const cells = new Array(drawable)
    el.querySelectorAll('.hm').forEach(node => {
      const index = Number(node.dataset.d)
      if (index >= 0 && index < drawable) cells[index] = node
    })

    // 脚注计数跟着揭示进度走：数字随格子一起从 0 数到窗口总数
    const revealTo = next => {
      const target = Math.min(next, drawable)
      for (let d = revealed; d < target; d += 1) {
        const cell = cells[d]
        if (!cell) continue
        cell.classList.remove('is-off')
        cell.classList.add('is-pop')
      }
      revealed = Math.max(revealed, target)
      if (sumRef.current) {
        let count = 0
        for (let d = 0; d < revealed; d += 1) count += days.get(first + d) ?? 0
        sumRef.current.textContent = formatCount(count)
      }
    }

    const tick = now => {
      raf = requestAnimationFrame(tick)
      if (now - last < 1000 / 30 - 2) return
      last = now
      shown = Math.min(totalDays, Math.floor(easeOut(Math.min(1, (now - startedAt) / REVEAL)) * totalDays))
      revealTo(shown)
      if (shown >= totalDays) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const run = () => {
      const active = seen && !document.hidden && !reduced.matches && shown < totalDays
      if (active && !raf) {
        last = performance.now()
        startedAt = last - easeOutInverse(shown / totalDays) * REVEAL
        raf = requestAnimationFrame(tick)
      } else if (!active && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onReducedChange = () => {
      if (reduced.matches) {
        shown = totalDays
        revealTo(shown)
      }
      run()
    }

    if (reduced.matches) {
      shown = totalDays
      revealTo(shown)
    }

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

  const openDay = day => {
    const since = isoOf(day)
    const until = isoOf(day + 1)
    window.open(`${REPO}?since=${since}&until=${until}`, '_blank', 'noopener,noreferrer')
  }

  const onClick = event => {
    const hit = locate(event)
    if (!hit || hit.count === 0) return
    openDay(hit.day)
  }

  // 趋势徽章：提交变多用绿、变少用红；基线为 0 时显示「新增」
  const weekTrend = (() => {
    const { current: value, prev } = stats.week
    if (prev === 0) return value === 0 ? { dir: 'flat', text: '0%' } : { dir: 'up', text: '新增' }
    if (value === prev) return { dir: 'flat', text: '0%' }
    const pct = Math.round(Math.abs((value - prev) / prev) * 100)
    return value > prev ? { dir: 'up', text: `${pct}%` } : { dir: 'down', text: `${pct}%` }
  })()

  const snapshotLabel = snapshot ? snapshot.replaceAll('-', '.') : ''
  const pointable = tip !== null && tip.count > 0

  return (
    <>
      <dl key={`s-${weeks}`} className="ascii-heatmap-stats">
        <div className="ascii-heatmap-stat">
          <dt>
            <Icon name="commit" size={12} />
            总提交数
          </dt>
          <dd className="ascii-heatmap-stat__value">
            <strong>{formatCount(stats.total)}</strong>
            <span>次</span>
          </dd>
          <dd className="ascii-heatmap-stat__note">活跃 {stats.activeDays} 天</dd>
        </div>
        <div className="ascii-heatmap-stat">
          <dt>
            <Icon name="chart" size={12} />
            活跃率
          </dt>
          <dd className="ascii-heatmap-stat__value">
            <strong>{stats.rate}</strong>
            <span>%</span>
          </dd>
          <dd className="ascii-heatmap-stat__note">
            日均 {stats.perDay} 次
          </dd>
        </div>
        <div className="ascii-heatmap-stat">
          <dt>
            <Icon name="calendar" size={12} />
            近一周
          </dt>
          <dd className="ascii-heatmap-stat__value">
            <strong>{stats.week.current}</strong>
            <span>次</span>
            <span className={`ascii-heatmap-stat__trend is-${weekTrend.dir}`}>
              {weekTrend.dir !== 'flat' ? (
                <Icon name={weekTrend.dir === 'down' ? 'arrowDown' : 'arrowUp'} size={12} />
              ) : null}
              {weekTrend.text}
            </span>
          </dd>
          <dd className="ascii-heatmap-stat__note">对比前一周 {stats.week.prev} 次</dd>
        </div>
        <div className="ascii-heatmap-stat">
          <dt>
            <Icon name="bolt" size={12} />
            最忙一天
          </dt>
          <dd className="ascii-heatmap-stat__value">
            <strong>{stats.busiest.count}</strong>
            <span>次</span>
          </dd>
          <dd className="ascii-heatmap-stat__note">
            {stats.busiest.count ? shortDate(stats.busiest.day) : '—'}
          </dd>
        </div>
        <div className="ascii-heatmap-stat">
          <dt>
            <Icon name="trophy" size={12} />
            最长连续
          </dt>
          <dd className="ascii-heatmap-stat__value">
            <strong>{stats.longest.length}</strong>
            <span>天</span>
          </dd>
          <dd className="ascii-heatmap-stat__note">
            {stats.longest.length
              ? spanText(stats.longest.start, stats.longest.start + stats.longest.length - 1)
              : '—'}
          </dd>
        </div>
        <div className="ascii-heatmap-stat">
          <dt>
            <Icon name="flame" size={12} />
            当前连续
          </dt>
          <dd className="ascii-heatmap-stat__value">
            <strong>{stats.current.length}</strong>
            <span>天</span>
          </dd>
          <dd className="ascii-heatmap-stat__note">
            {stats.current.length ? spanText(stats.current.start, stats.current.end) : '—'}
          </dd>
        </div>
      </dl>
      <div
        ref={boxRef}
        className={`ascii-heatmap-box${className ? ` ${className}` : ''}`}
        style={{ '--heatmap-cols': cols }}
      >
        <div className="ascii-heatmap__months" key={`m-${weeks}`} aria-hidden="true">
          {months.map(month => (
            <span key={month.key} style={{ left: `${month.left}em` }}>
              {month.text}
            </span>
          ))}
        </div>
        <pre
          key={`g-${weeks}`}
          ref={preRef}
          className={`ascii-heatmap${pointable ? ' is-pointable' : ''}`}
          role="img"
          aria-label="提交热力图"
          aria-describedby={SR_ID}
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
        <span key={`f-${weeks}`} className="ascii-heatmap__sum">
          近 {weeks} 周 <strong ref={sumRef}>{formatCount(stats.total)}</strong> 次提交
        </span>
      </p>
      <p className="ascii-heatmap__meta">
        <span key={`r-${weeks}`} className="ascii-heatmap__range">
          <Icon name="calendar" size={14} />
          {isoOf(stats.first).replaceAll('-', '.')} — {isoOf(START).replaceAll('-', '.')}
        </span>
        <span className="ascii-heatmap__legend" aria-hidden="true">
          less
          {[...LEVELS].map((ch, index) => (
            <span key={ch} className={`hm hm-${index}`}>{ch}</span>
          ))}
          more
        </span>
      </p>
      <p id={SR_ID} className="ascii-heatmap__sr">
        {`提交热力图，最近 ${weeks} 周共 ${formatCount(stats.total)} 次提交，活跃 ${stats.activeDays} 天，活跃率 ${stats.rate}%`}
        {stats.total === 0
          ? '。'
          : `，近一周 ${stats.week.current} 次提交，当前连续 ${stats.current.length} 天，最长连续 ${stats.longest.length} 天，最忙一天 ${stats.busiest.count} 次提交（${isoOf(stats.busiest.day).replaceAll('-', '.')}）。`}
        {snapshotLabel ? `数据来自 git 提交，截至 ${snapshotLabel} 构建。` : ''}
      </p>
    </>
  )
}
