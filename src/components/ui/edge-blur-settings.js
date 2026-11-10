// 视口边缘模糊：上下各一条固定模糊带，只糊背景与正文。
// 参数由 Provider 写到根元素 CSS 变量，页面不直接读这里。

export const DEFAULT_EDGE_BLUR_SETTINGS = {
  enabled: true,
  blur: 8,          // backdrop-filter 半径（px）
  height: 150,      // 模糊带高度（px）
  fade: 50,         // 实心区占高度的比例（%），之后渐变到透明
}

const numericRanges = {
  blur: [0, 24],
  height: [60, 300],
  fade: [0, 100],
}

const STORAGE_KEY = 'my-blog-edge-blur-settings'

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeEdgeBlurSettings(candidate = {}) {
  const next = { ...DEFAULT_EDGE_BLUR_SETTINGS }

  if (typeof candidate.enabled === 'boolean') next.enabled = candidate.enabled

  Object.entries(numericRanges).forEach(([key, range]) => {
    const value = Number(candidate[key])
    if (Number.isFinite(value)) next[key] = clamp(value, range)
  })

  return next
}

export function readEdgeBlurSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_EDGE_BLUR_SETTINGS }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) return normalizeEdgeBlurSettings(JSON.parse(stored))
  } catch {
    return { ...DEFAULT_EDGE_BLUR_SETTINGS }
  }

  return { ...DEFAULT_EDGE_BLUR_SETTINGS }
}

export function saveEdgeBlurSettings(settings) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeEdgeBlurSettings(settings)),
    )
  } catch {
    // in-memory 仍可用
  }
}
