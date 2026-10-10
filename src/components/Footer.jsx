import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-text">
          &copy; 2026 我的小站
        </p>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-sep">/</span>
          <a href="mailto:hello@example.com">邮箱</a>
        </div>
      </div>
    </footer>
  )
}
