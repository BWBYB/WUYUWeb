import AboutTimeline from '../components/AboutTimeline'
import Changelog from '../components/Changelog'
import '../styles/effects.css'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <header className="about-intro fade-in fade-in-1">
        <div className="about-intro-inner">
          <h1 className="about-intro-title">欢迎来到 WUYU 的个人网站。</h1>
          <p className="about-intro-subtitle">这里收录着网站的时间线与更新日志。</p>
          <p className="about-intro-lead">
            这个网站主要用于存放我的一些思考、文章与前端的探索。下滑可以查看网站的更新历史与里程碑。
          </p>
        </div>
      </header>

      <AboutTimeline />

      <Changelog
        limit={10}
        headingId="about-changelog"
        allLogsHref="/about/updates"
        showEditorLink
      />
    </div>
  )
}
