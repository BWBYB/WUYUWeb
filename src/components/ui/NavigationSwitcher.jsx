import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useThemeSwitcherTheme } from './theme-switcher-context'
import './navigation-switcher.css'

const navigationOptions = [
  { path: '/', label: '首页', icon: '◉' },
  { path: '/blog', label: '文章', icon: '✎' },
  { path: '/lab', label: '探索', icon: '◈' },
  { path: '/player', label: 'CD机', icon: '♫' },
]

const settingsOption = { path: '/settings', label: '设置', icon: '⚙' }

function isActivePath(path, pathname) {
  if (path === '/') return pathname === '/'
  return pathname === path ||
    pathname.startsWith(`${path}/`) ||
    (path === '/blog' && (pathname.startsWith('/post/') || pathname.startsWith('/archive')))
}

function getRouteIndex(pathname) {
  return navigationOptions.findIndex(option => isActivePath(option.path, pathname))
}

export default function NavigationSwitcher() {
  const location = useLocation()
  const navigate = useNavigate()
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const routeIndex = getRouteIndex(location.pathname)
  const initialIndex = routeIndex >= 0 ? routeIndex : 0
  const [lastRouteIndex, setLastRouteIndex] = useState(initialIndex)
  const [previousOption, setPreviousOption] = useState(String(initialIndex + 1))
  const radioGroupName = `navigation-${useId()}`
  const activeIndex = routeIndex >= 0 ? routeIndex : lastRouteIndex

  // Keep browser back/forward transitions on the same path as direct clicks.
  useEffect(() => {
    if (routeIndex < 0 || routeIndex === lastRouteIndex) return
    setPreviousOption(String(lastRouteIndex + 1))
    setLastRouteIndex(routeIndex)
  }, [lastRouteIndex, routeIndex])

  const selectNavigation = (nextIndex) => {
    if (nextIndex !== activeIndex) {
      setPreviousOption(String(activeIndex + 1))
    }
    navigate(navigationOptions[nextIndex].path)
  }

  const switcherStyle = {
    '--switcher-duration': `${settings.duration}s`,
    '--switcher-long-duration': `${settings.longDuration}s`,
    '--switcher-pre-stretch': settings.preStretch,
    '--switcher-stretch': settings.stretch,
    '--switcher-accel-distance': settings.accelDistance,
    '--switcher-cruise-distance': settings.cruiseDistance,
    '--switcher-settle-distance': settings.settleDistance,
    '--switcher-early-distance': 1 - settings.settleDistance,
    '--switcher-glass-opacity': `${settings.glassOpacity}%`,
    '--switcher-active-opacity': `${settings.activeOpacity}%`,
    '--switcher-blur': `${settings.blur}px`,
    '--switcher-saturation': `${settings.saturation}%`,
    '--c-glass': settings.glassColor,
    '--c-light': settings.lightColor,
    '--c-dark': settings.darkColor,
    '--c-content': resolvedTheme === 'light' ? settings.contentColor : '#e1e1e1',
    '--c-action': resolvedTheme === 'light' ? settings.actionColor : '#03d5ff',
    '--glass-reflex-light': resolvedTheme === 'light' ? 1 : 0.3,
    '--glass-reflex-dark': resolvedTheme === 'light' ? 1 : 2,
    '--switcher-height': `${settings.height * 0.9}px`,
    '--switcher-option-width': `${settings.optionWidth}px`,
    '--switcher-gap': `${settings.gap}px`,
    '--switcher-capsule-width': `${settings.capsuleWidth}px`,
  }

  return (
    <fieldset
      className="switcher switcher--navigation"
      style={switcherStyle}
      data-previous-option={previousOption}
      data-active-option={String(activeIndex + 1)}
    >
      <legend className="switcher__legend">主导航</legend>

      {navigationOptions.map((option, index) => (
        <label key={option.path} className="switcher__option">
          <input
            className="switcher__input"
            type="radio"
            name={radioGroupName}
            value={option.path}
            c-option={String(index + 1)}
            checked={activeIndex === index}
            onChange={() => selectNavigation(index)}
          />
          <span className="switcher__icon navigation-option-icon" aria-hidden="true">{option.icon}</span>
          <span className="navigation-option-label">{option.label}</span>
        </label>
      ))}

      <Link
        to={settingsOption.path}
        className="switcher__option navigation-settings-link"
        aria-label={settingsOption.label}
      >
        <span className="switcher__icon navigation-option-icon" aria-hidden="true">{settingsOption.icon}</span>
        <span className="navigation-option-label">{settingsOption.label}</span>
      </Link>
    </fieldset>
  )
}
