import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useThemeSwitcherTheme, useNavSettings } from './ui/theme-switcher-context'
import { easingFromControls, scaledDuration } from './ui/nav-settings'
import { MEDIA } from '../lib/breakpoints'
import NavigationSwitcher from './ui/NavigationSwitcher'
import NavSettingsPanel from './NavSettingsPanel'
import NavMorePanel from './NavMorePanel'
import './Header.css'

// ≤600 时导航常驻分裂态，不随滚动合并。
function subscribeCompact(callback) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const media = window.matchMedia(MEDIA.small)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function getCompactSnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(MEDIA.small).matches
}

function getCompactServerSnapshot() {
  return false
}

export default function Header({ paper = false }) {
  const location = useLocation()
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const { navSettings } = useNavSettings()
  const isCompactViewport = useSyncExternalStore(
    subscribeCompact,
    getCompactSnapshot,
    getCompactServerSnapshot,
  )
  const [isSplit, setIsSplit] = useState(false)
  // 合并态点 ⚙ / 更多：先强制分裂再开面板；关闭后保持分裂，不再合并回去。
  const [isForcedSplit, setIsForcedSplit] = useState(false)
  // 设置小窗口（分裂态点 ⚙ 展开，右侧导航条向下拉伸）
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // 更多小窗口：探索 / CD机 收进这里
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const navPillRef = useRef(null)
  const openTimerRef = useRef(null)
  // 路由切换后的一小段时间内页面高度变化会钳制滚动位置，
  // 这种滚动不是用户手势，不能据此触发合并。
  const navGraceRef = useRef(0)
  // 滚动回调里要读「面板是否开着」，但 effect 的闭包拿不到最新 state，用 ref 同步
  const isSettingsOpenRef = useRef(false)
  const isMoreOpenRef = useRef(false)

  // 小屏常驻分裂：滚动、回顶部都不再触发合并
  const splitActive = isCompactViewport || isSplit || isForcedSplit
  // 面板高度收起需要一整个分裂时长；等它收完再合并宽度，否则会边收边缩
  const panelCloseMergeMs = Math.max(
    220,
    Math.round((navSettings.stretchDuration / navSettings.animationSpeed) * 1000 + 40),
  )

  const clearOpenTimer = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }

  // 卸载时清掉延迟，避免在已卸载组件上 setState
  useEffect(() => () => clearOpenTimer(), [])

  // useLayoutEffect：必须赶在浏览器因新页面高度钳制滚动之前设好宽限期
  useLayoutEffect(() => {
    navGraceRef.current = performance.now() + 260
  }, [location.pathname])

  useEffect(() => {
    isSettingsOpenRef.current = isSettingsOpen
  }, [isSettingsOpen])

  useEffect(() => {
    isMoreOpenRef.current = isMoreOpen
  }, [isMoreOpen])

  // 「简历」页（点 logo 进入）：logo 文字亮起。
  const isResumePage = location.pathname === '/resume' || location.pathname.startsWith('/resume/')
  // 「设置」页（点 ⚙ 进入）：只让导航选中胶囊淡出，logo 不变。
  const isSettingsPage = location.pathname === '/settings' || location.pathname.startsWith('/settings/')
  // 探索 / CD机 属于「更多」板块：选中胶囊停在「更多」按钮上，提示当前板块
  const isMorePage = location.pathname === '/lab' || location.pathname.startsWith('/lab/') ||
    location.pathname === '/player' || location.pathname.startsWith('/player/')

  useEffect(() => {
    let ticking = false
    // 方向判定滞回：小于 8px 的位移不改变方向，过滤触控板与惯性滚动的抖动
    const DIRECTION_HYSTERESIS = 8
    // 上滑累计多少像素才合并：避免阅读时手指轻蹭就收起整条导航
    const MERGE_UP_DISTANCE = 40
    // 面板收起后延迟多久再开始合并：见 panelCloseMergeMs

    let lastY = window.scrollY
    // 初屏就在深处时按「向下」处理，刷新后保持分裂态，不会突然合并
    let dir = window.scrollY >= navSettings.stretchThreshold ? 1 : 0
    // 净上滑距离：向上累加、向下抵扣，最低 0；用于判断「是否真的在往回滑」
    let upAccum = 0
    let mergeTimer = null

    const clearMergeTimer = () => {
      if (mergeTimer !== null) {
        window.clearTimeout(mergeTimer)
        mergeTimer = null
      }
    }

    const update = () => {
      ticking = false
      const y = window.scrollY

      // 路由切换宽限期内只同步基准，不判断方向，避免把滚动钳制当成上滑
      if (performance.now() < navGraceRef.current) {
        lastY = y
        dir = 0
        upAccum = 0
        return
      }

      const dy = y - lastY
      lastY = y

      if (dy >= DIRECTION_HYSTERESIS) dir = 1
      else if (dy <= -DIRECTION_HYSTERESIS) dir = -1

      upAccum = Math.max(0, upAccum - dy)

      const beyondThreshold = y >= navSettings.stretchThreshold

      // 回到阈值以内：面板开着就先收面板，等高度收完再合并宽度
      if (!beyondThreshold) {
        upAccum = 0
        clearOpenTimer()

        if (isSettingsOpenRef.current || isMoreOpenRef.current) {
          clearMergeTimer()
          setIsSettingsOpen(false)
          setIsMoreOpen(false)
          mergeTimer = window.setTimeout(() => {
            mergeTimer = null
            setIsSplit(false)
            setIsForcedSplit(false)
          }, panelCloseMergeMs)
          return
        }

        clearMergeTimer()
        setIsSplit(false)
        setIsForcedSplit(false)
        return
      }

      // 向下滑：分裂，面板保持不动
      if (dir === 1) {
        clearMergeTimer()
        setIsSplit(true)
        return
      }

      // 上滑位移太小（方向还没明确）：不做任何切换
      if (dir !== -1) return

      // 向上滑：面板开着就先收起（8px 即响应，遮挡物早收早好），等它淡出后再合并
      if (isSettingsOpenRef.current || isMoreOpenRef.current) {
        clearMergeTimer()
        setIsSettingsOpen(false)
        setIsMoreOpen(false)
        mergeTimer = window.setTimeout(() => {
          mergeTimer = null
          setIsSplit(false)
          setIsForcedSplit(false)
        }, panelCloseMergeMs)
        return
      }

      // 面板已关：净上滑要累计到 MERGE_UP_DISTANCE，避免阅读时轻蹭就收起导航。
      // 有定时器在等时不要提前合并，否则会绕开「先收起再合并」的节奏。
      if (upAccum >= MERGE_UP_DISTANCE && mergeTimer === null) {
        setIsSplit(false)
        setIsForcedSplit(false)
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearMergeTimer()
    }
  }, [navSettings.stretchThreshold, panelCloseMergeMs])

  // 关闭面板只收面板：从合并态展开出来的分裂保留，不再合并回去。
  const closePanels = useCallback(() => {
    setIsSettingsOpen(false)
    setIsMoreOpen(false)

    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  // 点面板外部关闭（点击目标不在 nav-pill 内则关闭）
  useEffect(() => {
    if (!isSettingsOpen && !isMoreOpen) return
    const onPointerDown = (e) => {
      if (navPillRef.current && !navPillRef.current.contains(e.target)) {
        closePanels()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isSettingsOpen, isMoreOpen, closePanels])

  const openPanelAfterSplit = (panel) => {
    setIsForcedSplit(true)

    // 1× 时等 400ms，随动画倍速等比缩放（慢放时不会抢在分裂之前）
    clearOpenTimer()
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null
      setIsSettingsOpen(panel === 'settings')
      setIsMoreOpen(panel === 'more')
    }, Math.round(400 / navSettings.animationSpeed))
  }

  const toggleSettings = () => {
    // 合并态点 ⚙：先分裂，等宽度动画走完再展开小窗，相当于分裂后再点一次
    if (!splitActive) {
      openPanelAfterSplit('settings')
      return
    }

    if (isSettingsOpen) {
      closePanels()
      return
    }

    clearOpenTimer()
    setIsMoreOpen(false)
    setIsSettingsOpen(true)
  }

  const toggleMore = () => {
    if (!splitActive) {
      openPanelAfterSplit('more')
      return
    }

    if (isMoreOpen) {
      closePanels()
      return
    }

    clearOpenTimer()
    setIsSettingsOpen(false)
    setIsMoreOpen(true)
  }

  // 深色统一用铜色高亮；浅色纸色用赭石，普通浅色仍交给设置面板
  const actionColor = resolvedTheme === 'light'
    ? (paper ? '#a4502a' : settings.actionColor)
    : '#c4713f'
  const contentColor = resolvedTheme === 'light'
    ? (paper ? '#1b1a17' : settings.contentColor)
    : '#ded9cf'

  const headerStyle = {
    '--nav-height': `${settings.height * 0.9}px`,
    '--nav-glass-color': settings.glassColor,
    '--nav-light-color': settings.lightColor,
    '--nav-dark-color': settings.darkColor,
    '--nav-content-color': contentColor,
    '--nav-action-color': actionColor,
    '--nav-glass-opacity': `${settings.glassOpacity}%`,
    '--nav-active-opacity': `${settings.activeOpacity}%`,
    '--nav-blur': `${settings.blur}px`,
    '--nav-saturation': `${settings.saturation}%`,
    '--nav-reflex-light': resolvedTheme === 'light' ? 1 : 0.3,
    '--nav-reflex-dark': resolvedTheme === 'light' ? 1 : 2,
    // 分裂动效（动画快慢 / 缓动 / 时长）
    '--nav-stretch-duration': scaledDuration(navSettings.stretchDuration, navSettings.animationSpeed),
    '--nav-stretch-easing': easingFromControls(
      navSettings.easingStart,
      navSettings.easingEnd,
    ),
  }

  return (
    <header
      className={splitActive ? 'site-header is-split' : 'site-header'}
      style={headerStyle}
      data-on-resume={isResumePage ? 'true' : undefined}
      data-hide-capsule={isResumePage || isSettingsPage ? 'true' : undefined}
      data-settings-open={isSettingsOpen ? 'true' : undefined}
      data-more-open={isMoreOpen ? 'true' : undefined}
    >
      <div className="logo-pill">
        <Link to="/resume" className="site-header-logo" aria-label="WUYU 简历">
          W<span className="logo-rest">UYU</span>
        </Link>
      </div>

      <div
        className="nav-pill"
        ref={navPillRef}
        data-settings-open={isSettingsOpen ? 'true' : undefined}
        data-more-open={isMoreOpen ? 'true' : undefined}
      >
        <NavigationSwitcher
          onToggleSettings={toggleSettings}
          onToggleMore={toggleMore}
          moreOpen={isMoreOpen}
          moreActive={isMorePage}
          paper={paper}
        />

        {/* 设置小窗口：分裂态点 ⚙ 展开，右侧导航条向下拉伸 */}
        <NavSettingsPanel open={isSettingsOpen} onClose={closePanels} />

        {/* 更多小窗口：探索 / CD机 */}
        <NavMorePanel open={isMoreOpen} onClose={closePanels} />
      </div>
    </header>
  )
}
