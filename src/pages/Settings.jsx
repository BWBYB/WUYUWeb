import { Link, useLocation } from 'react-router-dom'
import ThemeSwitcherCustomizer from '../components/ui/ThemeSwitcherCustomizer'
import './Settings.css'

export default function Settings() {
  const location = useLocation()
  const returnTo = location.state?.from?.startsWith('/') && !location.state.from.startsWith('//')
    ? location.state.from
    : '/'

  return (
    <div className="settings-page">
      <header className="settings-page-header fade-in fade-in-1">
        <span className="settings-page-kicker">CONTROL CENTER</span>
        <h1 className="settings-page-title">详细设置</h1>
        <p className="settings-page-intro">
          集中管理网站的显示、动效和性能选项。
        </p>
      </header>

      <ThemeSwitcherCustomizer />

      <Link className="settings-page-back fade-in fade-in-5" to={returnTo}>
        <span aria-hidden="true">←</span> 返回
      </Link>
    </div>
  )
}
