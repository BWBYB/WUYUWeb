import Header from './Header'
import Footer from './Footer'
import AuroraBackground from './AuroraBackground'
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

export default function Layout({ children }) {
  return (
    <ThemeSwitcherProvider>
      <div className="layout">
        <AuroraBackground />
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
