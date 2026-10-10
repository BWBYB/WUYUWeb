import { Link } from 'react-router-dom'
import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import NavigationSwitcher from './ui/NavigationSwitcher'
import './Header.css'

export default function Header() {
  const { settings, resolvedTheme } = useThemeSwitcherTheme()

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
  }

  return (
    <header
      className="site-header"
      style={headerStyle}
    >
      <Link to="/about" className="site-header-logo" aria-label="WUYU 关于">
        <span>WUYU</span>
      </Link>

      <NavigationSwitcher />
    </header>
  )
}
