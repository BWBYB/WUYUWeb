import { useState, useRef, useEffect } from 'react'

const navItems = [
  { id: 'home', label: '首页', icon: '⌂' },
  { id: 'explore', label: '探索', icon: '◎' },
  { id: 'create', label: '创作', icon: '✦' },
  { id: 'profile', label: '我的', icon: '◉' },
]

export function LiquidGlassNav() {
  const [active, setActive] = useState('home')
  const [hovered, setHovered] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const navRef = useRef(null)
  const [navRect, setNavRect] = useState(null)

  useEffect(() => {
    const updateRect = () => {
      if (navRef.current) {
        setNavRect(navRef.current.getBoundingClientRect())
      }
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [])

  const handleMouseMove = (e) => {
    if (!navRef.current) return
    const rect = navRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <div className="liquid-glass-demo">
      <div
        className="liquid-glass-nav"
        ref={navRef}
        onMouseMove={handleMouseMove}
      >
        {/* Liquid highlight that follows cursor */}
        <div
          className="liquid-highlight"
          style={{
            left: mousePos.x,
            top: mousePos.y,
            opacity: hovered || active ? 1 : 0,
          }}
        />

        {/* Chromatic edge glow */}
        <div className="liquid-chromatic" />

        {/* Specular top edge */}
        <div className="liquid-specular" />

        {/* Nav items */}
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`liquid-nav-item ${active === item.id ? 'active' : ''} ${hovered === item.id ? 'hovered' : ''}`}
            onClick={() => setActive(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Active indicator blob */}
            {active === item.id && <div className="liquid-blob" />}

            <span className="liquid-icon">{item.icon}</span>
            <span className="liquid-label">{item.label}</span>
          </button>
        ))}
      </div>

      <p className="liquid-glass-hint">移动鼠标查看液态高光效果 · 点击切换</p>
    </div>
  )
}

/* Preview for experiment card */
export function LiquidGlassPreview() {
  return (
    <div className="preview-liquid-glass">
      <div className="preview-lg-nav">
        <div className="preview-lg-highlight" />
        <span className="preview-lg-dot active"></span>
        <span className="preview-lg-dot"></span>
        <span className="preview-lg-dot"></span>
        <span className="preview-lg-dot"></span>
      </div>
      <div className="preview-lg-refract" />
    </div>
  )
}
