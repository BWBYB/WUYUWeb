import { resume } from '../lib/content/resume'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-text">
          &copy; 2026 我的小站
        </p>
        <div className="footer-links">
          <a href={resume.profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-sep">/</span>
          <a href={`mailto:${resume.profile.email}`}>邮箱</a>
        </div>
      </div>
    </footer>
  )
}
