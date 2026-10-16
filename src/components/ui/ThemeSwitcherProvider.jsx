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
    document.documentElement.dataset.siteTheme = resolvedTheme
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
      }}
    >
      {children}
    </ThemeSwitcherContext.Provider>
  )
}
