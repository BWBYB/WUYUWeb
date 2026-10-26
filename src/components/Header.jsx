import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useThemeSwitcherTheme, useNavSettings } from './ui/theme-switcher-context'
import { easingFromControls, scaledDuration } from './ui/nav-settings'
import NavigationSwitcher from './ui/NavigationSwitcher'
import NavSettingsPanel from './NavSettingsPanel'
import './Header.css'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const { navSettings } = useNavSettings()
  const [isSplit, setIsSplit] = useState(false)
  // 设置小窗口（分裂态点 ⚙ 展开，右侧导航条向下拉伸）
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const navPillRef = useRef(null)
  // 滚动回调里要读「面板是否开着」，但 effect 的闭包拿不到最新 state，用 ref 同步
  const isSettingsOpenRef = useRef(false)

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
    // 面板收起后延迟多久再开始合并：等面板淡出结束（约 200ms），避免「边收边长」
    const PANEL_CLOSE_BEFORE_MERGE = 220

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

      // 回到阈值以内：直接合并，并确保面板关闭
      if (!beyondThreshold) {
        upAccum = 0
        clearMergeTimer()
        setIsSplit(false)
        setIsSettingsOpen(false)
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
        }, PANEL_CLOSE_BEFORE_MERGE)
        return
      }

      // 面板已关：净上滑要累计到 MERGE_UP_DISTANCE，避免阅读时轻蹭就收起导航。
      // 有定时器在等时不要提前合并，否则会绕开「先收起再合并」的节奏。
      if (upAccum >= MERGE_UP_DISTANCE && mergeTimer === null) {
        setIsSplit(false)
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
  }, [navSettings.stretchThreshold])

  // 点面板外部关闭（点击目标不在 nav-pill 内则关闭）
  useEffect(() => {
    if (!isSettingsOpen) return
    const onPointerDown = (e) => {
      if (navPillRef.current && !navPillRef.current.contains(e.target)) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isSettingsOpen])

  const toggleSettings = () => {
    if (!isSplit) {
      // 合并态：保持原行为，直接跳转详细设置页
      navigate('/settings')
      return
    }
    setIsSettingsOpen((prev) => !prev)
  }

  const headerStyle = {
    '--nav-height': `${settings.height * 0.9}px`,
    '--nav-glass-color': settings.glassColor,
    '--nav-light-color': settings.lightColor,
    '--nav-dark-color': settings.darkColor,
    '--nav-content-color': resolvedTheme === 'light' ? settings.contentColor : '#e1e1e1',
    '--nav-action-color': resolvedTheme === 'light' ? settings.actionColor : '#03d5ff',
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
      className={isSplit ? 'site-header is-split' : 'site-header'}
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
          isSplit={isSplit}
          onToggleSettings={toggleSettings}
        />

        {/* 设置小窗口：分裂态点 ⚙ 展开，右侧导航条向下拉伸 */}
        <NavSettingsPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </header>
  )
}
