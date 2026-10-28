// 背景层设置：字符水体 + 锦鲤 / 极光 / 无。
// 存储键沿用 my-blog-* 约定，读取时一律走 normalize，避免旧版本字段缺省。

export const BACKGROUND_MODES = ['ascii', 'aurora', 'none']
export const BACKGROUND_BRUSHES = ['gradient', 'block']
export const WAVE_MODES = ['drift', 'swell', 'cross', 'rings', 'still']
export const WAVE_LABELS = {
  drift: '漂移流',
  swell: '单向浪',
  cross: '交叉浪',
  rings: '同心涟漪',
  still: '静水',
}

// 所有可调项的唯一量程来源：面板和 normalize 共用，避免两边漂移。
export const BACKGROUND_RANGES = {
  waveSpeed: [0.2, 2],
  amplitude: [0.5, 1.8],
  wavelength: [0.5, 2],
  direction: [0, 360],
  turbulence: [0.4, 1.6],
  waterDensity: [0, 0.8],
  waterLimit: [1, 10],
  presence: [0.4, 1.6],
  rippleSize: [0.5, 2],
  rippleSpread: [0.5, 2],
  rippleDecay: [0.5, 2],
  dimStrength: [0, 1],
  fish: {
    count: [1, 8],
    lengthMin: [10, 32],
    lengthMax: [10, 32],
    lengthVariation: [0, 1],
    swimSpeed: [20, 120],
    curiosityRadius: [80, 520],
    startleSpeed: [500, 2400],
    startleReach: [0.4, 1.8],
    emergeDuration: [0.4, 3],
    tileAlpha: [0.4, 1],
    shadowAlpha: [0, 0.4],
  },
  advanced: {
    fbmOctaves: [3, 6],
    noiseScale: [0.5, 2],
    gamma: [0.6, 2.2],
    cellK: [0.7, 1.5],
    pixelBudget: [8, 24],
  },
}

const INTEGER_KEYS = new Set(['waterLimit'])
const FISH_INTEGER_KEYS = new Set(['count', 'lengthMin', 'lengthMax'])
const ADVANCED_INTEGER_KEYS = new Set(['fbmOctaves'])

export const DEFAULT_BACKGROUND_SETTINGS = {
  mode: 'ascii', // 字符水体 / 极光 / 无 —— 同一时刻只渲染一层
  brush: 'gradient', // 梯度（十级明暗）/ 积木（块面）
  waveMode: 'cross', // 五种波动方式
  waveSpeed: 1,
  amplitude: 1,
  wavelength: 1.25,
  direction: 0,
  turbulence: 1,
  waterDensity: 0.36,
  waterLimit: 7,
  presence: 1,
  ripple: true,
  rippleSize: 1,
  rippleSpread: 1,
  rippleDecay: 1,
  dimStrength: 0.85, // 文字区域逐格压暗
  readingDim: false, // 阅读页（非首页）额外减淡
  fish: {
    count: 3,
    lengthMin: 12,
    lengthMax: 26,
    lengthVariation: 1,
    swimSpeed: 58,
    curiosityRadius: 300,
    startleSpeed: 1100,
    startleReach: 0.9,
    emergeDuration: 1.4,
    tileAlpha: 0.75,
    shadowAlpha: 0.14,
  },
  advanced: {
    fbmOctaves: 4,
    noiseScale: 1,
    gamma: 1,
    cellK: 1,
    pixelBudget: 16,
  },
}

const OLD_BRUSHES = ['density', 'halftone', 'line', 'dot']

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value))
}

function readNumber(value, range, integer) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const clamped = clamp(number, range)
  return integer ? Math.round(clamped) : clamped
}

export function normalizeBackgroundSettings(candidate = {}) {
  const source = candidate && typeof candidate === 'object' ? candidate : {}
  const next = {
    ...DEFAULT_BACKGROUND_SETTINGS,
    fish: { ...DEFAULT_BACKGROUND_SETTINGS.fish },
    advanced: { ...DEFAULT_BACKGROUND_SETTINGS.advanced },
  }

  if (BACKGROUND_MODES.includes(source.mode)) next.mode = source.mode

  if (BACKGROUND_BRUSHES.includes(source.brush)) next.brush = source.brush
  else if (OLD_BRUSHES.includes(source.brush)) next.brush = 'gradient'

  if (WAVE_MODES.includes(source.waveMode)) next.waveMode = source.waveMode

  // 旧版本字段：flow → waveSpeed，yieldK → dimStrength。旧 density 是字符覆盖率，
  // 和水体的 waterDensity 不是同一个量，不迁移，交给新的默认值。
  const waveSpeed = source.waveSpeed ?? source.flow
  const dimStrength = source.dimStrength ?? source.yieldK

  Object.keys(BACKGROUND_RANGES).forEach(key => {
    if (key === 'fish' || key === 'advanced') return
    const range = BACKGROUND_RANGES[key]
    const value = key === 'waveSpeed'
      ? readNumber(waveSpeed, range, INTEGER_KEYS.has(key))
      : key === 'dimStrength'
        ? readNumber(dimStrength, range, INTEGER_KEYS.has(key))
        : readNumber(source[key], range, INTEGER_KEYS.has(key))
    if (value !== null) next[key] = value
  })

  const fishSource = source.fish && typeof source.fish === 'object' ? source.fish : {}
  Object.keys(BACKGROUND_RANGES.fish).forEach(key => {
    const value = readNumber(fishSource[key], BACKGROUND_RANGES.fish[key], FISH_INTEGER_KEYS.has(key))
    if (value !== null) next.fish[key] = value
  })
  next.fish.lengthMax = Math.max(next.fish.lengthMin, next.fish.lengthMax)

  const advancedSource = source.advanced && typeof source.advanced === 'object' ? source.advanced : {}
  Object.keys(BACKGROUND_RANGES.advanced).forEach(key => {
    const value = readNumber(
      advancedSource[key],
      BACKGROUND_RANGES.advanced[key],
      ADVANCED_INTEGER_KEYS.has(key),
    )
    if (value !== null) next.advanced[key] = value
  })

  if (typeof source.ripple === 'boolean') next.ripple = source.ripple
  if (typeof source.readingDim === 'boolean') next.readingDim = source.readingDim

  return next
}

export function readBackgroundSettings() {
  if (typeof window === 'undefined') return normalizeBackgroundSettings()

  try {
    const stored = JSON.parse(window.localStorage.getItem('my-blog-background-settings') || '{}')
    return normalizeBackgroundSettings(stored)
  } catch {
    return normalizeBackgroundSettings()
  }
}

// 首屏初值：移动端默认关。
// 用户手动开过之后以存储为准；开启后引擎自动套轻量档（30fps、鱼数 ≤ 2）。
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
