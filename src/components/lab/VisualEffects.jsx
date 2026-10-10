import { useState, useEffect, useRef } from 'react'

/* ─── 3D 卡片翻转 ─── */
export function FlipCard() {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="playground-area">
      <div
        className="flip-card"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flip-card-front">
          <span>正面</span>
        </div>
        <div className="flip-card-back">
          <span>背面内容</span>
        </div>
      </div>
      <p className="playground-hint">点击卡片翻转</p>
    </div>
  )
}

/* ─── 星空闪烁 ─── */
export function StarField() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }))

    let frame = 0
    let isVisible = true
    const animate = () => {
      if (!isVisible) {
        animRef.current = null
        return
      }

      ctx.clearRect(0, 0, rect.width, rect.height)
      stars.forEach(s => {
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(frame * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fill()
      })
      frame++
      animRef.current = requestAnimationFrame(animate)
    }
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
      visibilityObserver.disconnect()
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <div className="playground-area playground-canvas">
      <canvas ref={canvasRef} className="star-canvas" />
      <p className="playground-hint">Canvas 随机星星闪烁</p>
    </div>
  )
}

/* ─── 网格线背景 ─── */
export function GridBg() {
  return (
    <div className="playground-area">
      <div className="grid-bg-preview">
        <div className="grid-bg-lines"></div>
        <div className="grid-bg-glow"></div>
      </div>
      <p className="playground-hint">透视网格线向远处延伸</p>
    </div>
  )
}

/* ─── 噪点纹理 ─── */
export function NoiseTexture() {
  return (
    <div className="playground-area">
      <div className="noise-preview">
        <div className="noise-layer"></div>
        <span className="noise-label">Noise</span>
      </div>
      <p className="playground-hint">SVG 噪点叠加增加质感</p>
    </div>
  )
}

/* ─── 渐变流动 ─── */
export function GradientFlow() {
  return (
    <div className="playground-area">
      <div className="gradient-flow-preview"></div>
      <p className="playground-hint">背景渐变色缓慢流动变化</p>
    </div>
  )
}

/* ─── 动态柱状图 ── */
export function BarChart() {
  const [data, setData] = useState([40, 70, 55, 90, 65, 80])

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(v => Math.max(10, Math.min(100, v + (Math.random() - 0.5) * 30))))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="playground-area">
      <div className="bar-chart">
        {data.map((v, i) => (
          <div key={i} className="bar-chart-col">
            <div
              className="bar-chart-bar"
              style={{
                height: `${v}%`,
                background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
                transition: 'height 0.8s ease',
              }}
            />
          </div>
        ))}
      </div>
      <p className="playground-hint">数据变化时柱子平滑过渡</p>
    </div>
  )
}

/* ─── 波形音频 ─── */
export function Waveform() {
  const [bars, setBars] = useState(Array(20).fill(10))

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 80 + 10))
    }, 150)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="playground-area">
      <div className="waveform">
        {bars.map((h, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              height: `${h}%`,
              transition: 'height 0.1s ease',
            }}
          />
        ))}
      </div>
      <p className="playground-hint">模拟音频频谱跳动</p>
    </div>
  )
}

/* ─── 瀑布流 ─── */
export function Masonry() {
  const heights = [60, 90, 50, 80, 70, 55, 85, 65]
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e']

  return (
    <div className="playground-area">
      <div className="masonry-preview">
        {heights.map((h, i) => (
          <div
            key={i}
            className="masonry-item"
            style={{ height: `${h}px`, background: `${colors[i]}22`, borderColor: `${colors[i]}44` }}
          />
        ))}
      </div>
      <p className="playground-hint">不同高度卡片自动排列</p>
    </div>
  )
}
