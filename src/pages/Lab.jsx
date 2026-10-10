import { lazy, Suspense, useState, useRef, useEffect } from 'react'
import '../styles/effects.css'
import './Lab.css'
import { usePerformanceEffects } from '../hooks/usePerformanceEffects'
import { Typewriter, WaveText, GlitchText, LineReveal, TextMask } from '../components/lab/TextEffects'
import { ParticleFollow, SpringAnim, PathAnim, ParallaxScroll, ScrollReveal } from '../components/lab/MotionEffects'
import { RippleClick, ProgressRing, DragSort, TabSwitch, Accordion, ModalDemo } from '../components/lab/InteractionEffects'
import { FlipCard, StarField, GridBg, NoiseTexture, GradientFlow, BarChart, Waveform, Masonry } from '../components/lab/VisualEffects'
import { LiquidGlassNav, LiquidGlassPreview } from '../components/lab/LiquidGlassNav'
import ShinyText from '../components/lab/ShinyText'
import ASCIIText from '../components/lab/ASCIIText'
import { LogoLoop } from '../components/lab/LogoLoop'
import StickerPeel from '../components/lab/StickerPeel'
import Crosshair from '../components/lab/Crosshair'
import { LiquidButton } from '../components/ui/liquid-glass-button'
import { useThemeSwitcherTheme } from '../components/ui/theme-switcher-context'

const ThreeHero = lazy(() => import('../components/ThreeHero'))

/* ─── Text Scramble Hook ─── */
function useScramble(text, trigger) {
  const [display, setDisplay] = useState(text)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

  useEffect(() => {
    if (!trigger) {
      setDisplay(text)
      return
    }
    let iteration = 0
    const interval = setInterval(() => {
      setDisplay(
        text.split('').map((char, i) => {
          if (i < iteration) return text[i]
          return chars[Math.floor(Math.random() * chars.length)]
        }).join('')
      )
      if (iteration >= text.length) clearInterval(interval)
      iteration += 1 / 2
    }, 30)
    return () => clearInterval(interval)
  }, [trigger, text])

  return display
}

/* ─── Experiment Card Previews ─── */
function GlassPreview() {
  return (
    <div className="preview-glass">
      <div className="preview-glass-bg"></div>
      <div className="preview-glass-card">Glass</div>
      <div className="preview-glass-card preview-glass-card-2">Effect</div>
    </div>
  )
}

function AuroraPreview() {
  return (
    <div className="preview-aurora">
      <div className="preview-aurora-blob preview-aurora-1"></div>
      <div className="preview-aurora-blob preview-aurora-2"></div>
      <div className="preview-aurora-blob preview-aurora-3"></div>
    </div>
  )
}

function BentoPreview() {
  return (
    <div className="preview-bento">
      <div className="preview-bento-item preview-bento-large"></div>
      <div className="preview-bento-item preview-bento-small"></div>
      <div className="preview-bento-item preview-bento-small preview-bento-wide"></div>
    </div>
  )
}

function CapsulePreview() {
  return (
    <div className="preview-capsule">
      <div className="preview-capsule-nav">
        <span className="preview-capsule-dot active"></span>
        <span className="preview-capsule-dot"></span>
        <span className="preview-capsule-dot"></span>
      </div>
    </div>
  )
}

function GradientPreview() {
  return (
    <div className="preview-gradient">
      <span>CSS</span>
    </div>
  )
}

function MicroPreview() {
  return (
    <div className="preview-micro">
      <div className="preview-micro-card">Hover me</div>
    </div>
  )
}

function CubePreview() {
  return (
    <div className="preview-cube-wrap">
      <div className="preview-cube">
        <div className="preview-cube-face pf"></div>
        <div className="preview-cube-face pb"></div>
        <div className="preview-cube-face pr"></div>
        <div className="preview-cube-face pl"></div>
        <div className="preview-cube-face pt"></div>
        <div className="preview-cube-face pbo"></div>
      </div>
    </div>
  )
}

/* ─── Interactive Playground Components ─── */

