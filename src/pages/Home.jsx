import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { posts } from '../data/posts'
import '../styles/effects.css'
import './Home.css'

/* ─── Particle Background ─── */
function HeroParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h
    let animationId = null
    let isVisible = true
    const particles = []
    const PARTICLE_COUNT = 50

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * 2
      canvas.height = h * 2
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(2, 2)
    }

    const init = () => {
      resize()
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
        })
      }
    }

    const draw = () => {
      if (!isVisible) {
        animationId = null
        return
      }

      ctx.clearRect(0, 0, w, h)
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x
          const dy = p.y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      animationId = requestAnimationFrame(draw)
    }

    init()
    draw()
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible && animationId === null) draw()
      if (!isVisible && animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    }, { threshold: 0.01 })
    visibilityObserver.observe(canvas)
    window.addEventListener('resize', init)
    return () => {
      cancelAnimationFrame(animationId)
      visibilityObserver.disconnect()
      window.removeEventListener('resize', init)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-particles" />
}

/* ─── Typing Animation ─── */
function TypedText({ texts, speed = 80, pause = 2000 }) {
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < current.length) {
          setCharIndex(charIndex + 1)
        } else {
          setTimeout(() => setIsDeleting(true), pause)
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1)
        } else {
          setIsDeleting(false)
          setTextIndex((textIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? 40 : speed)
    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex])

  return (
    <span>
      {texts[textIndex].slice(0, charIndex)}
      <span className="typed-cursor">|</span>
    </span>
  )
}

export default function Home() {
  const recentPosts = posts.slice(0, 3)

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section fade-in fade-in-1">
        <HeroParticles />
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>

        <div className="hero-inner">
          <div className="hero-avatar-wrap">
            <div className="hero-avatar">
              <span className="hero-avatar-emoji">&#x1f680;</span>
              <div className="hero-avatar-ring"></div>
            </div>
            <div className="hero-status">
              <span className="hero-status-dot"></span>
              在线
            </div>
          </div>

          <h1 className="hero-main-title">
            你好，我是 <span className="gradient-text">开发者</span>
          </h1>

          <p className="hero-typed-line">
            <TypedText texts={['正在探索 AI Agent 的世界', '记录技术与生活的点滴', '用代码创造有趣的东西']} />
          </p>

          <p className="hero-desc">
            一个即将毕业的 CS 学生，热爱前端设计与人工智能。<br />
            在这里分享学习笔记、项目实践和生活感悟。
          </p>

          <div className="hero-actions">
            <Link to="/blog" className="hero-btn hero-btn-primary">
              <span>浏览文章</span>
              <span className="hero-btn-arrow">&rarr;</span>
            </Link>
            <Link to="/lab" className="hero-btn hero-btn-secondary">
              前端实验室
            </Link>
          </div>

          <div className="hero-social">
            <a href="https://github.com" target="_blank" className="hero-social-link" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="#" className="hero-social-link" title="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="hero-social-link" title="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </a>
          </div>

          <div className="hero-scroll-hint">
            <span>向下滚动</span>
            <div className="hero-scroll-arrow"></div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Latest Posts - Large Card */}
        <div className="bento-card bento-large glass-card fade-in fade-in-2">
          <div className="card-header">
            <h2 className="card-title">最新文章</h2>
            <Link to="/blog" className="card-link">全部 &rarr;</Link>
          </div>
          <div className="card-posts">
            {recentPosts.map(post => (
              <Link key={post.id} to={`/post/${post.id}`} className="card-post-item">
                <div className="card-post-meta">
                  <span className="card-post-category">{post.category}</span>
                  <time className="card-post-date">{post.date}</time>
                </div>
                <h3 className="card-post-title">{post.title}</h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Currently - Small Card */}
        <div className="bento-card bento-small glass-card fade-in fade-in-3">
          <div className="card-icon">&#x1f4da;</div>
          <h3 className="card-small-title">正在读</h3>
          <p className="card-small-text">《AI Agent》第四章</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }}></div>
          </div>
          <span className="progress-label">60% 完成</span>
        </div>

        {/* Tech Stack - Small Card */}
        <div className="bento-card bento-small glass-card fade-in fade-in-4">
          <div className="card-icon">&#x1f6e0;</div>
          <h3 className="card-small-title">技术栈</h3>
          <div className="tech-pills">
            {['React', 'Python', 'Dify', 'Docker'].map(tech => (
              <span key={tech} className="tech-pill">{tech}</span>
            ))}
          </div>
        </div>

        {/* Quote - Wide Card */}
        <div className="bento-card bento-wide glass-card fade-in fade-in-5">
          <blockquote className="bento-quote">
            "在不确定中找到自己的节奏，在焦虑和期待之间找到平衡。"
          </blockquote>
          <p className="quote-author">— 写于深圳的秋天</p>
        </div>
      </div>
    </div>
  )
}
