import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import { createAsciiBackground } from '../lib/ascii-background'

function toEngineOptions(settings) {
  return {
    brush: settings.brush,
    waveMode: settings.waveMode,
    waveSpeed: settings.waveSpeed,
    amplitude: settings.amplitude,
    wavelength: settings.wavelength,
    direction: settings.direction,
    turbulence: settings.turbulence,
    waterDensity: settings.waterDensity,
    waterLimit: settings.waterLimit,
    presence: settings.presence,
    ripple: settings.ripple,
    rippleSize: settings.rippleSize,
    rippleSpread: settings.rippleSpread,
    rippleDecay: settings.rippleDecay,
    dimStrength: settings.dimStrength,
    readingDim: settings.readingDim,
    fish: settings.fish,
    advanced: settings.advanced,
  }
}

// 全站字符水体。只是引擎的 React 壳：
//   · 主题变化 → 把 resolvedTheme 传下去，切换鱼/水的整套配色
//   · 路由变化 → 重新量 hero 与文字压暗框（首页有鱼，阅读页只有水）
//   · 设置变化 → 增量下发，不重建引擎
//   · 卸载 → destroy，清掉 rAF 与全局监听
export default function AsciiBackground({ settings }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const { resolvedTheme } = useThemeSwitcherTheme()
  const location = useLocation()

  useEffect(() => {
    const engine = createAsciiBackground(canvasRef.current, {
      ...toEngineOptions(settings),
      theme: resolvedTheme,
    })
    engineRef.current = engine
    document.documentElement.dataset.waterBg = 'on'
    if (import.meta.env.DEV) window.__ASCII_BG = engine

    return () => {
      engine.destroy()
      engineRef.current = null
      delete document.documentElement.dataset.waterBg
      if (import.meta.env.DEV) delete window.__ASCII_BG
    }
    // 引擎只在挂载时创建；设置、主题、路由由下面的 effect 增量更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.setOptions(toEngineOptions(settings))
  }, [settings])

  useEffect(() => {
    engineRef.current?.setOptions({ theme: resolvedTheme })
  }, [resolvedTheme])

  useEffect(() => {
    // 等新页面渲染完再测，否则拿到上一页的矩形
    const id = requestAnimationFrame(() => engineRef.current?.measure())
    return () => cancelAnimationFrame(id)
  }, [location.pathname])

  return <canvas ref={canvasRef} className="ascii-bg" aria-hidden="true" />
}
