import { useEffect, useState } from 'react'
import { ThemeSwitcherContext } from './theme-switcher-context'
import {
  DEFAULT_THEME_SWITCHER_SETTINGS,
  normalizeThemeSwitcherSettings,
  readThemeSwitcherSettings,
  saveThemeSwitcherSettings,
  THEME_SWITCHER_PRESETS,
} from './theme-switcher-settings'
import {
  DEFAULT_NAV_SETTINGS,
  normalizeNavSettings,
  readNavSettings,
  saveNavSettings,
} from './nav-settings'
import {
  DEFAULT_SURFACE_SETTINGS,
  normalizeSurfaceSettings,
  readSurfaceSettings,
  saveSurfaceSettings,
} from './surface-settings'

const STORAGE_KEY = 'my-blog-theme-switcher-theme'
const themes = new Set(['light', 'dark', 'system'])

function readSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function readTheme() {
  if (typeof window === 'undefined') return 'light'

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY)
    if (storedTheme === 'dim') return 'dark'
    return themes.has(storedTheme) ? storedTheme : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeSwitcherProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme)
  const [systemTheme, setSystemTheme] = useState(readSystemTheme)
  const [settings, setSettingsState] = useState(readThemeSwitcherSettings)
  const [navSettings, setNavSettingsState] = useState(readNavSettings)
  const [surfaceSettings, setSurfaceSettingsState] = useState(readSurfaceSettings)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = event => setSystemTheme(event.matches ? 'light' : 'dark')

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.siteTheme = resolvedTheme

    // 切主题时给文字色一次 0.55s 过渡，只在 700ms 内挂这个属性 ——
    // 常驻 transition 会把按钮 hover 也拖慢，这里用完就摘。
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined

    root.setAttribute('data-theme-anim', '')
    const id = window.setTimeout(() => root.removeAttribute('data-theme-anim'), 700)
    return () => window.clearTimeout(id)
  }, [resolvedTheme])

  const setTheme = (nextTheme) => {
    if (!themes.has(nextTheme)) return

    setThemeState(nextTheme)

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // The in-memory state still works when storage is unavailable.
    }
  }

  const updateSetting = (key, value) => {
    setSettingsState((currentSettings) => {
      const nextSettings = normalizeThemeSwitcherSettings({
        ...currentSettings,
        [key]: value,
      })
      saveThemeSwitcherSettings(nextSettings)
      return nextSettings
    })
  }

  const resetSettings = () => {
    const nextSettings = { ...DEFAULT_THEME_SWITCHER_SETTINGS }
    setSettingsState(nextSettings)
    saveThemeSwitcherSettings(nextSettings)
  }

  const applyPreset = (preset) => {
    const nextSettings = THEME_SWITCHER_PRESETS[preset]?.values
    if (!nextSettings) return
    setSettingsState(nextSettings)
    saveThemeSwitcherSettings(nextSettings)
  }

  const updateNavSetting = (key, value) => {
    setNavSettingsState((current) => {
      const next = normalizeNavSettings({ ...current, [key]: value })
      saveNavSettings(next)
      return next
    })
  }

  const resetNavSettings = () => {
    const next = { ...DEFAULT_NAV_SETTINGS }
    setNavSettingsState(next)
    saveNavSettings(next)
  }

  const updateSurfaceSetting = (key, value) => {
    setSurfaceSettingsState((current) => {
      const next = normalizeSurfaceSettings({ ...current, [key]: value })
      saveSurfaceSettings(next)
      return next
    })
  }

  const resetSurfaceSettings = () => {
    const next = { ...DEFAULT_SURFACE_SETTINGS }
    setSurfaceSettingsState(next)
    saveSurfaceSettings(next)
  }

  // 阴影与边框统一写根元素，页面和组件只读 CSS 变量
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--shadow-strength', String(surfaceSettings.shadowStrength))
    root.style.setProperty('--shadow-y', `${surfaceSettings.shadowY}px`)
    root.style.setProperty('--shadow-blur', `${surfaceSettings.shadowBlur}px`)
    root.style.setProperty('--shadow-spread', `${surfaceSettings.shadowSpread}px`)
    root.style.setProperty('--border-strength', String(surfaceSettings.borderStrength))
    root.style.setProperty('--glass-strength', String(surfaceSettings.glassStrength))
  }, [surfaceSettings])

  return (
    <ThemeSwitcherContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        settings,
        updateSetting,
        resetSettings,
        applyPreset,
        navSettings,
        updateNavSetting,
        resetNavSettings,
        surfaceSettings,
        updateSurfaceSetting,
        resetSurfaceSettings,
      }}
    >
      {children}
    </ThemeSwitcherContext.Provider>
  )
}
