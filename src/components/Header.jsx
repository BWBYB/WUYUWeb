import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePerformanceEffects } from '../hooks/usePerformanceEffects'
import './Header.css'

const navItems = [
  { path: '/', label: '首页', icon: '◉' },
  { path: '/blog', label: '文章', icon: '✎' },
  { path: '/lab', label: '探索', icon: '◈' },
  { path: '/player', label: 'CD机', icon: '♫' },
]

export default function Header() {
  const location = useLocation()
  const [isSeparated, setIsSeparated] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSettingsClosing, setIsSettingsClosing] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(5)
  const [performanceEffectsEnabled, setPerformanceEffectsEnabled] = usePerformanceEffects()
  const peakY = useRef(0)
  const settingsOrigin = useRef(null)
  const headerRef = useRef(null)
  const navRef = useRef(null)
  const pointerFrame = useRef(null)
  const pointerPosition = useRef({ headerX: 0, headerY: 0, navX: 0, navY: 0 })

  const animationSpeedPercent = ((animationSpeed - 1) / 7) * 100
  const headerMotionStyle = {
    '--morph-duration': `${(1.8 / animationSpeed).toFixed(3)}s`,
    '--logo-duration': `${(2.5 / animationSpeed).toFixed(3)}s`,
    '--fade-duration': `${(1.5 / animationSpeed).toFixed(3)}s`,
    '--label-duration': `${(2 / animationSpeed).toFixed(3)}s`,
    '--surface-duration': `${(1.1 / animationSpeed).toFixed(3)}s`,
    '--edge-duration': `${(0.8 / animationSpeed).toFixed(3)}s`,
    '--panel-duration': `${(0.28 / animationSpeed).toFixed(3)}s`,
  }

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path ||
      location.pathname.startsWith(`${path}/`) ||
      (path === '/blog' && (location.pathname.startsWith('/post/') || location.pathname.startsWith('/archive')))
  }

  const setPointerPosition = (event) => {
    if (!navRef.current || (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return

    const headerRect = headerRef.current?.getBoundingClientRect()
    const navRect = navRef.current.getBoundingClientRect()
    if (!headerRect) return

    pointerPosition.current = {
      headerX: event.clientX - headerRect.left,
      headerY: event.clientY - headerRect.top,
      navX: event.clientX - navRect.left,
      navY: event.clientY - navRect.top,
    }

    if (pointerFrame.current !== null) return
    pointerFrame.current = requestAnimationFrame(() => {
      if (navRef.current) {
        navRef.current.style.setProperty('--pointer-x', `${pointerPosition.current.navX}px`)
        navRef.current.style.setProperty('--pointer-y', `${pointerPosition.current.navY}px`)
      }
      if (headerRef.current) {
        headerRef.current.style.setProperty('--pointer-x', `${pointerPosition.current.headerX}px`)
        headerRef.current.style.setProperty('--pointer-y', `${pointerPosition.current.headerY}px`)
      }
      pointerFrame.current = null
    })
  }

  const showPointerHighlight = (event) => {
    if (!event.pointerType || event.pointerType === 'mouse' || event.pointerType === 'pen') {
      headerRef.current?.style.setProperty('--pointer-opacity', '1')
      navRef.current?.style.setProperty('--pointer-opacity', '1')
    }
  }

  const hidePointerHighlight = (event) => {
    const relatedTarget = event?.relatedTarget
    const remainsInsideHeader = relatedTarget instanceof Node && headerRef.current?.contains(relatedTarget)

    if (event?.currentTarget === navRef.current) {
      navRef.current?.style.setProperty('--pointer-opacity', '0')
    }
    if (!remainsInsideHeader) {
      headerRef.current?.style.setProperty('--pointer-opacity', '0')
    }
  }

  const closeSettings = useCallback(() => {
    const shouldMerge = settingsOrigin.current === 'unified'
    settingsOrigin.current = null
    setIsSettingsOpen(false)
    setIsSettingsClosing(shouldMerge)
  }, [])

  const toggleSettings = (event) => {
    event.stopPropagation()
    if (!isSeparated) {
      // Opening settings from the unified bar also starts the normal split.
      // Both state changes land in one render so the split layout and settings
      // surface share the same morph instead of appearing as two actions.
      settingsOrigin.current = 'unified'
      peakY.current = window.scrollY
      setIsSeparated(true)
      setIsSettingsOpen(true)
      return
    }

    if (isSettingsOpen) {
      closeSettings()
      return
    }

    setIsSettingsClosing(false)
    settingsOrigin.current = 'separated'
    setIsSettingsOpen(true)
  }

  const handleNavTransitionEnd = (event) => {
    if (
      !isSettingsClosing ||
      event.target !== event.currentTarget ||
      event.propertyName !== 'height'
    ) return

    setIsSeparated(false)
  }

  const handleWrapperTransitionEnd = (event) => {
    if (
      !isSettingsClosing ||
      isSettingsOpen ||
      event.target !== event.currentTarget ||
      !event.currentTarget.classList.contains('unified') ||
      event.propertyName !== 'padding-top'
    ) return

    setIsSettingsClosing(false)
  }

  useEffect(() => () => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current)
  }, [])

  useEffect(() => {
    if (!isSettingsOpen) return undefined

    const handleOutsidePointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) closeSettings()
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [closeSettings, isSettingsOpen])

  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const y = window.scrollY
      const direction = y - lastScrollY

      if (!isSeparated) {
        peakY.current = 0
        // Split: scrolling down past raised threshold
        if (direction > 0 && y > 120) {
          setIsSeparated(true)
          peakY.current = y
        }
      } else {
        peakY.current = Math.max(peakY.current, y)
        // Merge: scrolled up 100px from the peak since splitting
        if (peakY.current - y > 100) {
          setIsSettingsClosing(false)
          setIsSeparated(false)
          setIsSettingsOpen(false)
          settingsOrigin.current = null
        }
      }

      lastScrollY = y
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isSeparated])

  return (
    <div
      className={`header-wrapper ${isSeparated ? 'separated' : 'unified'} ${isSeparated && isSettingsOpen ? 'settings-open' : ''} ${isSettingsClosing ? 'settings-closing' : ''}`}
      style={headerMotionStyle}
      ref={headerRef}
      onPointerMove={setPointerPosition}
      onPointerEnter={showPointerHighlight}
      onPointerLeave={hidePointerHighlight}
      onTransitionEnd={handleWrapperTransitionEnd}
    >
      <div className="header-pointer-highlight" aria-hidden="true" />

      {/* Logo — morphs from WUYU pill to W circle, links to About */}
      <Link
        to="/about"
        className={`header-logo ${isSeparated ? 'logo-circle' : 'logo-text'}`}
      >
        <span className="logo-w">W</span>
        <span className="logo-uyu">UYU</span>
      </Link>

      {/* Divider — visible only in unified state */}
      <div className="header-divider" />

      {/* Navigation */}
      <nav
        className={`header-nav ${isSettingsOpen ? 'settings-open' : ''}`}
        ref={navRef}
        aria-label="主导航"
        onPointerMove={setPointerPosition}
        onPointerEnter={showPointerHighlight}
        onPointerLeave={hidePointerHighlight}
        onTransitionEnd={handleNavTransitionEnd}
      >
        {/* Liquid glass effects — fade via container, never display:none */}
        <div className="nav-liquid" aria-hidden="true">
          <div className="nav-liquid-highlight" />
          <div className="nav-liquid-chromatic" />
          <div className="nav-liquid-specular" />
        </div>

        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`header-nav-link ${isActivePath(item.path) ? 'active' : ''}`}
            aria-current={isActivePath(item.path) ? 'page' : undefined}
          >
            <span className="header-nav-icon">{item.icon}</span>
            <span className="header-nav-label">{item.label}</span>
            {isActivePath(item.path) && <span className="header-nav-active-indicator" aria-hidden="true" />}
          </Link>
        ))}

        {/* Settings button — non-navigating for now */}
        <button
          className={`header-nav-link settings-btn ${isSettingsOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={isSettingsOpen ? '返回导航' : '设置'}
          aria-expanded={isSeparated ? isSettingsOpen : undefined}
          aria-controls="header-settings-panel"
          onClick={toggleSettings}
        >
          <span className="header-nav-icon">{isSettingsOpen ? '←' : '⚙'}</span>
          <span className="header-nav-label">{isSettingsOpen ? '返回' : '设置'}</span>
        </button>

        <div
          id="header-settings-panel"
          className={`header-settings-panel ${isSettingsOpen ? 'is-open' : ''}`}
          aria-hidden={!isSeparated || !isSettingsOpen}
          inert={!isSeparated || !isSettingsOpen}
        >
          <div className="settings-panel-heading">
            <span>设置</span>
            <span className="settings-panel-heading-actions">
              <Link
                to="/settings"
                state={{ from: location.pathname }}
                className="settings-panel-detail-link"
                onClick={closeSettings}
              >
                详细设置 <span aria-hidden="true">→</span>
              </Link>
              <span className="settings-panel-caption">演示</span>
            </span>
          </div>

          <div className="settings-control settings-control-toggle">
            <div className="settings-control-copy">
              <span>方格</span>
              <small>显示背景网格</small>
            </div>
            <label className="settings-switch">
              <input className="settings-checkbox" type="checkbox" defaultChecked aria-label="方格" />
              <span className="settings-switch-track" aria-hidden="true">
                <span className="settings-switch-thumb" />
              </span>
            </label>
          </div>

          <label className="settings-control settings-select-control">
            <span className="settings-control-copy">
              <span>下拉选单</span>
              <small>选择显示模式</small>
            </span>
            <span className="settings-select-wrap">
              <select className="settings-select" defaultValue="柔和" aria-label="下拉选单">
                <option>柔和</option>
                <option>标准</option>
                <option>高对比</option>
              </select>
            </span>
          </label>

          <label className="settings-control settings-range-control">
            <span className="settings-control-copy">
              <span>音量</span>
              <small>调整播放音量</small>
            </span>
            <span className="settings-range-wrap">
              <input className="settings-range" type="range" min="0" max="100" defaultValue="72" aria-label="音量" />
              <span className="settings-range-value">72</span>
            </span>
          </label>

          <label className="settings-control settings-range-control settings-speed-control">
            <span className="settings-control-copy">
              <span>导航速度</span>
              <small>控制合并动效</small>
            </span>
            <span className="settings-range-wrap">
              <input
                className="settings-range settings-speed-range"
                type="range"
                min="1.0"
                max="8.0"
                step="0.1"
                value={animationSpeed}
                style={{ '--range-progress': `${animationSpeedPercent}%` }}
                aria-label="导航动画速度"
                onChange={event => setAnimationSpeed(Number(event.target.value))}
              />
              <span className="settings-range-value">{animationSpeed.toFixed(1)}×</span>
            </span>
          </label>

          <div className="settings-control settings-control-toggle settings-performance-control">
            <div className="settings-control-copy">
              <span>高耗能组件</span>
              <small>开启探索页动态实验</small>
            </div>
            <label className="settings-switch">
              <input
                className="settings-checkbox"
                type="checkbox"
                checked={performanceEffectsEnabled}
                aria-label="高耗能组件"
                onChange={event => setPerformanceEffectsEnabled(event.target.checked)}
              />
              <span className="settings-switch-track" aria-hidden="true">
                <span className="settings-switch-thumb" />
              </span>
            </label>
          </div>
        </div>
      </nav>
    </div>
  )
}
