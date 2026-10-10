import { useState, useRef, useEffect } from 'react'

/* ─── 涟漪点击 ─── */
export function RippleClick() {
  const [ripples, setRipples] = useState([])

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
  }

  return (
    <div className="playground-area">
      <div className="ripple-area" onClick={handleClick}>
        {ripples.map(r => (
          <span key={r.id} className="ripple-circle" style={{ left: r.x, top: r.y }} />
        ))}
        <span className="ripple-hint-text">点击任意位置</span>
      </div>
      <p className="playground-hint">Material Design 风格水波纹</p>
    </div>
  )
}

/* ─── 进度环 ─── */
export function ProgressRing() {
  const [progress, setProgress] = useState(0)
  const radius = 40
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => setProgress(progress + 1), 30)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setProgress(0), 1000)
      return () => clearTimeout(timer)
    }
  }, [progress])

  return (
    <div className="playground-area">
      <svg className="progress-ring" width="100" height="100">
        <circle className="progress-ring-bg" cx="50" cy="50" r={radius} />
        <circle
          className="progress-ring-fill"
          cx="50" cy="50" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="progress-ring-text">
          {progress}%
        </text>
      </svg>
      <p className="playground-hint">SVG 圆环进度动画</p>
    </div>
  )
}

/* ─── 拖拽排序 ─── */
export function DragSort() {
  const [items, setItems] = useState(['拖拽我', '交换位置', '重新排序', '自由排列'])
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const handleDragStart = (i) => { dragItem.current = i }
  const handleDragEnter = (i) => { dragOver.current = i }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const newItems = [...items]
    const from = dragItem.current
    const to = dragOver.current
    const [removed] = newItems.splice(from, 1)
    newItems.splice(to, 0, removed)
    setItems(newItems)
    dragItem.current = null
    dragOver.current = null
  }

  return (
    <div className="playground-area">
      <div className="drag-sort-list">
        {items.map((item, i) => (
          <div
            key={i}
            className="drag-sort-item"
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="drag-handle">⠿</span>
            {item}
          </div>
        ))}
      </div>
      <p className="playground-hint">拖拽卡片交换顺序</p>
    </div>
  )
}

/* ── 标签切换 ─── */
export function TabSwitch() {
  const [active, setActive] = useState(0)
  const tabs = ['设计', '开发', '部署']
  const contents = [
    '用 Figma 画出界面原型，确定配色和布局方案。',
    '用 React + CSS 实现交互效果，调试细节。',
    '部署到线上，配置域名和 CDN 加速。',
  ]

  return (
    <div className="playground-area">
      <div className="tab-switch">
        <div className="tab-switch-header">
          <div className="tab-switch-indicator" style={{ transform: `translateX(${active * 100}%)` }} />
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`tab-switch-btn ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="tab-switch-content">
          <p>{contents[active]}</p>
        </div>
      </div>
      <p className="playground-hint">滑动指示器的 Tab 切换</p>
    </div>
  )
}

/* ─── 手风琴折叠 ─── */
export function Accordion() {
  const [open, setOpen] = useState(0)
  const items = [
    { title: '什么是 CSS Grid？', content: 'CSS Grid 是二维布局系统，可以同时控制行和列。' },
    { title: 'Flexbox 和 Grid 区别？', content: 'Flexbox 是一维布局，Grid 是二维布局。' },
    { title: '何时用 backdrop-filter？', content: '需要毛玻璃效果时使用，注意浏览器兼容性。' },
  ]

  return (
    <div className="playground-area">
      <div className="accordion">
        {items.map((item, i) => (
          <div key={i} className={`accordion-item ${i === open ? 'open' : ''}`}>
            <button className="accordion-header" onClick={() => setOpen(i === open ? -1 : i)}>
              {item.title}
              <span className="accordion-icon">{i === open ? '−' : '+'}</span>
            </button>
            <div className="accordion-body">
              <p>{item.content}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="playground-hint">点击展开/收起内容</p>
    </div>
  )
}

/* ─── 模态框 ─── */
export function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="playground-area">
      <button className="modal-trigger-btn" onClick={() => setIsOpen(true)}>
        打开模态框
      </button>
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">模态框标题</h3>
            <p className="modal-desc">这是一个带遮罩和动画的弹出层。点击遮罩或按钮关闭。</p>
            <button className="modal-close-btn" onClick={() => setIsOpen(false)}>关闭</button>
          </div>
        </div>
      )}
      <p className="playground-hint">带遮罩和动画的弹出层</p>
    </div>
  )
}
