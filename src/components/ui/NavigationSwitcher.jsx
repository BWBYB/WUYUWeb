import { useEffect, useId, useRef, useState } from 'react'
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
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [previousOption, setPreviousOption] = useState(String(initialIndex + 1))
  const radioGroupName = `navigation-${useId()}`

  // 动画期锁定：胶囊移动动画播放期间，新的切换目标先排队，等当前动画
  // 结束后再依次执行，避免 CSS animation 从中途被重触发（跳回写死的 0% 起点）导致抽搐。
  const animatingRef = useRef(false)
  const pendingIndexRef = useRef(null)
  const lockTimerRef = useRef(null)
  // 用 ref 记录「胶囊当前实际停在哪个 index」，避免闭包 stale（动画结束时读到旧 activeIndex）。
  const currentIndexRef = useRef(initialIndex)

  // 动画结束（或兜底超时）时调用：解锁，若队列还有目标则继续切换。
  const finishAnimation = () => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current)
      lockTimerRef.current = null
    }
    animatingRef.current = false
    const pending = pendingIndexRef.current
    if (pending !== null && pending !== currentIndexRef.current) {
      pendingIndexRef.current = null
      commitSwitch(currentIndexRef.current, pending)
    }
  }

  // 从 current 切换到 target（驱动胶囊动画）。current 必须是「胶囊当前实际位置」。
  const commitSwitch = (current, target) => {
    if (target === current) return
    setPreviousOption(String(current + 1))
    setActiveIndex(target)
    currentIndexRef.current = target
    animatingRef.current = true
    // 兜底：若 animationend 因 reduced-motion / 动画被禁用而未触发，
    // 用超时（略长于最长动画）强制解锁，避免后续点击被永久锁住。
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    lockTimerRef.current = setTimeout(finishAnimation, 2000)
  }

  const handleAnimationEnd = () => finishAnimation()

  // 浏览器前进/后退、或路由变化时，把胶囊追赶到最新页。
  useEffect(() => {
    if (routeIndex < 0 || routeIndex === activeIndex) return
    if (animatingRef.current) {
      // 正在播动画：只更新排队目标，等当前动画结束再追。
      pendingIndexRef.current = routeIndex
      return
    }
    commitSwitch(activeIndex, routeIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeIndex])

  const selectNavigation = (nextIndex) => {
    navigate(navigationOptions[nextIndex].path)
    if (animatingRef.current) {
      // 正在播动画：目标先排队，页面已立即跳转，胶囊到位后再追。
      pendingIndexRef.current = nextIndex
      return
    }
    commitSwitch(activeIndex, nextIndex)
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
      onAnimationEnd={handleAnimationEnd}
    >
      <legend className="switcher__legend">主导航</legend>

      {navigationOptions.map((option, index) => (
        <label
          key={option.path}
          className="switcher__option"
          onClick={() => selectNavigation(index)}
        >
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
