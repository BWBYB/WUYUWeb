import { useState, useEffect, useRef } from 'react'

/* ── 打字机效果 ─── */
export function Typewriter() {
  const texts = ['Hello, World!', '前端探索之旅', 'CSS is awesome', 'Keep building...']
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
          setTimeout(() => setIsDeleting(true), 1500)
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1)
        } else {
          setIsDeleting(false)
          setTextIndex((textIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? 40 : 80)
    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex])

  return (
    <div className="playground-area">
      <div className="typewriter-text">
        <span>{texts[textIndex].slice(0, charIndex)}</span>
        <span className="typewriter-cursor">|</span>
      </div>
      <p className="playground-hint">自动打字 + 删除循环</p>
    </div>
  )
}

/* ── 波浪文字 ─── */
export function WaveText() {
  const text = 'Wave Effect'
  return (
    <div className="playground-area">
      <div className="wave-text">
        {text.split('').map((char, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.08}s` }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
      <p className="playground-hint">每个字母按正弦波上下浮动</p>
    </div>
  )
}

/* ── 故障艺术 Glitch ─── */
export function GlitchText() {
  return (
    <div className="playground-area">
      <div className="glitch-text" data-text="GLITCH">
        GLITCH
      </div>
      <p className="playground-hint">RGB 分离 + 随机偏移</p>
    </div>
  )
}

/* ─── 逐行揭示 ─── */
export function LineReveal() {
  const [visibleLines, setVisibleLines] = useState(0)
  const lines = [
    '> 初始化系统...',
    '> 加载前端模块...',
    '> 渲染界面完成 ✓',
    '> 准备交互体验...',
  ]

  useEffect(() => {
    if (visibleLines < lines.length) {
      const timer = setTimeout(() => setVisibleLines(visibleLines + 1), 600)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setVisibleLines(0), 2000)
      return () => clearTimeout(timer)
    }
  }, [visibleLines])

  return (
    <div className="playground-area">
      <div className="line-reveal">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`line-reveal-item ${i < visibleLines ? 'visible' : ''}`}
          >
            {line}
          </div>
        ))}
      </div>
      <p className="playground-hint">像终端一样逐行出现</p>
    </div>
  )
}

/* ─── 文字遮罩揭示 ─── */
export function TextMask() {
  const [pos, setPos] = useState(50)

  return (
    <div className="playground-area">
      <div
        className="text-mask"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setPos(((e.clientX - rect.left) / rect.width) * 100)
        }}
      >
        <span className="text-mask-base">REVEAL</span>
        <span className="text-mask-reveal" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          REVEAL
        </span>
      </div>
      <p className="playground-hint">鼠标扫过揭示高亮文字</p>
    </div>
  )
}
