import { useCallback, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import AuroraBackground from './AuroraBackground'
import AsciiBackground from './AsciiBackground'
import AsciiBackgroundPanel from './AsciiBackgroundPanel'
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

function GlobalThemeSwitcher() {
  const location = useLocation()
  const { theme, resolvedTheme, setTheme, settings } = useThemeSwitcherTheme()

  if (location.pathname === '/settings') return null

  return (
    <div className="theme-switcher-global theme-provider" data-theme={resolvedTheme}>
      <ThemeSwitcher value={theme} onValueChange={setTheme} settings={settings} />
    </div>
  )
}

// 背景只有一层：字符 / 极光 / 无，同一时刻只渲染一个，
// 两层动态叠在一起会互相干扰，也会白烧一份 GPU。
function BackgroundLayer() {
  const [settings, setSettings] = useState(readInitialBackgroundSettings)

  const update = useCallback(patch => {
    setSettings(current => {
      const next = normalizeBackgroundSettings({ ...current, ...patch })
      saveBackgroundSettings(next)
      return next
    })
  }, [])

  return (
    <>
      {settings.mode === 'ascii' && <AsciiBackground settings={settings} />}
      {settings.mode === 'aurora' && <AuroraBackground />}
      <AsciiBackgroundPanel settings={settings} onChange={update} />
    </>
  )
}

export default function Layout({ children }) {
  return (
    <ThemeSwitcherProvider>
      <div className="layout">
        <BackgroundLayer />
        <Header />
        <main className="main">
          {children}
        </main>
        <Footer />
        <GlobalThemeSwitcher />
      </div>
    </ThemeSwitcherProvider>
  )
}
