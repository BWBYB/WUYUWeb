import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useThemeSwitcherTheme, useNavSettings } from './ui/theme-switcher-context'
import { easingFromControls, scaledDuration } from './ui/nav-settings'
import NavigationSwitcher from './ui/NavigationSwitcher'
import './Header.css'

export default function Header() {
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const { navSettings } = useNavSettings()
  const [isSplit, setIsSplit] = useState(false)

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      setIsSplit(window.scrollY >= navSettings.stretchThreshold)
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
    >
      <div className="logo-pill">
        <Link to="/about" className="site-header-logo" aria-label="WUYU 关于">
          WUYU
        </Link>
      </div>

      <div className="nav-pill">
        <NavigationSwitcher />
      </div>
    </header>
  )
}
