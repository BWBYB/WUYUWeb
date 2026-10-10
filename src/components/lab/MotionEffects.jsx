import { useState, useEffect, useRef } from 'react'

/* ─── 粒子跟随鼠标 ─── */
export function ParticleFollow() {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const mouse = useRef({ x: 0, y: 0 })
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    const handleMove = (e) => {
      const r = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }
      for (let i = 0; i < 3; i++) {
        particles.current.push({
          x: mouse.current.x,
          y: mouse.current.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          size: Math.random() * 3 + 1,
        })
      }
    }

    let isVisible = true
    const animate = () => {
      if (!isVisible) {
        animRef.current = null
        return
      }

      ctx.clearRect(0, 0, rect.width, rect.height)
      particles.current = particles.current.filter(p => p.life > 0)
      particles.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.02
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${p.life})`
        ctx.fill()
      })
      animRef.current = requestAnimationFrame(animate)
    }

    canvas.addEventListener('mousemove', handleMove)
    animate()
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible && animRef.current === null) animate()
      if (!isVisible && animRef.current !== null) {
        cancelAnimationFrame(animRef.current)
        animRef.current = null
      }
    }, { threshold: 0.01 })
    visibilityObserver.observe(canvas)
    return () => {
      canvas.removeEventListener('mousemove', handleMove)
      visibilityObserver.disconnect()
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <div className="playground-area playground-canvas">
      <canvas ref={canvasRef} className="particle-canvas" />
      <p className="playground-hint">移动鼠标产生粒子轨迹</p>
    </div>
  )
}

/* ─── 弹簧物理动画 ─── */
export function SpringAnim() {
  const [pos, setPos] = useState(0)
  const velocity = useRef(0)
  const target = useRef(0)
  const animRef = useRef(null)

  const springTo = (newTarget) => {
    target.current = newTarget
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const animate = () => {
      const force = (target.current - pos) * 0.1
      velocity.current = (velocity.current + force) * 0.8
      const newPos = pos + velocity.current
      setPos(newPos)
      if (Math.abs(target.current - newPos) > 0.1 || Math.abs(velocity.current) > 0.1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animate()
  }

  return (
    <div className="playground-area">
      <div className="spring-track">
        <div
          className="spring-ball"
          style={{ transform: `translateX(${pos}px)` }}
        />
      </div>
      <div className="spring-buttons">
        <button onClick={() => springTo(-60)}>← 左</button>
        <button onClick={() => springTo(0)}>中间</button>
        <button onClick={() => springTo(60)}>右 →</button>
      </div>
      <p className="playground-hint">点击按钮体验弹簧回弹</p>
    </div>
  )
}

/* ─── 路径动画 ─── */
export function PathAnim() {
  return (
    <div className="playground-area">
      <svg className="path-svg" viewBox="0 0 200 120">
        <path
          className="path-line"
          d="M 20 100 C 60 10, 140 10, 180 100"
          fill="none"
        />
        <circle className="path-dot" r="6">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path="M 20 100 C 60 10, 140 10, 180 100"
          />
        </circle>
      </svg>
      <p className="playground-hint">圆点沿贝塞尔曲线运动</p>
    </div>
  )
}

/* ─── 视差滚动 ─── */
export function ParallaxScroll() {
  const containerRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleScroll = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="playground-area playground-scroll">
      <div ref={containerRef} className="parallax-container">
        <div className="parallax-layer parallax-far" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
          <div className="parallax-shape" style={{ background: 'rgba(139,92,246,0.3)' }}></div>
        </div>
        <div className="parallax-layer parallax-mid" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
          <div className="parallax-shape" style={{ background: 'rgba(99,102,241,0.3)' }}></div>
        </div>
        <div className="parallax-layer parallax-near" style={{ transform: `translateY(${scrollY * 0.8}px)` }}>
          <div className="parallax-shape" style={{ background: 'rgba(6,182,212,0.3)' }}></div>
        </div>
      </div>
      <p className="playground-hint">上下滚动查看视差效果</p>
    </div>
  )
}

/* ─── 滚动触发动画 ─── */
export function ScrollReveal() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="playground-area playground-scroll">
      <div ref={ref} className="scroll-reveal-container">
        <div className={`scroll-reveal-item ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0s' }}>
          <div className="scroll-reveal-bar" style={{ background: '#6366f1' }}></div>
          <span>动画 1</span>
        </div>
        <div className={`scroll-reveal-item ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
          <div className="scroll-reveal-bar" style={{ background: '#8b5cf6' }}></div>
          <span>动画 2</span>
        </div>
        <div className={`scroll-reveal-item ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
          <div className="scroll-reveal-bar" style={{ background: '#06b6d4' }}></div>
          <span>动画 3</span>
        </div>
      </div>
      <p className="playground-hint">滚入视口时依次触发</p>
    </div>
  )
}