function MagneticButton() {
  const btnRef = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e) => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = (e.clientX - centerX) * 0.3
    const dy = (e.clientY - centerY) * 0.3
    setOffset({ x: dx, y: dy })
  }

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 })
    setIsHovering(false)
  }

  return (
    <div
      className="playground-area"
      onMouseMove={handleMouseMove}
    >
      <button
        ref={btnRef}
        className="magnetic-btn"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      >
        磁力按钮
      </button>
      <p className="playground-hint">移动鼠标靠近按钮</p>
    </div>
  )
}

function TiltCard() {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -20, y: x * 20 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setIsHovering(false)
  }

  return (
    <div className="playground-area">
      <div
        ref={cardRef}
        className="tilt-card"
        style={{
          transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="tilt-card-inner">
          <div className="tilt-card-icon">◈</div>
          <div className="tilt-card-label">视差卡片</div>
        </div>
        <div
          className="tilt-card-shine"
          style={{
            opacity: isHovering ? 0.15 : 0,
            background: `radial-gradient(circle at ${(tilt.y / 20 + 0.5) * 100}% ${(tilt.x / -20 + 0.5) * 100}%, white, transparent 60%)`,
          }}
        />
      </div>
      <p className="playground-hint">在卡片上移动鼠标</p>
    </div>
  )
}

function ScrambleText() {
  const [trigger, setTrigger] = useState(false)
  const originalText = 'Hello, World!'
  const display = useScramble(originalText, trigger)

  return (
    <div className="playground-area">
      <div
        className="scramble-text"
        onMouseEnter={() => setTrigger(true)}
        onMouseLeave={() => setTrigger(false)}
      >
        {display.split('').map((char, i) => (
          <span
            key={i}
            className="scramble-char"
            style={{
              color: char !== originalText[i] ? 'var(--accent-3)' : 'var(--text-h)',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
      <p className="playground-hint">鼠标悬停触发解密效果</p>
    </div>
  )
}

function NeonText() {
  const [colorIndex, setColorIndex] = useState(0)
  const colors = [
    { text: '#ff6fd8', shadow: 'rgba(255,111,216,0.8)' },
    { text: '#6366f1', shadow: 'rgba(99,102,241,0.8)' },
    { text: '#06b6d4', shadow: 'rgba(6,182,212,0.8)' },
    { text: '#10b981', shadow: 'rgba(16,185,129,0.8)' },
  ]
  const current = colors[colorIndex]

  return (
    <div className="playground-area">
      <div
        className="neon-text"
        style={{
          color: current.text,
          textShadow: `0 0 7px ${current.shadow}, 0 0 20px ${current.shadow}, 0 0 40px ${current.shadow}, 0 0 80px ${current.shadow}`,
        }}
        onClick={() => setColorIndex((colorIndex + 1) % colors.length)}
      >
        NEON
      </div>
      <p className="playground-hint">点击切换霓虹灯颜色</p>
    </div>
  )
}

function LiquidBlob() {
  return (
    <div className="playground-area">
      <div className="liquid-blob-wrap">
        <div className="liquid-blob"></div>
      </div>
      <p className="playground-hint">CSS border-radius 动画模拟液态变形</p>
    </div>
  )
}

function NumberFlip() {
  const [number, setNumber] = useState(42)

  useEffect(() => {
    const interval = setInterval(() => {
      setNumber(prev => prev + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const digits = String(number).padStart(4, '0').split('')

  return (
    <div className="playground-area">
      <div className="number-flip">
        {digits.map((digit, i) => (
          <div key={i} className="flip-digit">
            <span className="flip-num">{digit}</span>
          </div>
        ))}
      </div>
      <p className="playground-hint">自动递增的翻页计数器</p>
    </div>
  )
}

function ShinyTextDemo() {
  return (
    <div className="playground-area">
      <div style={{ fontSize: '28px', fontWeight: 700 }}>
        <ShinyText
          text="Shiny Text"
          color="#b5b5b5"
          shineColor="#ffffff"
          speed={2.5}
          shineWidth={50}
          glow={0.6}
        />
      </div>
      <p className="playground-hint">金属光泽扫过文字效果</p>
    </div>
  )
}

function ASCIITextDemo() {
  return (
    <div className="playground-area" style={{ height: '120px' }}>
      <ASCIIText
        text="Hello"
        asciiFontSize={6}
        colors={['#6366f1', '#8b5cf6', '#a78bfa']}
        textScale={0.8}
        waves={0.8}
        scramble={0.5}
      />
      <p className="playground-hint" style={{ position: 'absolute', bottom: '4px', left: '8px' }}>
        WebGL ASCII 文字 · 移动鼠标交互
      </p>
    </div>
  )
}

function LogoLoopDemo() {
  const items = [
    { label: 'React' },
    { label: 'Vue' },
    { label: 'Svelte' },
    { label: 'Angular' },
    { label: 'Next.js' },
    { label: 'Nuxt' },
  ]
  return (
    <div className="playground-area" style={{ height: '80px', overflow: 'hidden' }}>
      <LogoLoop
        logos={items}
        speed={80}
        direction="left"
        logoHeight={24}
        gap={24}
        fadeOut={true}
        renderItem={(item) => (
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-h)',
            background: 'var(--glass-bg)',
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
            whiteSpace: 'nowrap',
          }}>
            {item.label}
          </span>
        )}
      />
      <p className="playground-hint" style={{ position: 'absolute', bottom: '4px', left: '8px' }}>
        无限循环滚动 · 悬停暂停
      </p>
    </div>
  )
}

function StickerPeelDemo() {
  const stickerSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><circle cx="80" cy="80" r="72" fill="url(%23g)"/><text x="80" y="72" text-anchor="middle" fill="white" font-size="28" font-weight="bold" font-family="system-ui">STICKER</text><text x="80" y="100" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14" font-family="system-ui">drag and hover</text></svg>`)}`

  return (
    <div className="playground-area sticker-peel-area" style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
      <StickerPeel
        imageSrc={stickerSvg}
        width={120}
        rotate={-15}
        peelBackHoverPct={35}
        shadowIntensity={0.5}
        lightingIntensity={0.15}
      />
      <p className="playground-hint" style={{ position: 'absolute', bottom: '4px', left: '8px' }}>
        可拖拽贴纸 · 悬停看翻角效果
      </p>
    </div>
  )
}

function CrosshairDemo() {
  const areaRef = useRef(null)
  return (
    <div className="playground-area" ref={areaRef} style={{ height: '200px', position: 'relative' }}>
      <Crosshair
        containerRef={areaRef}
        color="#6366f1"
        thickness={1.5}
        opacity={0.9}
        lineStyle="solid"
        smoothing={0.3}
        showCoordinates={true}
        targetEffect="lock"
        clickPulse={true}
      />
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <button style={{ padding: '8px 16px', background: 'var(--accent-1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>按钮 A</button>
        <button style={{ padding: '8px 16px', background: 'var(--accent-2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>按钮 B</button>
        <a href="#" style={{ color: 'var(--accent-3)', textDecoration: 'underline' }}>链接</a>
      </div>
      <p className="playground-hint" style={{ position: 'absolute', bottom: '4px', left: '8px' }}>
        移动鼠标查看十字准星 · 悬停按钮自动锁定
      </p>
    </div>
  )
}

function LiquidGlassButtonDemo() {
  const [isActivated, setIsActivated] = useState(false)

  return (
    <div className="playground-area">
      <LiquidButton onClick={() => setIsActivated(true)}>
        Liquid Glass
      </LiquidButton>
      <p className="playground-hint">
        {isActivated ? '已触发 · 再次点击体验按压反馈' : '悬停查看折射高光 · 点击体验按压反馈'}
      </p>
    </div>
  )
}

function ThemeSwitcherDemo() {
  const { theme, resolvedTheme } = useThemeSwitcherTheme()

  return (
    <div className="playground-area theme-switcher-demo theme-provider" data-theme={resolvedTheme}>
      <div className={`theme-switcher-preview theme-switcher-preview--${resolvedTheme}`}>
        <span className="theme-switcher-preview__dot" aria-hidden="true" />
        <span>{theme === 'system' ? `跟随系统 · ${resolvedTheme === 'light' ? '明亮' : '暗色'}` : resolvedTheme === 'light' ? '明亮模式' : '暗色模式'}</span>
      </div>
      <p className="playground-hint">由页面底部悬浮切换器控制 · 仅影响此演示卡片</p>
    </div>
  )
}

/* ─── Main Component ─── */
export default function Lab() {
  const [rotation, setRotation] = useState({ x: -20, y: 30 })
  const [isDragging, setIsDragging] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isCubeVisible, setIsCubeVisible] = useState(false)
  const [performanceEffectsEnabled] = usePerformanceEffects()
  const lastPos = useRef({ x: 0, y: 0 })
  const sceneRef = useRef(null)

  const handlePointerDown = (e) => {
    setIsDragging(true)
    setAutoRotate(false)
    lastPos.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    setRotation(prev => ({
      x: prev.x - dy * 0.5,
      y: prev.y + dx * 0.5
    }))
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const toggleAutoRotate = () => setAutoRotate(!autoRotate)

  useEffect(() => {
    if (performanceEffectsEnabled && isCubeVisible && autoRotate && !isDragging) {
      const interval = setInterval(() => {
        setRotation(prev => ({ x: prev.x, y: prev.y + 0.5 }))
      }, 16)
      return () => clearInterval(interval)
    }
  }, [autoRotate, isDragging, isCubeVisible, performanceEffectsEnabled])

  useEffect(() => {
    if (!performanceEffectsEnabled || !sceneRef.current) return undefined

    const observer = new IntersectionObserver(([entry]) => {
      setIsCubeVisible(entry.isIntersecting)
    }, { threshold: 0.01 })

    observer.observe(sceneRef.current)
    return () => observer.disconnect()
  }, [performanceEffectsEnabled])

  const experiments = [
    {
      id: 'glassmorphism',
      title: 'Glassmorphism',
      subtitle: '毛玻璃效果',
      description: '半透明背景 + 模糊滤镜 + 微妙边框，营造深度感',
      color: '#6366f1',
      preview: <GlassPreview />,
    },
    {
      id: 'aurora',
      title: 'Aurora Background',
      subtitle: '极光背景',
      description: '多个渐变色块缓慢浮动，模拟北极光效果',
      color: '#8b5cf6',
      preview: <AuroraPreview />,
    },
    {
      id: 'bento',
      title: 'Bento Grid',
      subtitle: '便当盒布局',
      description: '大小不一的圆角卡片，信息分区清晰有节奏',
      color: '#06b6d4',
      preview: <BentoPreview />,
    },
    {
      id: 'capsule-nav',
      title: 'Capsule Navigation',
      subtitle: '胶囊导航栏',
      description: '悬浮圆角药丸导航，毛玻璃 + 居中浮动',
      color: '#10b981',
      preview: <CapsulePreview />,
    },
    {
      id: 'gradient-text',
      title: 'Gradient Text',
      subtitle: '渐变文字',
      description: '用 CSS 渐变给文字上色，吸引视觉焦点',
      color: '#f59e0b',
      preview: <GradientPreview />,
    },
    {
      id: 'micro-interaction',
      title: 'Micro Interaction',
      subtitle: '微交互',
      description: 'hover 上浮、边框变亮、淡入动画，让界面活起来',
      color: '#ec4899',
      preview: <MicroPreview />,
    },
    {
      id: 'cube-3d',
      title: '3D Cube',
      subtitle: '3D 旋转立方体',
      description: 'CSS 3D transforms 构建六面立方体，可拖动交互',
      color: '#14b8a6',
      preview: <CubePreview />,
    },
    {
      id: 'liquid-glass',
      title: 'Liquid Glass Nav',
      subtitle: '液态玻璃导航',
      description: 'Apple 风格液态玻璃效果：动态高光、色散边缘、毛玻璃模糊',
      color: '#7c3aed',
      preview: <LiquidGlassPreview />,
    },
  ]

  const playgrounds = [
    { title: 'Magnetic Button', subtitle: '磁力按钮', component: <MagneticButton /> },
    { title: 'Tilt Card', subtitle: '视差卡片', component: <TiltCard /> },
    { title: 'Text Scramble', subtitle: '文字乱码', component: <ScrambleText /> },
    { title: 'Neon Glow', subtitle: '霓虹灯', component: <NeonText /> },
    { title: 'Parallax', subtitle: '视差滚动', component: <ParallaxScroll /> },
    { title: 'Scroll Reveal', subtitle: '滚动触发', component: <ScrollReveal /> },
    { title: 'Text Mask', subtitle: '文字遮罩', component: <TextMask /> },
    { title: 'Spring', subtitle: '弹簧动画', component: <SpringAnim /> },
    { title: 'Ripple', subtitle: '涟漪点击', component: <RippleClick /> },
    { title: 'Drag Sort', subtitle: '拖拽排序', component: <DragSort /> },
    { title: 'Tab Switch', subtitle: '标签切换', component: <TabSwitch /> },
    { title: 'Accordion', subtitle: '手风琴', component: <Accordion /> },
    { title: 'Modal', subtitle: '模态框', component: <ModalDemo /> },
    { title: 'Flip Card', subtitle: '3D 翻转', component: <FlipCard /> },
    { title: 'Grid BG', subtitle: '网格背景', component: <GridBg /> },
    { title: 'Noise', subtitle: '噪点纹理', component: <NoiseTexture /> },
    { title: 'Masonry', subtitle: '瀑布流', component: <Masonry /> },
    { title: 'Shiny Text', subtitle: '金属光泽文字', component: <ShinyTextDemo /> },
    { title: 'Logo Loop', subtitle: '无限滚动循环', component: <LogoLoopDemo /> },
    { title: 'Sticker Peel', subtitle: '可拖拽贴纸', component: <StickerPeelDemo /> },
    { title: 'Crosshair', subtitle: '十字准星光标', component: <CrosshairDemo /> },
    { title: 'Liquid Button', subtitle: '液态玻璃按钮', component: <LiquidGlassButtonDemo /> },
    { title: 'Theme Switcher', subtitle: '主题切换器', component: <ThemeSwitcherDemo /> },
  ]

  const performancePlaygrounds = [
    { title: 'Liquid Blob', subtitle: '液态变形', component: <LiquidBlob /> },
    { title: 'Number Flip', subtitle: '翻页计数', component: <NumberFlip /> },
    { title: 'Typewriter', subtitle: '打字机', component: <Typewriter /> },
    { title: 'Wave Text', subtitle: '波浪文字', component: <WaveText /> },
    { title: 'Glitch', subtitle: '故障艺术', component: <GlitchText /> },
    { title: 'Line Reveal', subtitle: '逐行揭示', component: <LineReveal /> },
    { title: 'Particles', subtitle: '粒子跟随', component: <ParticleFollow /> },
    { title: 'Path Motion', subtitle: '路径动画', component: <PathAnim /> },
    { title: 'Progress Ring', subtitle: '进度环', component: <ProgressRing /> },
    { title: 'Star Field', subtitle: '星空闪烁', component: <StarField /> },
    { title: 'Gradient Flow', subtitle: '渐变流动', component: <GradientFlow /> },
    { title: 'Bar Chart', subtitle: '动态柱状图', component: <BarChart /> },
    { title: 'Waveform', subtitle: '波形音频', component: <Waveform /> },
    { title: 'Liquid Glass', subtitle: '液态玻璃导航', component: <LiquidGlassNav /> },
    { title: 'ASCII Text', subtitle: 'WebGL ASCII 文字', component: <ASCIITextDemo /> },
  ]

  return (
    <div className="lab-page">
      <header className="lab-header fade-in fade-in-1">
        <div className="lab-badge">Frontend Lab</div>
        <h1 className="lab-title">前端探索</h1>
        <p className="lab-desc">
          记录和实验各种前端样式与交互效果。每一个都可以直接体验。
        </p>
      </header>

      {/* Interactive Playgrounds */}
      <section className="playgrounds-section fade-in fade-in-3">
        <h2 className="section-title">互动组件</h2>
        <p className="section-desc">可以直接体验的交互效果</p>
        <div className="playgrounds-grid">
          {playgrounds.map((pg, i) => (
            <div key={pg.title} className={`playground-card glass-card fade-in fade-in-${Math.min(i + 2, 5)}`}>
              <div className="playground-header">
                <h3 className="playground-title">{pg.title}</h3>
                <span className="playground-subtitle">{pg.subtitle}</span>
              </div>
              {pg.component}
            </div>
          ))}
        </div>
      </section>

      {/* Experiment Cards Grid */}
      <section className="experiments-section fade-in fade-in-4">
        <h2 className="section-title">样式实验</h2>
        <p className="section-desc">已实现的前端样式与效果</p>
        <div className="lab-grid">
          {experiments.map((exp, index) => (
            <div
              key={exp.id}
              className={`lab-card glass-card fade-in fade-in-${Math.min(index + 2, 5)}`}
              style={{ '--card-accent': exp.color }}
            >
              <div className="lab-card-preview" style={{ borderColor: `${exp.color}33` }}>
                {exp.preview}
              </div>
              <div className="lab-card-content">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">{exp.title}</h2>
                  <span className="lab-card-subtitle">{exp.subtitle}</span>
                </div>
                <p className="lab-card-desc">{exp.description}</p>
                <div className="lab-card-footer">
                  <span className="lab-card-status">已实现</span>
                  <span className="lab-card-arrow">&rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance-heavy demos stay at the bottom and can be disabled in Settings. */}
      <section className={`performance-section fade-in fade-in-5 ${performanceEffectsEnabled ? 'is-enabled' : 'is-disabled'}`}>
        <h2 className="section-title">高耗能动态组件</h2>
        <p className="section-desc">
          {performanceEffectsEnabled
            ? 'Canvas、持续帧循环和动态滤镜实验已开启'
            : '当前已关闭，可在设置中开启探索页的动态实验'}
        </p>

        {performanceEffectsEnabled && (
          <>
            <div className="performance-three-section">
              <Suspense fallback={<div className="performance-three-loading">正在加载宇宙实验…</div>}>
                <ThreeHero />
              </Suspense>
            </div>

            <div className="cube-demo-section performance-cube-section">
              <div className="cube-demo-card glass-card">
                <div className="cube-demo-content">
                  <div className="cube-demo-text">
                    <h2 className="cube-demo-title">3D Cube</h2>
                    <p className="cube-demo-subtitle">CSS 3D Transforms · 可拖动</p>
                    <button className="cube-auto-btn" onClick={toggleAutoRotate}>
                      {autoRotate ? '暂停旋转' : '自动旋转'}
                    </button>
                  </div>
                  <div
                    ref={sceneRef}
                    className="cube-scene"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                      cursor: isDragging ? 'grabbing' : 'grab',
                      touchAction: 'none'
                    }}
                  >
                    <div
                      className="cube"
                      style={{
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                      }}
                    >
                      <div className="cube-face cube-front">前</div>
                      <div className="cube-face cube-back">后</div>
                      <div className="cube-face cube-right">右</div>
                      <div className="cube-face cube-left">左</div>
                      <div className="cube-face cube-top">上</div>
                      <div className="cube-face cube-bottom">下</div>
                    </div>
                  </div>
                </div>
                <p className="cube-hint">拖动立方体旋转 · 点击按钮切换自动旋转</p>
              </div>
            </div>

            <div className="playgrounds-grid performance-grid">
              {performancePlaygrounds.map((pg, i) => (
                <div key={pg.title} className={`playground-card glass-card fade-in fade-in-${Math.min(i + 2, 5)}`}>
                  <div className="playground-header">
                    <h3 className="playground-title">{pg.title}</h3>
                    <span className="playground-subtitle">{pg.subtitle}</span>
                  </div>
                  {pg.component}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="lab-footer fade-in fade-in-5">
        <p>持续更新中 · 有新想法随时实验</p>
      </footer>
    </div>
  )
}
