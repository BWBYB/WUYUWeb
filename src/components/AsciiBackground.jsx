import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import { createAsciiBackground } from '../lib/ascii-background'

// 全站字符背景。只是引擎的 React 壳：
//   · 主题变化 → 把 resolvedTheme 传下去，引擎重读 --text-h
//   · 路由变化 → 内容区宽度变了（文章页 680 / 归档 800 / 首页 1052），重测让路区
//   · 设置变化 → 增量下发，不重建引擎
//   · 卸载 → destroy，清掉 rAF 与全局监听
export default function AsciiBackground({ settings }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const { resolvedTheme } = useThemeSwitcherTheme()
  const location = useLocation()

  useEffect(() => {
    const engine = createAsciiBackground(canvasRef.current, {
      theme: resolvedTheme,
      mode: settings.brush,
      presence: settings.presence,
      yieldK: settings.yieldK,
      density: settings.density,
      pointer: settings.pointer,
      ripple: settings.ripple,
      motes: settings.motes,
      keyLight: settings.keyLight,
      lightK: settings.lightK,
      flow: settings.flow,
      palette: settings.palette,
      // 页面根容器：首页 .home / 文章 .post-page / 归档 .archive-page ……
      safeEl: () => document.querySelector('.main > *'),
    })
    engineRef.current = engine
    if (import.meta.env.DEV) window.__ASCII_BG = engine

    return () => {
      engine.destroy()
      engineRef.current = null
      if (import.meta.env.DEV) delete window.__ASCII_BG
    }
    // 引擎只在挂载时创建；设置、主题、路由由下面的 effect 增量更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.setOptions({
      mode: settings.brush,
      presence: settings.presence,
      yieldK: settings.yieldK,
      density: settings.density,
      pointer: settings.pointer,
      ripple: settings.ripple,
      motes: settings.motes,
      keyLight: settings.keyLight,
      lightK: settings.lightK,
      flow: settings.flow,
      palette: settings.palette,
    })
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
