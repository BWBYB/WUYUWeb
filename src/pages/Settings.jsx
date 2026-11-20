import { Link, useLocation } from 'react-router-dom'
import ThemeSwitcherCustomizer from '../components/ui/ThemeSwitcherCustomizer'
import SurfaceCustomizer from '../components/ui/SurfaceCustomizer'
import EdgeBlurCustomizer from '../components/ui/EdgeBlurCustomizer'
import NavCustomizer from '../components/ui/NavCustomizer'
import AboutStatsCustomizer from '../components/ui/AboutStatsCustomizer'
import ChapterRail from '../components/ChapterRail'
import './Settings.css'

const settingsChapters = [
  { id: 'theme-customizer-title', title: '主题切换器', level: 2 },
  { id: 'surface-customizer-title', title: '阴影与边框', level: 2 },
  { id: 'edge-blur-customizer-title', title: '边缘模糊', level: 2 },
  { id: 'nav-customizer-title', title: '导航栏动效', level: 2 },
  { id: 'about-stats-customizer-title', title: '关于页统计条', level: 2 },
]

export default function Settings() {
  const location = useLocation()
  const returnTo = location.state?.from?.startsWith('/') && !location.state.from.startsWith('//')
    ? location.state.from
    : '/'

  return (
    <div className="settings-page">
      <header className="settings-page-header fade-in fade-in-1">
        <h1 className="settings-page-title">详细设置</h1>
      </header>

      <ThemeSwitcherCustomizer />

      <SurfaceCustomizer />

      <EdgeBlurCustomizer />

      <NavCustomizer />

      <AboutStatsCustomizer />

      <Link className="settings-page-back btn btn--secondary fade-in fade-in-5" to={returnTo}>
        <span aria-hidden="true">←</span> 返回
      </Link>

      <ChapterRail chapters={settingsChapters} label="设置目录" />
    </div>
  )
}
