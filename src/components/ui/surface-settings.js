// 全局表面设置：阴影与边框。
// 阴影分三层，统一由这里的四个参数推导；边框分普通与玻璃两套强度。

export const DEFAULT_SURFACE_SETTINGS = {
  shadowStrength: 1,
  shadowY: 18,
  shadowBlur: 44,
  shadowSpread: 0,
  borderStrength: 1,
  glassStrength: 1,
}

const numericRanges = {
  shadowStrength: [0, 2],
  shadowY: [0, 40],
  shadowBlur: [0, 80],
  shadowSpread: [-8, 16],
  borderStrength: [0, 2],
  glassStrength: [0, 2],
}

const STORAGE_KEY = 'my-blog-surface-settings'
const NAV_STORAGE_KEY = 'my-blog-nav-settings'

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeSurfaceSettings(candidate = {}) {
  const next = { ...DEFAULT_SURFACE_SETTINGS }

  Object.entries(numericRanges).forEach(([key, range]) => {
    const value = Number(candidate[key])
    if (Number.isFinite(value)) next[key] = clamp(value, range)
  })

  return next
}

export function readSurfaceSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SURFACE_SETTINGS }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) return normalizeSurfaceSettings(JSON.parse(stored))
  } catch {
    return { ...DEFAULT_SURFACE_SETTINGS }
  }

  // 首次迁移：沿用导航面板里已经调过的阴影参数，避免升级后手感突变。
  try {
    const nav = JSON.parse(window.localStorage.getItem(NAV_STORAGE_KEY) || '{}')
    return normalizeSurfaceSettings({
      shadowStrength: nav.shadowStrength,
      shadowY: nav.shadowY,
      shadowBlur: nav.shadowBlur,
      shadowSpread: nav.shadowSpread,
    })
  } catch {
    return { ...DEFAULT_SURFACE_SETTINGS }
  }
}

export function saveSurfaceSettings(settings) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeSurfaceSettings(settings)),
    )
  } catch {
    // in-memory 仍可用
  }
}
