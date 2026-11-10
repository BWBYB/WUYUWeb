import { useCallback, useEffect, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import AuroraBackground from './AuroraBackground'
import AsciiBackground from './AsciiBackground'
import AsciiBackgroundPanel from './AsciiBackgroundPanel'
import EdgeBlur from './EdgeBlur'
import {
  normalizeBackgroundSettings,
  readInitialBackgroundSettings,
  saveBackgroundSettings,
} from './ui/background-settings'
import { useLocation } from 'react-router-dom'
import { ThemeSwitcher } from './ui/apple-liquid-glass-switcher'
import {
  ThemeSwitcherProvider,
} from './ui/ThemeSwitcherProvider'
import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import './ui/theme-switcher.css'
import './Layout.css'

function GlobalThemeSwitcher({ paper }) {
  const location = useLocation()
  const { theme, resolvedTheme, setTheme, settings } = useThemeSwitcherTheme()

  if (location.pathname === '/settings') return null

  // 纸色下只暖化墨色与高亮，玻璃保持中性灰
  const switcherSettings = paper
    ? {
        ...settings,
        contentColor: '#1b1a17',
        actionColor: '#a4502a',
      }
    : settings

  return (
    <div
      className="theme-switcher-global theme-provider"
      data-theme={resolvedTheme}
      data-paper={paper ? 'on' : undefined}
    >
      <ThemeSwitcher value={theme} onValueChange={setTheme} settings={switcherSettings} />
    </div>
  )
}

// 背景只有一层：字符 / 极光 / 无，同一时刻只渲染一个，
// 两层动态叠在一起会互相干扰，也会白烧一份 GPU。
function BackgroundLayer({ settings, onChange, onReset }) {
  return (
    <>
      {settings.mode === 'ascii' && <AsciiBackground settings={settings} />}
      {settings.mode === 'aurora' && <AuroraBackground />}
      <AsciiBackgroundPanel settings={settings} onChange={onChange} onReset={onReset} />
    </>
  )
}

// 背景设置提升到这一层：Header 需要知道纸色是否开启，才能换导航高亮色。
function LayoutContent({ children }) {
  const { resolvedTheme } = useThemeSwitcherTheme()
  const [settings, setSettings] = useState(readInitialBackgroundSettings)

  const update = useCallback(patch => {
    setSettings(current => {
      const next = normalizeBackgroundSettings({
        ...current,
        ...patch,
        fish: patch.fish ? { ...current.fish, ...patch.fish } : current.fish,
        advanced: patch.advanced ? { ...current.advanced, ...patch.advanced } : current.advanced,
      })
      saveBackgroundSettings(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const next = normalizeBackgroundSettings()
    saveBackgroundSettings(next)
    setSettings(next)
  }, [])

  // 纸色只在白天生效；切到深色时移除属性，避免残留状态
  const paper = resolvedTheme === 'light' && settings.paper

  useEffect(() => {
    const root = document.documentElement
    if (paper) {
      root.dataset.paper = 'on'
      root.style.setProperty('--paper-mix', `${Math.round(settings.paperStrength * 100)}%`)
    } else {
      delete root.dataset.paper
      root.style.removeProperty('--paper-mix')
    }
    return () => {
      delete root.dataset.paper
      root.style.removeProperty('--paper-mix')
    }
  }, [paper, settings.paperStrength])

  return (
    <div className="layout">
      <BackgroundLayer settings={settings} onChange={update} onReset={reset} />
      <Header paper={paper} />
      <main className="main">
        {children}
      </main>
      <Footer />
      <GlobalThemeSwitcher paper={paper} />
      <EdgeBlur />
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <ThemeSwitcherProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeSwitcherProvider>
  )
}
