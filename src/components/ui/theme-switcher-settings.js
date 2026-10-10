export const DEFAULT_THEME_SWITCHER_SETTINGS = {
  duration: 0.72,
  longDuration: 0.86,
  preStretch: 1.08,
  stretch: 1.22,
  accelDistance: 0.24,
  cruiseDistance: 0.76,
  settleDistance: 0.95,
  glassOpacity: 12,
  activeOpacity: 36,
  blur: 8,
  saturation: 150,
  glassColor: '#bbbbbc',
  lightColor: '#ffffff',
  darkColor: '#000000',
  contentColor: '#222244',
  actionColor: '#0052f5',
  height: 70,
  optionWidth: 68,
  gap: 8,
  capsuleWidth: 84,
}

export const THEME_SWITCHER_PRESETS = {
  balanced: {
    label: '平衡',
    values: DEFAULT_THEME_SWITCHER_SETTINGS,
  },
  soft: {
    label: '柔和',
    values: {
      ...DEFAULT_THEME_SWITCHER_SETTINGS,
      duration: 0.94,
      longDuration: 1.12,
      preStretch: 1.05,
      stretch: 1.14,
      glassOpacity: 10,
      activeOpacity: 30,
      blur: 10,
    },
  },
  kinetic: {
    label: '动感',
    values: {
      ...DEFAULT_THEME_SWITCHER_SETTINGS,
      duration: 0.58,
      longDuration: 0.7,
      preStretch: 1.1,
      stretch: 1.3,
      accelDistance: 0.18,
      cruiseDistance: 0.82,
      settleDistance: 0.97,
      activeOpacity: 42,
    },
  },
}

const numericRanges = {
  duration: [0.3, 2.0],
  longDuration: [0.4, 2.4],
  preStretch: [1, 1.2],
  stretch: [1, 1.5],
  accelDistance: [0.05, 0.45],
  cruiseDistance: [0.55, 0.9],
  settleDistance: [0.8, 0.99],
  glassOpacity: [0, 40],
  activeOpacity: [0, 70],
  blur: [0, 24],
  saturation: [80, 240],
  height: [48, 96],
  optionWidth: [48, 96],
  gap: [0, 24],
  capsuleWidth: [48, 120],
}

const colorKeys = [
  'glassColor',
  'lightColor',
  'darkColor',
  'contentColor',
  'actionColor',
]

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeThemeSwitcherSettings(candidate = {}) {
  const next = { ...DEFAULT_THEME_SWITCHER_SETTINGS }

  Object.entries(numericRanges).forEach(([key, range]) => {
    const value = Number(candidate[key])
    if (Number.isFinite(value)) next[key] = clamp(value, range)
  })

  colorKeys.forEach((key) => {
    if (typeof candidate[key] === 'string' && /^#[0-9a-f]{6}$/i.test(candidate[key])) {
      next[key] = candidate[key]
    }
  })

  return next
}

export function readThemeSwitcherSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_THEME_SWITCHER_SETTINGS }

  try {
    const stored = JSON.parse(window.localStorage.getItem('my-blog-theme-switcher-settings') || '{}')
    return normalizeThemeSwitcherSettings(stored)
  } catch {
    return { ...DEFAULT_THEME_SWITCHER_SETTINGS }
  }
}

export function saveThemeSwitcherSettings(settings) {
  try {
    window.localStorage.setItem(
      'my-blog-theme-switcher-settings',
      JSON.stringify(normalizeThemeSwitcherSettings(settings)),
    )
  } catch {
    // The in-memory state still works when storage is unavailable.
  }
}
