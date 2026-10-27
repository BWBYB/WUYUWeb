// 背景层设置：与导航动效、主题切换并列的第三套参数。
// 存储键沿用 my-blog-* 约定，读取时一律走 normalize，避免旧版本字段缺省。

export const BACKGROUND_MODES = ['ascii', 'aurora', 'none']
export const BACKGROUND_BRUSHES = ['density', 'halftone', 'block', 'line', 'dot']
export const BACKGROUND_POINTERS = ['yield', 'light', 'off']
export const BACKGROUND_PALETTES = ['warm', 'site']

export const DEFAULT_BACKGROUND_SETTINGS = {
  mode: 'ascii', // 字符 / 极光 / 无 —— 同一时刻只渲染一层
  brush: 'dot', // 点阵：最轻，最适合常驻
  presence: 1, // 存在感：1 = 原型 bg-sampler 的原始强度
  yieldK: 0.58, // 让路强度：内容区保留 1-0.58
  density: 1, // 浓淡：改变字符分布，与 presence 改透明度不同
  flow: 0.95, // 流速：1 = 原型速度，越大越快
  pointer: 'yield', // 指针：让开 / 点亮 / 静默
  palette: 'warm', // 暖版（纸+墨+铜点）/ 跟站点（读 --text-h）
  // 特效默认全开：主场合是「有呼吸的背景」，全靠设置里逐项关。
  ripple: true, // 点击涟漪
  motes: true, // 浮尘
  keyLight: true, // 游移主光
  lightK: 1, // 光强：主光 / 指针 / 涟漪的共同倍数
}

// 每个滑块的量程都按「可调跨度 ×1.5」放宽过；
// yieldK 是百分比，天然封顶 1，不再放宽。
const numericRanges = {
  presence: [0.05, 1.5],
  yieldK: [0, 1],
  density: [0.2, 2],
  flow: [0.1, 2.2],
  lightK: [0.1, 2.5],
}

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeBackgroundSettings(candidate = {}) {
  const next = { ...DEFAULT_BACKGROUND_SETTINGS }

  Object.entries(numericRanges).forEach(([key, range]) => {
    const value = Number(candidate[key])
    if (Number.isFinite(value)) next[key] = clamp(value, range)
  })

  if (BACKGROUND_MODES.includes(candidate.mode)) next.mode = candidate.mode
  if (BACKGROUND_BRUSHES.includes(candidate.brush)) next.brush = candidate.brush
  if (BACKGROUND_POINTERS.includes(candidate.pointer)) next.pointer = candidate.pointer
  if (BACKGROUND_PALETTES.includes(candidate.palette)) next.palette = candidate.palette

  ;['ripple', 'motes', 'keyLight'].forEach(key => {
    if (typeof candidate[key] === 'boolean') next[key] = candidate[key]
  })

  return next
}

export function readBackgroundSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_BACKGROUND_SETTINGS }

  try {
    const stored = JSON.parse(window.localStorage.getItem('my-blog-background-settings') || '{}')
    return normalizeBackgroundSettings(stored)
  } catch {
    return { ...DEFAULT_BACKGROUND_SETTINGS }
  }
}

// 首屏初值：移动端默认关。
// 13500 格 @24fps 在手机上耗电明显，且窄屏内容本就占满，背景只剩两侧几像素。
// 用户手动开过之后以存储为准，不再套用这条默认值。
export function readInitialBackgroundSettings() {
  const base = readBackgroundSettings()

  if (typeof window === 'undefined') return base

  try {
    if (window.localStorage.getItem('my-blog-background-settings')) return base
  } catch {
    return base
  }

  if (window.matchMedia && window.matchMedia('(max-width: 720px)').matches) {
    return { ...base, mode: 'none' }
  }

  return base
}

export function saveBackgroundSettings(settings) {
  try {
    window.localStorage.setItem(
      'my-blog-background-settings',
      JSON.stringify(normalizeBackgroundSettings(settings)),
    )
  } catch {
    // in-memory 仍可用
  }
}
