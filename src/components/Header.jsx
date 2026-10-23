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

  // 「关于」页（点 logo 进入）：logo 文字亮起。
  const isAboutPage = location.pathname === '/about' || location.pathname.startsWith('/about/')
  // 「设置」页（点 ⚙ 进入）：只让导航选中胶囊淡出，logo 不变。
  const isSettingsPage = location.pathname === '/settings' || location.pathname.startsWith('/settings/')

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      const nextSplit = window.scrollY >= navSettings.stretchThreshold
      setIsSplit(nextSplit)
      // 分裂→合并时自动关闭设置小窗口（合并态下不展示面板）
      if (!nextSplit) setIsSettingsOpen(false)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
          WUYU
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
