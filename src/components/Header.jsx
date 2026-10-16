import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useThemeSwitcherTheme, useNavSettings } from './ui/theme-switcher-context'
import { easingFromControls, scaledDuration } from './ui/nav-settings'
import NavigationSwitcher from './ui/NavigationSwitcher'
import './Header.css'

export default function Header() {
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const { navSettings } = useNavSettings()
  const [isStretched, setIsStretched] = useState(false)

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      setIsStretched(window.scrollY >= navSettings.stretchThreshold)
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
    // 导航栏拉伸动效（独立 navSettings）
    '--nav-stretch-inset': `${navSettings.stretchInset}px`,
    '--nav-stretch-duration': scaledDuration(navSettings.stretchDuration, navSettings.animationSpeed),
    '--nav-stretch-easing': easingFromControls(
      navSettings.easingStart,
      navSettings.easingEnd,
    ),
    '--nav-expanded-option-width': `${navSettings.expandedOptionWidth}px`,
    '--nav-collapsed-option-width': `${navSettings.collapsedOptionWidth}px`,
    '--nav-collapsed-capsule-width': `${navSettings.collapsedCapsuleWidth}px`,
    '--nav-collapsed-gap': `${Math.round(navSettings.collapsedOptionWidth * 0.09)}px`,
    // 胶囊 left 对齐：left = 12 + (optionWidth - capsuleWidth)/2（保证圆心对准按钮中心）
    '--nav-collapsed-capsule-left': `${12 + (navSettings.collapsedOptionWidth - navSettings.collapsedCapsuleWidth) / 2}px`,
  }

  return (
    <header
      className={isStretched ? 'site-header is-stretched' : 'site-header'}
      style={headerStyle}
    >
      <Link to="/about" className="site-header-logo" aria-label="WUYU 关于">
        <span>WUYU</span>
      </Link>

      <NavigationSwitcher />
    </header>
  )
}
