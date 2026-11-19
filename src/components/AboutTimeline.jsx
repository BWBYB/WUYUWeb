import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { milestones } from '../lib/content/milestones'
import { updates } from '../lib/content/updates'
import commitDates from 'virtual:wuyu-commits'
import { useHeaderPin } from './ui/header-pin-context'
import AsciiHeatmap from './AsciiHeatmap'
import Icon from './ui/Icon'
import './AboutTimeline.css'

const formatDate = date => date.replaceAll('-', '.')
const latestUpdate = updates[0]
const commitEntries = commitDates.map(date => ({ date }))

export default function AboutTimeline() {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [docked, setDocked] = useState(false)
  const [navScroll, setNavScroll] = useState({ left: false, right: false })
  const itemRefs = useRef([])
  const navRef = useRef(null)
  const trackRef = useRef(null)
  const indicatorRef = useRef(null)
  const pinHeader = useHeaderPin()
  const spyLockRef = useRef(0)
  const dragRef = useRef({ id: null, startX: 0, startScroll: 0, moved: false })
  const suppressClickUntilRef = useRef(0)
  const userTrackIntentUntilRef = useRef(0)
  // 上一次选中项：换项时判断是否真的切换了（决定是否起步滑行）
  const activeIndexRef = useRef(-1)
  // 换项滑行窗口：期间 RO / 布局同步用平滑跟随，instant 居中会把滑行掐断
  const switchFlightUntilRef = useRef(0)
  // 不活跃时整条导航收成只包住居中项的小胶囊（见下方收起 effect）
  const collapsedRef = useRef(false)

  // 滚动定位 + 停靠判断：导航还停在自然位置（区块开头尚未越过停靠线）时高亮「里程碑」；
  // 停靠后取阅读线以上的最后一个里程碑。阅读线贴着导航下沿，
  // 点击胶囊的落点（导航下方 16px）必然计入，跳转后高亮立即跟上目标卡片。
  useEffect(() => {
    const nav = navRef.current
    const items = itemRefs.current.filter(Boolean)
    if (!nav || items.length === 0) return undefined

    let frame = 0
    const update = () => {
      frame = 0
      const stickyTop = Number.parseFloat(getComputedStyle(nav).top) || 0
      const navRect = nav.getBoundingClientRect()
      const dockedNow = navRect.top <= stickyTop + 0.5 && navRect.bottom > stickyTop + 1
      setDocked(dockedNow)

      // 点击跳转期间由点击目标接管高亮，不让页面滚过中间节点时抢走
      if (performance.now() < spyLockRef.current) return

      let next = -1
      if (navRect.top > stickyTop + 0.5) {
        // 导航在自然位置 = 还没滚到区块开头：显示「里程碑」。
        // 若改回按阅读线判断，首项卡片在区块开头就已高于阅读线，往上滑永远停不到「里程碑」
      } else {
        // 阅读线在导航下沿 + 36px：磁吸落点项 top≈95 在线之上留 20px 余量，
        // 落点附近的微小回滚不会把选中翻回上一项
        const line = navRect.bottom + 36
        items.forEach((item, index) => {
          if (item.getBoundingClientRect().top <= line) next = index
        })
      }
      setActiveIndex(next)
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // 页面滚动结束或用户自己开始滚动时，交还高亮控制权
  useEffect(() => {
    const release = () => {
      spyLockRef.current = 0
    }
    window.addEventListener('scrollend', release)
    window.addEventListener('pointerdown', release, { passive: true })
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchstart', release, { passive: true })
    window.addEventListener('keydown', release)
    return () => {
      window.removeEventListener('scrollend', release)
      window.removeEventListener('pointerdown', release)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('keydown', release)
    }
  }, [])

  useEffect(() => {
    pinHeader(docked)
  }, [docked, pinHeader])

  useEffect(() => () => pinHeader(false), [pinHeader])

  // 记录轨道两端是否还有内容：只有还有内容的一侧才出渐隐提示
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    let frame = 0
    let disposed = false
    const sync = () => {
      frame = 0
      if (disposed) return
      const max = track.scrollWidth - track.clientWidth
      const left = track.scrollLeft > 1
      const right = track.scrollLeft < max - 1
      setNavScroll(prev => (prev.left === left && prev.right === right ? prev : { left, right }))
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    track.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    document.fonts?.ready.then(schedule)
    return () => {
      disposed = true
      if (frame) window.cancelAnimationFrame(frame)
      track.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // 轨道里离正中最近的选项；轨道首项是「里程碑」按钮，偏移一位后 -1 即首项
  const nearestPill = useCallback(() => {
    const track = trackRef.current
    if (!track || track.children.length === 0) return -1
    const trackRect = track.getBoundingClientRect()
    const centerX = trackRect.left + trackRect.width / 2
    let nearest = 0
    let best = Infinity
    Array.from(track.children).forEach((pill, childIndex) => {
      const rect = pill.getBoundingClientRect()
      const distance = Math.abs(rect.left + rect.width / 2 - centerX)
      if (distance < best) {
        best = distance
        nearest = childIndex
      }
    })
    return nearest - 1
  }, [])

  // 深色玻璃层只负责底色，没有自己的文字：宽度跟随滚到中心的那一项，
  // 文字永远由选项自己滑过玻璃，静止时正好落在玻璃正中
  useEffect(() => {
    const track = trackRef.current
    const indicator = indicatorRef.current
    if (!track || !indicator) return undefined

    let frame = 0
    const sync = () => {
      frame = 0
      const pill = track.children[nearestPill() + 1]
      if (pill) {
        indicator.style.width = `${pill.offsetWidth}px`
        // 收起态的小胶囊宽度 = 居中项宽 + 两侧内边距（CSS 读取这个变量）
        navRef.current?.style.setProperty('--about-nav-collapsed-width', `${pill.offsetWidth}px`)
      }
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    track.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    document.fonts?.ready.then(schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      track.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [nearestPill])

  // 当前节点始终停在轨道正中：点击切换、磁吸、滚动切换都会滑过去。
  // 收起态同样平滑滑过去（文案滑过玻璃的动效与展开态一致）；
  // 布局跟随、换项当帧这类需要瞬时就位的地方由调用方传 auto。
  // 轨道首项是「里程碑」按钮，所以实际选项要偏移一位；-1 即回到首项。
  const centerPill = useCallback((index, behavior = 'smooth') => {
    const track = trackRef.current
    const pill = track?.children[index + 1]
    if (!track || !pill) return

    const trackRect = track.getBoundingClientRect()
    const pillRect = pill.getBoundingClientRect()
    const target = track.scrollLeft
      + (pillRect.left - trackRect.left)
      - (track.clientWidth - pillRect.width) / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: target, behavior: reduce ? 'auto' : behavior })
  }, [])

  // 列表首项「里程碑」：回到里程碑区块开头。
  // 落点比停靠线再高 28px：停进「里程碑」高亮区里，不会停在停靠边界上，
  // 停在边界时上下微抖一像素就会翻转选中项。
  const scrollToStart = useCallback(() => {
    const nav = navRef.current
    const section = nav?.closest('.about-timeline')
    if (!nav || !section) return
    const stickyTop = Number.parseFloat(getComputedStyle(nav).top) || 0
    // 吸顶时 nav.offsetTop 含粘滞偏移，自然位置用区块顶 + 内边距推算
    const sectionTop = section.getBoundingClientRect().top + window.scrollY
    const paddingTop = Number.parseFloat(getComputedStyle(section).paddingTop) || 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: Math.max(0, sectionTop + paddingTop - stickyTop - 28),
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [])

  // 磁吸：拖动松手或横扫停稳后，离中心最近的一项滑到正中；
  // 换了一项即视为选中，页面平滑跳到对应里程碑
  const magnetSettle = useCallback(() => {
    const index = nearestPill()
    centerPill(index)
    if (index === activeIndex) return

    spyLockRef.current = performance.now() + 1200
    setActiveIndex(index)
    if (index < 0) {
      scrollToStart()
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`milestone-${milestones[index].id}`)?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [activeIndex, centerPill, nearestPill, scrollToStart])

  // 鼠标拖拽：按住选项左右拖动，完全跟手；松手后交给磁吸
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const onPointerDown = event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      suppressClickUntilRef.current = 0
      dragRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startScroll: track.scrollLeft,
        moved: false,
      }
    }

    const onPointerMove = event => {
      const drag = dragRef.current
      if (drag.id === null || drag.id !== event.pointerId) return
      const dx = event.clientX - drag.startX
      if (!drag.moved) {
        if (Math.abs(dx) < 4) return
        drag.moved = true
        track.classList.add('is-dragging')
      }
      event.preventDefault()
      track.scrollLeft = drag.startScroll - dx
    }

    const endDrag = event => {
      const drag = dragRef.current
      if (drag.id === null || drag.id !== event.pointerId) return
      const moved = drag.moved
      dragRef.current = { id: null, startX: 0, startScroll: 0, moved: false }
      if (!moved) return
      // 拖拽松手可能补发一次 click，只在这个短窗口内拦截，避免过期标记吞掉之后无关的点击
      suppressClickUntilRef.current = performance.now() + 400
      track.classList.remove('is-dragging')
      magnetSettle()
    }

    const stopDrag = () => {
      if (dragRef.current.id === null) return
      dragRef.current = { id: null, startX: 0, startScroll: 0, moved: false }
      track.classList.remove('is-dragging')
    }

    const onClickCapture = event => {
      if (performance.now() >= suppressClickUntilRef.current) return
      event.preventDefault()
      event.stopPropagation()
    }

    track.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove, true)
    window.addEventListener('pointerup', endDrag, true)
    window.addEventListener('pointercancel', stopDrag, true)
    track.addEventListener('click', onClickCapture, true)
    return () => {
      stopDrag()
      window.removeEventListener('pointermove', onPointerMove, true)
      window.removeEventListener('pointerup', endDrag, true)
      window.removeEventListener('pointercancel', stopDrag, true)
      track.removeEventListener('click', onClickCapture, true)
    }
  }, [magnetSettle])

  // 触控板横扫：原生滚动停稳后同样磁吸。
  // 只认用户自己的横向滚动意图——spy/点击/磁吸触发的程序化居中滚动不磁吸，
  // 否则页面滚动时磁吸会把选中项抢回去，形成来回振荡。
  // 一次手势只结算一次：磁吸后立即消费意图窗口，后续滚动噪声（收起过渡、
  // 程序化居中、残余惯性）不会再触发第二次磁吸把选中项吸到别的项上。
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    let timer = 0
    const settle = () => {
      if (dragRef.current.id !== null) return
      if (performance.now() > userTrackIntentUntilRef.current) return
      // 收起/展开过渡期间轨道几何每帧都在变，此时磁吸会吸错项
      if (navRef.current?.getAnimations().length) return
      userTrackIntentUntilRef.current = 0
      magnetSettle()
    }
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 200)
    }
    const markIntent = event => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        userTrackIntentUntilRef.current = performance.now() + 1000
      }
    }

    track.addEventListener('scrollend', settle)
    track.addEventListener('scroll', schedule, { passive: true })
    track.addEventListener('wheel', markIntent, { passive: true })
    return () => {
      window.clearTimeout(timer)
      track.removeEventListener('scrollend', settle)
      track.removeEventListener('scroll', schedule)
      track.removeEventListener('wheel', markIntent)
    }
  }, [magnetSettle])

  // 不活跃时整条导航收成只包住居中项的小胶囊：
  // 指针离开、无键盘焦点、不在拖拽时收起；悬停 / 键盘焦点 / 拖拽时展开。
  // 宽度过渡期间（收起）的居中跟随交给布局同步 effect 的 ResizeObserver 逐帧完成，
  // 这里只管理收起状态本身。
  useLayoutEffect(() => {
    const nav = navRef.current
    const track = trackRef.current
    if (!nav || !track) return undefined

    const canHover = window.matchMedia('(hover: hover)').matches
    let keyboardFocus = false

    const syncCollapsed = () => {
      const next = canHover
        && !nav.matches(':hover')
        && !keyboardFocus
        && dragRef.current.id === null
      if (next === collapsedRef.current) return
      collapsedRef.current = next
      // 用 data 属性而非 class：className 由 React 渲染，重渲染会清掉命令式 class
      nav.dataset.collapsed = next ? 'true' : 'false'
    }

    const onFocusIn = event => {
      // 鼠标点击产生的焦点不保持展开，只有键盘焦点（focus-visible）算活跃
      keyboardFocus = event.target.matches(':focus-visible')
      syncCollapsed()
    }
    const onFocusOut = event => {
      if (nav.contains(event.relatedTarget)) return
      keyboardFocus = false
      syncCollapsed()
    }

    // 先量出居中项宽度再收起（layout effect 在绘制前执行，首帧就是小胶囊）
    const first = track.children[nearestPill() + 1]
    if (first) nav.style.setProperty('--about-nav-collapsed-width', `${first.offsetWidth}px`)
    syncCollapsed()

    nav.addEventListener('pointerenter', syncCollapsed)
    nav.addEventListener('pointerleave', syncCollapsed)
    nav.addEventListener('focusin', onFocusIn)
    nav.addEventListener('focusout', onFocusOut)
    window.addEventListener('pointerup', syncCollapsed)
    window.addEventListener('pointercancel', syncCollapsed)
    return () => {
      nav.removeEventListener('pointerenter', syncCollapsed)
      nav.removeEventListener('pointerleave', syncCollapsed)
      nav.removeEventListener('focusin', onFocusIn)
      nav.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('pointerup', syncCollapsed)
      window.removeEventListener('pointercancel', syncCollapsed)
    }
  }, [nearestPill])

  // 轨道布局同步：两端留出半个轨道的空档（首尾选项也能停进正中），
  // 再把当前节点（或首项「里程碑」）居中。
  // 留白必须跟着轨道实时宽度走：收起/展开时若还用展开态的留白，
  // 轨道会被旧留白撑得比导航宽，居中项相对导航中心偏位。
  // 收起态宽度过渡的每一帧都要重新居中；换项滑行期间用平滑跟随，
  // 其余时刻 instant 对齐（一次性居中会掐断滑行动画）。
  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const setPadding = () => {
      const first = track.firstElementChild
      const last = track.lastElementChild
      if (!first || !last) return
      const half = track.clientWidth / 2
      track.style.paddingLeft = `${Math.max(0, half - first.offsetWidth / 2)}px`
      track.style.paddingRight = `${Math.max(0, half - last.offsetWidth / 2)}px`
    }

    const recenter = index => {
      centerPill(index, performance.now() < switchFlightUntilRef.current ? 'smooth' : 'auto')
    }

    const sync = () => {
      setPadding()
      recenter(activeIndex)
    }

    sync()
    const observer = new ResizeObserver(() => {
      setPadding()
      // 只在收起态跟随；展开态轨道远宽于胶囊，无需逐帧干预。
      // 读 ref 而非闭包：RO 可能在换项的提交与副作用重跑之间送达旧闭包
      if (collapsedRef.current) recenter(activeIndexRef.current)
    })
    observer.observe(track)

    // 滑行与宽度过渡都停稳后 instant 对齐一次：滑行目标是按飞行途中的宽度算的，
    // 可能残留几像素偏差；宽度过渡没结束就交给下一帧 RO 继续跟随
    const onScrollEnd = () => {
      if (!collapsedRef.current) return
      if (performance.now() < switchFlightUntilRef.current) return
      if (navRef.current?.getAnimations().length) return
      centerPill(activeIndexRef.current, 'auto')
    }

    track.addEventListener('scrollend', onScrollEnd)
    window.addEventListener('resize', sync)
    document.fonts?.ready.then(sync)
    return () => {
      observer.disconnect()
      track.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('resize', sync)
    }
  }, [activeIndex, centerPill])

  // 换项：轨道平滑滑到新选中项，文案随之滑过玻璃；收起态同样滑过去，
  // 动效与展开态一致。用 layout effect 在提交阶段起步：被动副作用要等绘制之后，
  // 换项当帧会先闪出一帧旧位置。
  useLayoutEffect(() => {
    const prev = activeIndexRef.current
    activeIndexRef.current = activeIndex
    if (prev === activeIndex) {
      centerPill(activeIndex, 'auto')
      return
    }
    switchFlightUntilRef.current = performance.now() + 600
    centerPill(activeIndex, 'smooth')
  }, [activeIndex, centerPill])

  const navClass = [
    'about-timeline-nav',
    navScroll.left ? 'can-scroll-left' : '',
    navScroll.right ? 'can-scroll-right' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className="about-timeline" aria-label="站点里程碑">
      <nav className={navClass} aria-label="站点里程碑节点" ref={navRef}>
        <div className="about-timeline-nav__track" ref={trackRef}>
          <button
            type="button"
            className="about-timeline-pill"
            aria-current={activeIndex === -1 ? 'true' : undefined}
            onClick={() => {
              // 和里程碑选项一致：点击后立即接管选中态（-1 = 区块开头）
              spyLockRef.current = performance.now() + 1200
              if (activeIndex === -1) centerPill(-1)
              else setActiveIndex(-1)
              scrollToStart()
            }}
          >
            <span className="about-timeline-pill__label">里程碑</span>
          </button>
          {milestones.map((milestone, index) => (
            <a
              key={milestone.id}
              className="about-timeline-pill"
              href={`#milestone-${milestone.id}`}
              draggable={false}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => {
                // 页面平滑滚动期间锁定滚动定位，点击项立即接管高亮与居中
                spyLockRef.current = performance.now() + 1200
                if (index === activeIndex) centerPill(index)
                else setActiveIndex(index)
              }}
            >
              <span className="about-timeline-pill__date">
                {formatDate(milestone.date).slice(0, 7)}
              </span>
              <span className="about-timeline-pill__label">{milestone.navLabel}</span>
            </a>
          ))}
        </div>
        <span className="about-timeline-nav__indicator" ref={indicatorRef} aria-hidden="true" />
      </nav>

      <div className="about-timeline-track">
        <span className="about-timeline-spine" aria-hidden="true">
          <span className="about-timeline-spine__fill" />
        </span>
        <ol className="about-timeline-list">
          {milestones.map((milestone, index) => (
            <li
              key={milestone.id}
              id={`milestone-${milestone.id}`}
              className={`about-timeline-item ${index % 2 === 0 ? 'is-left' : 'is-right'}`}
              ref={element => {
                itemRefs.current[index] = element
              }}
            >
              <span className="about-timeline-node" aria-hidden="true">
                <span className="about-timeline-node__dot" />
              </span>
              <article className="about-timeline-card glass-card">
                <div className="about-timeline-meta">
                  <time className="about-timeline-date" dateTime={milestone.date}>
                    {formatDate(milestone.date)}
                  </time>
                  <span className="about-timeline-kind">{milestone.kind}</span>
                </div>
                <h3 className="about-timeline-card-title">{milestone.title}</h3>
                <p className="about-timeline-card-desc">{milestone.summary}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>

      <div className="about-timeline-status glass-card">
        <div className="about-timeline-status-row">
          <span className="about-timeline-status-live">
            <span className="about-timeline-status-dot" aria-hidden="true" />
            现在
          </span>
          <dl className="about-timeline-status-stats">
            <div className="about-timeline-status-stat">
              <dt>版本</dt>
              <dd>v{latestUpdate.date.slice(0, 7).replace('-', '.')}</dd>
            </div>
            <div className="about-timeline-status-stat">
              <dt>最近更新</dt>
              <dd title={latestUpdate.title}>{formatDate(latestUpdate.date)}</dd>
            </div>
            <div className="about-timeline-status-stat">
              <dt>日志</dt>
              <dd>
                {updates.length}
                <span className="about-timeline-status-unit">条</span>
              </dd>
            </div>
          </dl>
          <a className="about-timeline-status-link" href="#about-changelog">
            更新日志 <Icon name="chevronRight" size={14} />
          </a>
        </div>
        <AsciiHeatmap className="about-timeline-heatmap" entries={commitEntries} unit="commit" />
      </div>
    </section>
  )
}
