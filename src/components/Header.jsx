import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useThemeSwitcherTheme, useNavSettings } from './ui/theme-switcher-context'
import { easingFromControls, scaledDuration } from './ui/nav-settings'
import NavigationSwitcher from './ui/NavigationSwitcher'
import NavSettingsPanel from './NavSettingsPanel'
import './Header.css'

export default function Header({ paper = false }) {
  const location = useLocation()
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const { navSettings } = useNavSettings()
  const [isSplit, setIsSplit] = useState(false)
  // 合并态点 ⚙：先强制分裂，再开面板。滚动判定之外的一个临时分裂态。
  const [isForcedSplit, setIsForcedSplit] = useState(false)
  // 设置小窗口（分裂态点 ⚙ 展开，右侧导航条向下拉伸）
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const navPillRef = useRef(null)
  const openTimerRef = useRef(null)
  const closeTimerRef = useRef(null)
  // 滚动回调里要读「面板是否开着」，但 effect 的闭包拿不到最新 state，用 ref 同步
  const isSettingsOpenRef = useRef(false)

  const splitActive = isSplit || isForcedSplit
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

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  // 卸载时清掉两个延迟，避免在已卸载组件上 setState
  useEffect(() => () => {
    clearOpenTimer()
    clearCloseTimer()
  }, [])

  useEffect(() => {
    isSettingsOpenRef.current = isSettingsOpen
  }, [isSettingsOpen])

  // 「关于」页（点 logo 进入）：logo 文字亮起。
  const isAboutPage = location.pathname === '/about' || location.pathname.startsWith('/about/')
  // 「设置」页（点 ⚙ 进入）：只让导航选中胶囊淡出，logo 不变。
  const isSettingsPage = location.pathname === '/settings' || location.pathname.startsWith('/settings/')

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
        clearCloseTimer()

        if (isSettingsOpenRef.current) {
          clearMergeTimer()
          setIsSettingsOpen(false)
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
      if (isSettingsOpenRef.current) {
        clearMergeTimer()
        setIsSettingsOpen(false)
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

  // 关闭面板：若分裂是被 ⚙ 强制出来的，等面板收起后再合并，
  // 避免「边收面板边缩胶囊」的抽搐。
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false)

    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }

    if (!isForcedSplit) return

    if (window.scrollY >= navSettings.stretchThreshold) {
      setIsForcedSplit(false)
      return
    }

    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setIsForcedSplit(false)
    }, panelCloseMergeMs)
  }, [isForcedSplit, navSettings.stretchThreshold, panelCloseMergeMs])

  // 点面板外部关闭（点击目标不在 nav-pill 内则关闭）
  useEffect(() => {
    if (!isSettingsOpen) return
    const onPointerDown = (e) => {
      if (navPillRef.current && !navPillRef.current.contains(e.target)) {
        closeSettings()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isSettingsOpen, closeSettings])

  const toggleSettings = () => {
    // 合并态点 ⚙：先分裂，等宽度动画走完再展开小窗，相当于分裂后再点一次
    if (!splitActive) {
      clearCloseTimer()
      setIsForcedSplit(true)

      // 1× 时等 400ms，随动画倍速等比缩放（慢放时不会抢在分裂之前）
      clearOpenTimer()
      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null
        setIsSettingsOpen(true)
      }, Math.round(400 / navSettings.animationSpeed))
      return
    }

    if (isSettingsOpen) {
      closeSettings()
      return
    }

    clearOpenTimer()
    clearCloseTimer()
    setIsSettingsOpen(true)
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
      data-on-about={isAboutPage ? 'true' : undefined}
      data-hide-capsule={isAboutPage || isSettingsPage ? 'true' : undefined}
      data-settings-open={isSettingsOpen ? 'true' : undefined}
    >
      <div className="logo-pill">
        <Link to="/about" className="site-header-logo" aria-label="WUYU 关于">
          W<span className="logo-rest">UYU</span>
        </Link>
      </div>

      <div
        className="nav-pill"
        ref={navPillRef}
        data-settings-open={isSettingsOpen ? 'true' : undefined}
      >
        <NavigationSwitcher
          onToggleSettings={toggleSettings}
          paper={paper}
        />

        {/* 设置小窗口：分裂态点 ⚙ 展开，右侧导航条向下拉伸 */}
        <NavSettingsPanel open={isSettingsOpen} onClose={closeSettings} />
      </div>
    </header>
  )
}
