import { Link } from 'react-router-dom'
import { resume } from '../lib/content/resume'
import '../styles/effects.css'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <header className="about-header fade-in fade-in-1">
        <h1 className="about-title">关于这个网站</h1>
      </header>

      <div className="about-grid">
        <div className="about-card about-profile glass-card fade-in fade-in-2">
          <div className="avatar-ring">
            <div className="avatar-inner">W</div>
          </div>
          <p className="about-intro">
            WUYUWeb 是我的个人站点。这里放文章、项目记录、更新时间线，
            以及一些关于文字、声音和交互的实验。
          </p>
        </div>

        <div className="about-card glass-card fade-in fade-in-3">
          <h2 className="about-card-title">这里有什么</h2>
          <ul className="about-list">
            <li>文章：学习笔记与技术复盘</li>
            <li>时间线：站点和生活的更新记录</li>
            <li>探索：前端动效与交互实验</li>
            <li>CD机：用 Web Audio 合成的磁带播放器</li>
          </ul>
        </div>

        <div className="about-card glass-card fade-in fade-in-4">
          <h2 className="about-card-title">技术栈</h2>
          <div className="tech-tags">
            {['React', 'Vite', 'JavaScript', 'CSS', 'Web Audio', 'Three.js'].map(tech => (
              <span key={tech} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>

        <div className="about-card glass-card fade-in fade-in-5">
          <h2 className="about-card-title">联系</h2>
          <div className="contact-links">
            <a href={resume.profile.github} target="_blank" rel="noopener noreferrer" className="contact-link">
              <span className="contact-icon">GH</span>
              GitHub
            </a>
            <a href={`mailto:${resume.profile.email}`} className="contact-link">
              <span className="contact-icon">@</span>
              邮箱
            </a>
          </div>
        </div>

        <div className="about-card about-wide glass-card fade-in fade-in-5">
          <h2 className="about-card-title">为什么做这个站</h2>
          <p className="about-site-desc">
            这个网站不追热点，也不做信息流。它更像一个长期维护的笔记本：
            内容优先，设计有规则，改动可回退。希望若干年后回头看，
            这些文字还能让我想起现在的自己。
          </p>
          <div className="about-timeline-actions">
            <Link className="about-timeline-link" to="/resume">
              查看我的经历 <span aria-hidden="true">→</span>
            </Link>
            <Link className="about-timeline-link" to="/timeline">
              查看更新记录 <span aria-hidden="true">→</span>
            </Link>
            {import.meta.env.DEV && (
              <Link className="about-timeline-link" to="/updates-editor">
                本地编辑 <span aria-hidden="true">✎</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
