import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeSwitcherTheme } from './theme-switcher-context'
import Icon from './Icon'
import './navigation-switcher.css'

const navigationOptions = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/blog', label: '文章', icon: 'pencil' },
  { path: '/about', label: '关于', icon: 'info' },
]

const moreOption = { label: '更多', icon: 'more' }
const settingsOption = { path: '/settings', label: '设置', icon: 'settings' }

function isActivePath(path, pathname) {
  if (path === '/') return pathname === '/'
  return pathname === path ||
    pathname.startsWith(`${path}/`) ||
    (path === '/blog' && (pathname.startsWith('/post/') || pathname.startsWith('/archive')))
}

function getRouteIndex(pathname) {
  return navigationOptions.findIndex(option => isActivePath(option.path, pathname))
}

export default function NavigationSwitcher({
  onToggleSettings,
  onToggleMore,
  moreOpen = false,
  moreActive = false,
  paper = false,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { settings, resolvedTheme } = useThemeSwitcherTheme()
  const routeIndex = getRouteIndex(location.pathname)
  // 探索 / CD机 属于「更多」板块：把选中胶囊停到「更多」按钮上（第 4 格）
  const moreIndex = navigationOptions.length
  const targetIndex = routeIndex >= 0 ? routeIndex : (moreActive ? moreIndex : null)
  const [activeIndex, setActiveIndex] = useState(targetIndex ?? 0)
  const [previousOption, setPreviousOption] = useState(String((targetIndex ?? 0) + 1))
  const radioGroupName = `navigation-${useId()}`

  // 动画期锁定：胶囊移动动画播放期间，新的切换目标先排队，等当前动画
  // 结束后再依次执行，避免 CSS animation 从中途被重触发（跳回写死的 0% 起点）导致抽搐。
  const animatingRef = useRef(false)
  const pendingIndexRef = useRef(null)
  const lockTimerRef = useRef(null)
  // 用 ref 记录「胶囊当前实际停在哪个 index」，避免闭包 stale（动画结束时读到旧 activeIndex）。
  const currentIndexRef = useRef(targetIndex ?? 0)

  // 动画结束（或超时兜底）时调用：解锁，若队列还有目标则继续切换。
  // 不依赖 animationend 事件（在 translate 属性动画上不可靠），改用固定时长 setTimeout。
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
    // 相邻格用 duration，跨 2 格用 long-duration，据此在动画播完后解锁。
    const distance = Math.abs(target - current)
    const durationSec = distance >= 2 ? settings.longDuration : settings.duration
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
    lockTimerRef.current = setTimeout(finishAnimation, (durationSec + 0.05) * 1000)
  }

  // 单一数据流：胶囊移动只由「路由变化 → 本 effect」驱动。
  useEffect(() => {
    if (targetIndex === null) return
    if (targetIndex === currentIndexRef.current) return
    if (animatingRef.current) {
      pendingIndexRef.current = targetIndex
      return
    }
    commitSwitch(currentIndexRef.current, targetIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIndex])

  const selectNavigation = (nextIndex) => {
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
    '--c-content': resolvedTheme === 'light'
      ? (paper ? '#1b1a17' : settings.contentColor)
      : '#ded9cf',
    '--c-action': resolvedTheme === 'light'
      ? (paper ? '#a4502a' : settings.actionColor)
      : '#c4713f',
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
            // 阻止 input 的原生 click/change 行为：点击 label 会默认「转发」点击给内部 radio，
            // 触发 radio 切换 + onChange，若这里也 navigate 会向历史栈 push 第二条记录，
            // 导致「返回」要按两次。导航只由 label 的 onClick 触发一次 navigate。
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onChange={(e) => e.preventDefault()}
            readOnly
            tabIndex={-1}
          />
          <Icon name={option.icon} size={20} className="navigation-option-icon" />
          <span className="navigation-option-label">{option.label}</span>
        </label>
      ))}

      <button
        type="button"
        className="switcher__option navigation-more-link"
        aria-label={moreOption.label}
        aria-expanded={moreOpen ? 'true' : 'false'}
        aria-current={moreActive ? 'true' : undefined}
        onClick={() => {
          if (onToggleMore) onToggleMore()
        }}
      >
        <Icon name={moreOption.icon} size={20} className="navigation-option-icon" />
        <span className="navigation-option-label">{moreOption.label}</span>
      </button>

      <button
        type="button"
        className="switcher__option navigation-settings-link"
        aria-label={settingsOption.label}
        onClick={() => {
          // 合并态也走这里：Header 会先分裂、再展开小窗
          if (onToggleSettings) onToggleSettings()
        }}
      >
        <Icon name={settingsOption.icon} size={20} className="navigation-option-icon" />
        <span className="navigation-option-label">{settingsOption.label}</span>
      </button>
    </fieldset>
  )
}
