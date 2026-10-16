// 导航栏动效设置：独立于 ThemeSwitcher 的一套参数。
// 只负责「下滑拉伸」相关的阈值、时长、缓动、留白与收缩尺寸。

export const DEFAULT_NAV_SETTINGS = {
  stretchThreshold: 90,        // 触发拉伸的滚动阈值（px）
  stretchDuration: 0.5,        // 拉伸/收缩时长（s）
  animationSpeed: 1,           // 全局动画倍速：1=正常，0.2=极慢（慢放观察），2=极快
  easingStart: 0,              // 起步快慢：负=更柔缓，正=起步更陡（映射 x1）
  easingEnd: 0,                // 收尾快慢：负=收尾更干脆，正=收尾更慢停（映射 x2）
  stretchInset: 32,            // 拉伸后两端留白（px）
  expandedOptionWidth: 76,     // 展开态按钮宽度（px）
  collapsedOptionWidth: 44,    // 收缩态按钮宽度（px）
  collapsedCapsuleWidth: 44,   // 收缩态胶囊直径（px，正圆）
}

const numericRanges = {
  stretchThreshold: [40, 300],
  stretchDuration: [0.2, 1.2],
  animationSpeed: [0.1, 3],
  easingStart: [-0.6, 0.6],
  easingEnd: [-0.6, 0.6],
  stretchInset: [8, 64],
  expandedOptionWidth: [56, 96],
  collapsedOptionWidth: [36, 56],
  collapsedCapsuleWidth: [36, 56],
}

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeNavSettings(candidate = {}) {
  const next = { ...DEFAULT_NAV_SETTINGS }

  Object.entries(numericRanges).forEach(([key, range]) => {
    const value = Number(candidate[key])
    if (Number.isFinite(value)) next[key] = clamp(value, range)
  })

  return next
}

export function readNavSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_NAV_SETTINGS }

  try {
    const stored = JSON.parse(window.localStorage.getItem('my-blog-nav-settings') || '{}')
    return normalizeNavSettings(stored)
  } catch {
    return { ...DEFAULT_NAV_SETTINGS }
  }
}

export function saveNavSettings(settings) {
  try {
    window.localStorage.setItem(
      'my-blog-nav-settings',
      JSON.stringify(normalizeNavSettings(settings)),
    )
  } catch {
    // in-memory 仍可用
  }
}

// 双正交维度 → cubic-bezier 曲线（纯「时间分布」，y 轴钉在 0/1，不回弹）。
//   - easingStart（起步）→ x1：控制「起步有多陡」。默认基线 x1=0.22（快出）。
//   - easingEnd（收尾）→ x2：控制「收尾有多慢」。默认基线 x2=0.36（慢停）。
// 动画「快慢」不由曲线表达，而是独立参数 animationSpeed 做全局时间缩放。
export function easingFromControls(start, end) {
  const s = clamp(start, [-0.6, 0.6])
  const e = clamp(end, [-0.6, 0.6])

  // x1 基线 0.22，start 每 +1 让它更靠左（更陡），-1 更靠右（更柔）
  const x1 = 0.22 - 0.3 * s
  // x2 基线 0.36，end 每 +1 让它更靠右（更慢停），-1 更靠左（更干脆）
  const x2 = 0.36 + 0.5 * e

  return `cubic-bezier(${x1.toFixed(3)}, 1, ${x2.toFixed(3)}, 1)`
}

// 全局动画倍速 → 实际过渡时长。
// animationSpeed=1 时用 stretchDuration 原值；0.2 时时长 ×5（慢放），3 时 ÷3（快进）。
export function scaledDuration(duration, speed) {
  const s = clamp(speed, [0.1, 3])
  return `${(Number(duration) / s).toFixed(3)}s`
}
