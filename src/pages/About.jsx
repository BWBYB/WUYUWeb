import { Link } from 'react-router-dom'
import '../styles/effects.css'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <header className="about-header fade-in fade-in-1">
        <h1 className="about-title">关于我</h1>
      </header>

      <div className="about-grid">
        {/* Profile Card */}
        <div className="about-card about-profile glass-card fade-in fade-in-2">
          <div className="avatar-ring">
            <div className="avatar-inner">Hi</div>
          </div>
          <p className="about-intro">
            一个即将毕业的计算机专业学生，目前在学习 AI Agent 相关的技术。
            喜欢折腾新技术，也喜欢记录生活中的小事。坐标深圳。
          </p>
        </div>

        {/* Currently Card */}
        <div className="about-card glass-card fade-in fade-in-3">
          <h2 className="about-card-title">正在做什么</h2>
          <ul className="about-list">
            <li>学习 AI Agent，正在读相关的书</li>
            <li>用 Dify 搭了一些小工具</li>
            <li>尝试在 M1 Pro 上跑本地大模型</li>
            <li>在深圳找一份有意思的工作</li>
          </ul>
        </div>

        {/* Tech Stack Card */}
        <div className="about-card glass-card fade-in fade-in-4">
          <h2 className="about-card-title">技术栈</h2>
          <div className="tech-tags">
            {['React', 'JavaScript', 'Python', 'Dify', 'Docker', 'Git', 'HTML/CSS', 'Node.js'].map(tech => (
              <span key={tech} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>

        {/* Contact Card */}
        <div className="about-card glass-card fade-in fade-in-5">
          <h2 className="about-card-title">联系我</h2>
          <div className="contact-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="contact-link">
              <span className="contact-icon">GH</span>
              GitHub
            </a>
            <a href="mailto:hello@example.com" className="contact-link">
              <span className="contact-icon">@</span>
              邮箱
            </a>
            <a href="#" className="contact-link">
              <span className="contact-icon">WX</span>
              微信
            </a>
          </div>
        </div>

        {/* About Site Card */}
        <div className="about-card about-wide glass-card fade-in fade-in-5">
          <h2 className="about-card-title">关于这个网站</h2>
          <p className="about-site-desc">
            用 React + Vite 搭建，暗色主题 + Bento Grid 布局。
            用来记录我的学习心得和生活碎片。希望若干年后回头看，这些文字能让我想起现在的自己。
          </p>
          <div className="about-timeline-actions">
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
