// ASCII 字符水体背景（纯 JS，不依赖 React）
//
// 定位：整页是一张固定的字符画布，水面铺满视口；锦鲤只住在首页 hero 里。
//   · 水场按视口坐标计算，滚动时文字在动、水不动
//   · 五种波动共用同一套「底噪 + 漫游主光」，差异只在波形组织
//   · 文字区域逐格降低 alpha（0–7 八档），卡片保持玻璃，水仍从后面透出来
//   · 阅读页可选整体减淡，但不做自动路由判断
//   · 桌面 60fps / 移动端 30fps；reduced-motion 画一帧静态水
//
// 参数全部由 React 传入，不读 URL / localStorage；引擎只认自己的 CONFIG。

const WAVE_MODES = ['drift', 'swell', 'cross', 'rings', 'still']

const BRUSHES = {
  gradient: { glyphs: ' .:-=+*#%@'.split(''), weight: 1 },
  block: { glyphs: [' ', '░', '░', '▒', '▒', '▒', '▓', '▓', '█', '█'], weight: 0.58 },
}

// 两套调色板：浅色不是调亮深色，而是整组反转
const THEMES = {
  dark: {
    bg: [26, 25, 33],
    white: [236, 228, 218],
    red: [232, 96, 56],
    sumi: [104, 99, 112],
    ink: [92, 90, 108],
    fin: [214, 206, 198],
    food: [255, 196, 120],
    alpha: 0.8,
    inkAlpha: 0.42,
  },
  light: {
    bg: [245, 244, 241],
    white: [112, 108, 104],
    red: [204, 62, 28],
    sumi: [54, 49, 58],
    ink: [36, 33, 40],
    fin: [138, 132, 126],
    food: [176, 88, 30],
    alpha: 0.9,
    inkAlpha: 0.45,
  },
}

const WATER_ALPHA = [0, 0.07, 0.1, 0.14, 0.19, 0.25, 0.33, 0.43, 0.55, 0.68]

const STEP = 1 / 60
const BITE_GLYPHS = ['*', '+', '.']
const BITE_MS = 0.45
const FEED_LIFE = 14
const PELLET_MAX = 24
const WAVE_LIFE = 3.4
const SIZE_BIAS = [0, 1, -1, -0.5, 0.5, -0.75, 0.75, -0.25]
const RAMP = 't%SX8@#'
const REDUCED_READING_K = 0.62
const PANEL_SELECTOR = '.bgp, .theme-switcher-global, .site-header'

// 局部压暗只量文字叶子，不量卡片容器 —— 卡片有水才好看，文字不被水干扰。
const DIM_SELECTOR = [
  '[data-water-dim]',
  '.main h1',
  '.main h2',
  '.main h3',
  '.main h4',
  '.main p',
  '.main li',
  '.main blockquote',
  '.main time',
  '.main .blog-post-category',
  '.main .blog-post-tags span',
  '.main .read-more',
  '.main .card-link',
  '.main .card-post-category',
  '.main .card-post-date',
  '.main .tech-pill',
  '.main .tech-tag',
  '.main .progress-label',
  '.main .quote-author',
  '.main .post-header-category',
  '.main .post-header-date',
  '.main .post-tag',
  '.main .post-toc-title',
  '.main .post-toc a',
  '.main .archive-year',
  '.main .archive-month',
  '.main .settings-page-kicker',
  '.main .settings-page-title',
  '.main .settings-page-intro',
  '.main .settings-page-back',
  '.footer .footer-text',
  '.footer .footer-links a',
].join(',')

const DEFAULT_OPTIONS = {
  theme: 'dark',
  brush: 'gradient',
  waveMode: 'cross',
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
  dimStrength: 0.85,
  readingDim: false,
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

const FLAT_RANGES = {
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
}
const FISH_RANGES = {
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
}
const ADVANCED_RANGES = {
  fbmOctaves: [3, 6],
  noiseScale: [0.5, 2],
  gamma: [0.6, 2.2],
  cellK: [0.7, 1.5],
  pixelBudget: [8, 24],
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value
}

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function noise2(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  const ab = a + (b - a) * u
  const cd = c + (d - c) * u
  return ab + (cd - ab) * v
}

const rgba = (color, alpha) =>
  `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`

function mergeNumber(target, source, key, range, integer) {
  const value = Number(source[key])
  if (!Number.isFinite(value)) return false
  const clamped = clamp(value, range[0], range[1])
  const next = integer ? Math.round(clamped) : clamped
  if (target[key] === next) return false
  target[key] = next
  return true
}

function mergeInto(cfg, source) {
  const flags = {
    field: false,
    resize: false,
    fishCount: false,
    fishLength: false,
    theme: false,
    redraw: false,
    reading: false,
  }
  if (!source || typeof source !== 'object') return flags

  for (const key of Object.keys(FLAT_RANGES)) {
    if (mergeNumber(cfg, source, key, FLAT_RANGES[key], key === 'waterLimit')) {
      flags.field = true
      if (key === 'dimStrength') flags.redraw = true
    }
  }

  if (typeof source.ripple === 'boolean' && source.ripple !== cfg.ripple) {
    cfg.ripple = source.ripple
    flags.redraw = true
  }
  if (typeof source.readingDim === 'boolean' && source.readingDim !== cfg.readingDim) {
    cfg.readingDim = source.readingDim
    flags.reading = true
    flags.redraw = true
  }
  if (source.brush && BRUSHES[source.brush] && source.brush !== cfg.brush) {
    cfg.brush = source.brush
    flags.redraw = true
  }
  if (source.waveMode && WAVE_MODES.includes(source.waveMode) && source.waveMode !== cfg.waveMode) {
    cfg.waveMode = source.waveMode
    flags.field = true
  }
  if (source.theme === 'light' || source.theme === 'dark') {
    if (source.theme !== cfg.theme) {
      cfg.theme = source.theme
      flags.theme = true
      flags.redraw = true
    }
  }

  if (source.fish && typeof source.fish === 'object') {
    for (const key of Object.keys(FISH_RANGES)) {
      const changed = mergeNumber(
        cfg.fish,
        source.fish,
        key,
        FISH_RANGES[key],
        key === 'count' || key === 'lengthMin' || key === 'lengthMax',
      )
      if (!changed) continue
      if (key === 'count') flags.fishCount = true
      else if (key === 'lengthMin' || key === 'lengthMax' || key === 'lengthVariation') {
        flags.fishLength = true
      } else {
        flags.redraw = true
      }
    }
    cfg.fish.lengthMax = Math.max(cfg.fish.lengthMin, cfg.fish.lengthMax)
  }

  if (source.advanced && typeof source.advanced === 'object') {
    for (const key of Object.keys(ADVANCED_RANGES)) {
      const changed = mergeNumber(
        cfg.advanced,
        source.advanced,
        key,
        ADVANCED_RANGES[key],
        key === 'fbmOctaves',
      )
      if (!changed) continue
      if (key === 'cellK' || key === 'pixelBudget') flags.resize = true
      else {
        flags.field = true
        flags.redraw = true
      }
    }
  }

  return flags
}

export function createAsciiBackground(canvas, options = {}) {
  const noop = {
    destroy() {},
    setOptions() {},
    measure() {},
    refresh() {},
    stats: () => null,
  }
  if (!canvas || typeof canvas.getContext !== 'function') return noop

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return noop

  const cfg = {
    ...DEFAULT_OPTIONS,
    fish: { ...DEFAULT_OPTIONS.fish },
    advanced: { ...DEFAULT_OPTIONS.advanced },
  }
  mergeInto(cfg, options)

  const S = {
    w: 0,
    h: 0,
    dpr: 1,
    cw: 12,
    ch: 14,
    cols: 0,
    rows: 0,
    time: 0,
    lit: 0,
    visible: typeof document === 'undefined' ? true : !document.hidden,
    running: false,
    destroyed: false,
    isMobile: false,
    raf: 0,
    last: 0,
    acc: 0,
    lastDraw: 0,
    frames: 0,
    fpsT: 0,
    fps: 0,
    levels: new Uint8Array(0),
    mask: new Uint8Array(0),
    halo: new Uint8Array(0),
    dimGrid: new Uint8Array(0), // 让路因子，量化成 0–7 八档，绘制时乘到 alpha 上
    field: new Float32Array(0),
    jitter: new Float32Array(0),
    waveBoost: new Float32Array(0),
    fieldBand: 0,
    dimBoxes: [],
    avoidBoxes: [],
    heroEl: null,
    pondLeft: 0,
    pondTop: 0,
    pondW: 1,
    pondH: 1,
    pondVisible: false,
    readingK: 1,
    effDensity: cfg.waterDensity,
  }

  const WATER = {
    a: new Float32Array(0),
    b: new Float32Array(0),
    waves: [],
    pellets: [],
    bites: [],
    wake: 0,
    peak: 0,
    eaten: 0,
  }

  const FISHES = []
  const FISH_ORDER = []
  const POINTER = {
    x: 0,
    y: 0,
    speed: 0,
    active: false,
    last: 0,
  }

  let EDGE = ''
  let EYE = ''
  let EYE_TILE = ''
  let FIN = ''
  let FIN_TIP = ''
  let SUMI = ''
  let FIN_TILE = ''
  let FOOD = ''
  let FOOD_TILE = ''
  let SHADOW = ''
  let BITE_COLORS = []
  const waterColors = []
  const fishWhite = []
  const fishRed = []
  const fishTileW = []
  const fishTileR = []

  const reduced =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false, addEventListener() {}, removeEventListener() {} }

  const ac = typeof AbortController === 'function' ? new AbortController() : null
  const signal = ac ? ac.signal : undefined

  let resizeRaf = 0
  let resizePending = false

  // ---------- 主题 ----------
  function applyTheme(name) {
    const t = THEMES[name] || THEMES.dark
    const k = t.alpha / 0.8

    const waterInk = name === 'light' ? [58, 72, 86] : t.white
    // 浅色页没有 hero 鱼尾推高的亮区，环境场本身要再多一点对比才不显得空。
    const waterK = k * (name === 'light' ? 1.6 : 1)
    waterColors.length = 0
    for (let i = 0; i < WATER_ALPHA.length; i++) {
      waterColors.push(rgba(waterInk, Math.min(0.9, WATER_ALPHA[i] * waterK)))
    }

    EDGE = rgba(t.ink, t.inkAlpha)
    EYE = rgba(t.bg, 0.95)
    EYE_TILE = rgba(t.white, 0.26)
    FIN = rgba(t.fin, Math.min(0.9, 0.78 * k))
    FIN_TIP = rgba(t.fin, Math.min(0.98, 0.95 * k))
    FIN_TILE = rgba(t.fin, 0.22 * k)
    SUMI = rgba(t.sumi, name === 'dark' ? 0.9 : 0.95)
    const mark = name === 'dark' ? t.white : t.ink
    FOOD = rgba(t.food, 0.95)
    FOOD_TILE = rgba(t.food, 0.2)
    SHADOW = rgba(t.ink, name === 'dark' ? 0.55 : 0.45)
    BITE_COLORS = [rgba(t.food, 0.95), rgba(mark, 0.62), rgba(mark, 0.28)]

    fishWhite.length = 0
    fishRed.length = 0
    fishTileW.length = 0
    fishTileR.length = 0
    for (let i = 0; i < 7; i++) {
      fishWhite.push(rgba(t.white, Math.min(0.98, (0.55 + i * 0.07) * k)))
      fishRed.push(rgba(t.red, Math.min(0.98, (0.62 + i * 0.052) * k)))
      fishTileW.push(rgba(t.white, Math.min(0.3, (0.04 + i * 0.014) * k)))
      fishTileR.push(rgba(t.red, Math.min(0.35, (0.07 + i * 0.013) * k)))
    }

    cfg.theme = name
  }

  // ---------- 噪声 / 水场 ----------
  function fbm(x, y) {
    const octaves = cfg.advanced.fbmOctaves
    let s = 0
    let amp = 0.5
    let f = 1
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      s += noise2(x * f, y * f) * amp
      norm += amp
      f *= 2.03
      amp *= 0.5
    }
    return clamp(s / norm, 0, 1)
  }

  function fieldAt(px, py, t) {
    const mode = cfg.waveMode
    const tt = t * cfg.waveSpeed
    const rad = (cfg.direction * Math.PI) / 180
    const ca = Math.cos(rad)
    const sa = Math.sin(rad)
    const scale = (cfg.advanced.noiseScale / cfg.wavelength) / 980
    const ux = px * scale
    const uy = py * scale
    const nx = ux * ca - uy * sa
    const ny = ux * sa + uy * ca
    const turb = cfg.turbulence
    const warp = fbm(nx * 0.55 + tt * 0.015, ny * 0.45 + 3.7)
    let v = 0

    if (mode === 'swell') {
      // 单向浪：一条被噪声扭曲的波峰带，整体朝右下推进
      const phase = (nx * 0.44 + ny * 0.3 + warp * 0.55 * turb) * Math.PI * 2 - tt * 0.55
      const crest = Math.pow(0.5 + 0.5 * Math.sin(phase), 3)
      v = crest * 0.66 + fbm(nx * 1.25 - tt * 0.012, ny * 1 + tt * 0.007) * 0.24 * turb
    } else if (mode === 'cross') {
      // 交叉浪：两组方向相反的波列叠加，形成不断换位的菱形明暗
      const a =
        0.5 + 0.5 * Math.sin((nx * 0.72 + ny * 0.16 + warp * 0.3 * turb) * Math.PI * 2 - tt * 0.46)
      const b =
        0.5 + 0.5 * Math.sin((nx * 0.18 - ny * 0.68 + warp * 0.28 * turb) * Math.PI * 2 + tt * 0.36)
      v =
        Math.pow(a, 2.4) * 0.44 +
        Math.pow(b, 2.8) * 0.27 +
        fbm(nx * 1.4 + tt * 0.01, ny * 1.2 - tt * 0.008) * 0.13 * turb
    } else if (mode === 'rings') {
      // 同心涟漪：两个缓慢游移的环源，波前互相穿过
      const c1x = 0.48 + 0.1 * Math.sin(tt * 0.035)
      const c1y = 0.38 + 0.08 * Math.cos(tt * 0.029)
      const d1 = Math.hypot(nx - c1x, (ny - c1y) * 1.22)
      const r1 = 0.5 + 0.5 * Math.sin(d1 * 18 - tt * 0.9)
      const c2x = 0.22 + 0.07 * Math.cos(tt * 0.031)
      const c2y = 0.72 + 0.06 * Math.sin(tt * 0.041)
      const d2 = Math.hypot((nx - c2x) * 1.05, (ny - c2y) * 1.28)
      const r2 = 0.5 + 0.5 * Math.sin(d2 * 13 + tt * 0.72)
      v =
        Math.pow(r1, 3) * 0.46 +
        Math.pow(r2, 3) * 0.27 +
        fbm(nx * 1.5 + tt * 0.008, ny * 1.3) * 0.16 * turb
    } else if (mode === 'still') {
      // 静水：只留极慢的底噪，适合把注意力完全交给鱼
      v = fbm(nx * 1.15 + tt * 0.004, ny * 0.95 - tt * 0.003) * 0.72 + 0.04
    } else {
      // 漂移流：低频团块 + 细纹，像整片水在缓慢换气
      const flow = fbm(
        nx * 0.62 + warp * 0.35 * turb + tt * 0.011,
        ny * 0.5 - warp * 0.18 * turb - tt * 0.006,
      )
      const fine = fbm(nx * 1.7 - tt * 0.014, ny * 1.35 + tt * 0.009)
      v = flow * 0.68 + fine * 0.32 * turb
    }

    // 波峰内部再打碎一层细粒：没有这层，正弦带会整行同字符，像网点纸。
    if (mode !== 'drift' && mode !== 'still') {
      const grain = fbm(nx * 2.6 + tt * 0.02, ny * 2.2 - tt * 0.014) - 0.5
      const ripple = 0.5 + 0.5 * Math.sin((nx * 5.4 - ny * 4.2 + warp * 1.2) * Math.PI * 2 - tt * 0.85)
      v += grain * 0.24 * turb + Math.pow(ripple, 5) * 0.17
    }

    // 一片缓慢游移的宽光，给整页一个不聚光的明暗重心
    const lx = 0.62 + 0.18 * Math.sin(tt * 0.035)
    const ly = 0.42 + 0.1 * Math.sin(tt * 0.027 + 1.7)
    v += 0.22 * Math.exp(-((nx - lx) * (nx - lx) * 2.4 + (ny - ly) * (ny - ly) * 3.4))
    if (mode !== 'drift' && mode !== 'still') v += 0.03

    // 密度：0 时整层关闭；数值越大保留的低能区越多
    const cutoff = 0.6 - S.effDensity * 0.175
    v = (v - cutoff) / (1 - cutoff)
    // 波幅：以中灰为轴放大/收拢对比，不改变水纹覆盖率
    v = 0.38 + (v - 0.38) * cfg.amplitude
    return clamp(v, 0, 1)
  }

  // 水纹演化很慢，按 5 条横带轮换刷新
  function refreshField(all = false) {
    const { cols, rows, cw, ch, time } = S
    if (!S.field.length) return
    if (S.effDensity <= 0.001) {
      S.field.fill(0)
      S.fieldBand = 0
      return
    }
    const bands = 5
    const band = S.fieldBand
    const step = all ? 1 : bands
    for (let ry = all ? 0 : band; ry < rows; ry += step) {
      const py = ry * ch + ch * 0.5
      const row = ry * cols
      for (let rx = 0; rx < cols; rx++) {
        S.field[row + rx] = fieldAt(rx * cw + cw * 0.5, py, time)
      }
    }
    S.fieldBand = all ? 0 : (band + 1) % bands
  }

  // ---------- 鱼 ----------
  function fishCountTarget() {
    return clamp(Math.round(cfg.fish.count), 1, S.isMobile ? 2 : 8)
  }

  function setFishLength() {
    const min = clamp(Math.round(cfg.fish.lengthMin), 10, 32)
    const max = Math.max(min, clamp(Math.round(cfg.fish.lengthMax), 10, 32))
    const mid = (min + max) / 2
    const half = (max - min) / 2
    const variation = clamp(cfg.fish.lengthVariation, 0, 1)
    for (const f of FISHES) {
      f.lengthCells = mid + f.sizeBias * half * variation
      f.len = f.lengthCells * S.cw
      f.seg = f.len / (f.N - 1)
      for (let i = 0; i < f.N - 1; i++) f.L[i] = f.seg
    }
  }

  function rebuildSpine(f) {
    for (let i = 0; i < f.N; i++) {
      f.X[i] = f.x - Math.cos(f.heading) * f.seg * i
      f.Y[i] = f.y - Math.sin(f.heading) * f.seg * i
    }
  }

  function createFish(i, n) {
    const rnd = salt => hash2(i * 17 + 3, salt * 131 + 7)
    const pattern = i % 3
    const f = {
      N: 20,
      x: 0,
      y: 0,
      heading: 0,
      len: 160,
      seg: 8,
      speed: 0,
      phase: 0,
      rush: 0,
      startle: 0,
      startleAngle: 0,
      mode: 'lure',
      emerge: 1,
      depth: 0.78,
      depthPulse: 0,
      curiosity: 0.78 + rnd(2) * 0.32,
      speedScale: 0.92 + rnd(3) * 0.16,
      orbit: rnd(1) * Math.PI * 2,
      orbitSide: rnd(4) < 0.5 ? -1 : 1,
      depthPhase: rnd(5) * Math.PI * 2,
      burstIn: 4 + rnd(6) * 7,
      pattern,
      patternName: ['kohaku', 'sanke', 'tancho'][pattern],
      seed: i * 13.7 + rnd(7) * 5,
      sizeBias: SIZE_BIAS[i % SIZE_BIAS.length],
      lengthCells: 0,
      X: new Float32Array(20),
      Y: new Float32Array(20),
      L: new Float32Array(19),
      cells: [],
      count: 0,
    }
    if (n <= 1) {
      f.x = S.pondW * 0.5
      f.y = S.pondH * 0.56
      f.heading = -0.55
    } else {
      const a = ((i + 0.5) / n) * Math.PI * 2 + 0.35
      f.x = S.pondW * (0.5 + 0.23 * Math.cos(a))
      f.y = S.pondH * (0.52 + 0.17 * Math.sin(a))
      f.heading = a + Math.PI * 0.5
    }
    f.phase = rnd(8) * 3
    f.depth = 0.72 + rnd(9) * 0.16
    const stillNow =
      reduced.matches || !S.visible || (typeof document !== 'undefined' && document.hidden)
    f.emerge = stillNow ? 1 : 0
    return f
  }

  function initFish() {
    FISHES.length = 0
    const n = fishCountTarget()
    for (let i = 0; i < n; i++) FISHES.push(createFish(i, n))
    setFishLength()
    for (const f of FISHES) rebuildSpine(f)
  }

  function applyFishCount() {
    if (!S.heroEl) return
    const n = fishCountTarget()
    const old = FISHES.length
    if (n > old) {
      for (let i = old; i < n; i++) FISHES.push(createFish(i, n))
      setFishLength()
      for (let i = old; i < FISHES.length; i++) rebuildSpine(FISHES[i])
    } else if (n < old) {
      FISHES.length = n
    }
  }

  function initWater() {
    const n = S.cols * S.rows
    WATER.a = new Float32Array(n)
    WATER.b = new Float32Array(n)
    WATER.waves.length = 0
    WATER.pellets.length = 0
    WATER.bites.length = 0
    WATER.wake = 0
    WATER.peak = 0
    WATER.eaten = 0
  }

  function remapWorld(oldW, oldH, oldCols, oldRows, oldPondW, oldPondH) {
    const sx = oldW > 0 ? S.w / oldW : 1
    const sy = oldH > 0 ? S.h / oldH : 1
    for (const w of WATER.waves) {
      w.x *= sx
      w.y *= sy
    }
    const psx = oldPondW > 0 ? S.pondW / oldPondW : 1
    const psy = oldPondH > 0 ? S.pondH / oldPondH : 1
    for (const p of WATER.pellets) {
      p.x *= psx
      p.y *= psy
      p.y0 *= psy
      p.tx *= psx
      p.ty *= psy
    }
    for (const b of WATER.bites) {
      b.x *= psx
      b.y *= psy
    }
    POINTER.x *= psx
    POINTER.y *= psy

    const olds = FISHES.map(f => ({ len: f.len, x: f.X.slice(), y: f.Y.slice() }))
    setFishLength()
    for (let j = 0; j < FISHES.length; j++) {
      const f = FISHES[j]
      const old = olds[j]
      if (!old || old.len <= 0) {
        rebuildSpine(f)
        continue
      }
      if (oldPondW > 0) {
        f.x = clamp(old.x[0] * psx, 8, S.pondW - 8)
        f.y = clamp(old.y[0] * psy, 8, S.pondH - 8)
      }
      const k = f.len / old.len
      const hx = old.x[0]
      const hy = old.y[0]
      for (let i = 0; i < f.N; i++) {
        f.X[i] = f.x + (old.x[i] - hx) * k
        f.Y[i] = f.y + (old.y[i] - hy) * k
      }
    }

    if (!oldCols || !oldRows || (S.cols === oldCols && S.rows === oldRows)) return
    const oldA = WATER.a
    const next = new Float32Array(S.cols * S.rows)
    if (oldA.length) {
      for (let ry = 0; ry < S.rows; ry++) {
        const oy = ((ry + 0.5) / S.rows) * oldRows - 0.5
        const y0 = clamp(Math.floor(oy), 0, oldRows - 1)
        const y1 = Math.min(oldRows - 1, y0 + 1)
        const fy = clamp(oy - y0, 0, 1)
        for (let rx = 0; rx < S.cols; rx++) {
          const ox = ((rx + 0.5) / S.cols) * oldCols - 0.5
          const x0 = clamp(Math.floor(ox), 0, oldCols - 1)
          const x1 = Math.min(oldCols - 1, x0 + 1)
          const fx = clamp(ox - x0, 0, 1)
          const a =
            oldA[y0 * oldCols + x0] + (oldA[y0 * oldCols + x1] - oldA[y0 * oldCols + x0]) * fx
          const b =
            oldA[y1 * oldCols + x0] + (oldA[y1 * oldCols + x1] - oldA[y1 * oldCols + x0]) * fx
          next[ry * S.cols + rx] = a + (b - a) * fy
        }
      }
    }
    WATER.a = next
    WATER.b = new Float32Array(next.length)
  }

  // ---------- 水 / 食物 / 涟漪 ----------
  function addWave(x, y, opts = {}) {
    if (!cfg.ripple || reduced.matches || S.destroyed) return null
    WATER.waves.push({
      x,
      y,
      t0: S.time,
      strength: opts.strength == null ? 1 : opts.strength,
      size: opts.size == null ? cfg.rippleSize : opts.size,
    })
    if (WATER.waves.length > 18) WATER.waves.splice(0, WATER.waves.length - 18)
    return WATER.waves[WATER.waves.length - 1]
  }

  function feedAt(x, y) {
    if (!S.heroEl) return
    const px = clamp(x, 0, S.pondW)
    const py = clamp(y, 0, S.pondH)
    const count = 5 + Math.floor(Math.random() * 4)
    for (const f of FISHES) {
      if (Math.hypot(f.x - px, f.y - py) < 650) f.rush = 1
    }
    for (let i = 0; i < count && WATER.pellets.length < PELLET_MAX; i++) {
      const ang = Math.random() * Math.PI * 2
      const rad = Math.sqrt(Math.random()) * 34
      const tx = clamp(px + Math.cos(ang) * rad * 1.3, S.cw, S.pondW - S.cw)
      const ty = clamp(py + Math.sin(ang) * rad, S.ch, S.pondH - S.ch)
      const y0 = clamp(ty - 26 - Math.random() * 24, 0, S.pondH)
      const dur = 0.15 + Math.random() * 0.3
      WATER.pellets.push({
        x: tx,
        y: y0,
        y0,
        tx,
        ty,
        age: 0,
        fall: dur,
        dur,
        landed: false,
      })
    }
  }

  function nearestPellet(f) {
    let best = null
    let bestD = Infinity
    for (const p of WATER.pellets) {
      const d = Math.hypot(p.x - f.x, p.y - f.y)
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    if (!best) return null
    const reach = Math.max(f.len * 1.6 + 220, f.rush > 0.05 ? 650 : 0)
    return bestD <= reach ? { p: best, d: bestD } : null
  }

  function depositTail() {
    for (const f of FISHES) {
      const amt = (0.035 + 0.0012 * f.speed) * (0.65 + 0.35 * f.depth)
      for (let i = f.N - 4; i < f.N; i++) {
        const rx = Math.floor((S.pondLeft + f.X[i]) / S.cw)
        const ry = Math.floor((S.pondTop + f.Y[i]) / S.ch)
        if (rx < 0 || rx >= S.cols || ry < 0 || ry >= S.rows) continue
        WATER.a[ry * S.cols + rx] += amt
      }
    }
  }

  function diffuseWater(dt) {
    const a = WATER.a
    const b = WATER.b
    const cols = S.cols
    const rows = S.rows
    const decay = Math.exp(-0.62 * dt)
    for (let ry = 0; ry < rows; ry++) {
      const row = ry * cols
      for (let rx = 0; rx < cols; rx++) {
        const i = row + rx
        const l = rx > 0 ? a[i - 1] : 0
        const rt = rx < cols - 1 ? a[i + 1] : 0
        const u = ry > 0 ? a[i - cols] : 0
        const d = ry < rows - 1 ? a[i + cols] : 0
        b[i] = Math.min(1.2, (a[i] * 0.5 + (l + rt + u + d) * 0.125) * decay)
      }
    }
    WATER.a = b
    WATER.b = a
  }

  function updateWater(dt) {
    if (S.pondVisible) depositTail()
    diffuseWater(dt)

    for (let i = WATER.waves.length - 1; i >= 0; i--) {
      if (S.time - WATER.waves[i].t0 > WAVE_LIFE) WATER.waves.splice(i, 1)
    }
    for (let i = WATER.pellets.length - 1; i >= 0; i--) {
      const p = WATER.pellets[i]
      p.age += dt
      if (!p.landed) {
        p.fall = Math.max(0, p.fall - dt)
        p.y = p.y0 + (p.ty - p.y0) * (1 - p.fall / p.dur)
        if (p.fall <= 0) {
          p.landed = true
          p.y = p.ty
          addWave(S.pondLeft + p.tx, S.pondTop + p.ty, { strength: 0.28, size: 0.65 })
        }
      } else {
        p.y += 5 * dt
      }
      if (p.age >= FEED_LIFE || p.y > S.pondH + 20) WATER.pellets.splice(i, 1)
    }
    for (let i = WATER.bites.length - 1; i >= 0; i--) {
      const b = WATER.bites[i]
      b.age += dt
      if (b.age >= BITE_MS) WATER.bites.splice(i, 1)
    }
  }

  // ---------- 鱼群行为 ----------
  function angleDiff(a, b) {
    const d = a - b
    return Math.atan2(Math.sin(d), Math.cos(d))
  }

  function fishTarget(t) {
    const a = t * 0.28
    return {
      x: S.pondW * 0.5 + S.pondW * 0.3 * Math.sin(a),
      y: S.pondH * 0.52 + S.pondH * 0.19 * Math.sin(a * 2),
    }
  }

  function updateFish(f, dt) {
    f.phase += dt * (3.0 + 0.15 * f.curiosity)
    f.depthPhase += dt * (0.16 + 0.04 * f.speedScale)
    f.depthPulse = Math.max(0, f.depthPulse - dt * 0.45)
    f.depth = clamp(0.78 + 0.18 * Math.sin(f.depthPhase) - 0.24 * f.depthPulse, 0.5, 1)
    f.emerge = Math.min(1, f.emerge + dt / Math.max(0.2, cfg.fish.emergeDuration))
    f.rush = Math.max(0, f.rush - dt * 0.3)
    f.startle = Math.max(0, f.startle - dt * 0.6)
    if (POINTER.active && performance.now() - POINTER.last > 120) {
      POINTER.speed *= Math.exp(-7 * dt)
    }

    f.burstIn -= dt
    if (f.burstIn <= 0) {
      f.burstIn = 6 + Math.random() * 8
      if (f.startle < 0.1 && f.mode !== 'feed') {
        f.rush = 1
        f.depthPulse = 1
      }
    }

    // 每条鱼在不同相位上采样同一条巡游曲线，避免全体挤向画面中心
    const lure = fishTarget(S.time + f.orbit * 2.1)
    const food = nearestPellet(f)
    let tx = lure.x + Math.cos(f.orbit + S.time * 0.17) * S.pondW * 0.05
    let ty = lure.y + Math.sin(f.orbit * 1.3 + S.time * 0.14) * S.pondH * 0.04
    let mode = 'lure'

    if (f.startle > 0.3) {
      tx = clamp(f.x + Math.cos(f.startleAngle) * 260, 18, S.pondW - 18)
      ty = clamp(f.y + Math.sin(f.startleAngle) * 260, 18, S.pondH - 18)
      mode = 'flee'
    } else if (food) {
      tx = food.p.x
      ty = food.p.y
      mode = 'feed'
    } else if (POINTER.active) {
      const pd = Math.hypot(POINTER.x - f.x, POINTER.y - f.y)
      const radius = cfg.fish.curiosityRadius * f.curiosity
      if (pd < radius) {
        const toP = Math.atan2(POINTER.y - f.y, POINTER.x - f.x)
        const near = 1 - smoothstep(40, radius, pd)
        const orbit = 0.35 + 1.05 * near
        const rad = Math.max(60, Math.min(180, pd * 0.75))
        tx = POINTER.x + Math.cos(toP + f.orbitSide * orbit) * rad
        ty = POINTER.y + Math.sin(toP + f.orbitSide * orbit) * rad
        mode = 'curious'
      }
    }

    // 同类分离：只改目标点，不硬推位置，避免鱼群抖动
    let sepX = 0
    let sepY = 0
    for (const o of FISHES) {
      if (o === f) continue
      const dx = f.x - o.x
      const dy = f.y - o.y
      const min = (f.len + o.len) * 0.62
      const d = Math.hypot(dx, dy)
      if (d > 0.1 && d < min) {
        const w = 1 - d / min
        sepX += (dx / d) * w
        sepY += (dy / d) * w
      }
    }
    if (sepX || sepY) {
      const sl = Math.hypot(sepX, sepY)
      // 抢食时减弱避让，否则几条鱼会互相推开、谁都不靠近饲料
      const push = (mode === 'feed' ? 0.15 : 1.2) * f.len
      tx += (sepX / sl) * push
      ty += (sepY / sl) * push
      if (mode === 'lure') mode = 'school'
    }

    const edge = Math.max(S.cw * 4, f.len * 0.55)
    if (f.x < edge) tx += (edge - f.x) * 1.4
    else if (f.x > S.pondW - edge) tx -= (f.x - (S.pondW - edge)) * 1.4
    if (f.y < edge) ty += (edge - f.y) * 1.4
    else if (f.y > S.pondH - edge) ty -= (f.y - (S.pondH - edge)) * 1.4

    if (S.avoidBoxes.length) {
      const margin = Math.max(S.cw * 7, f.len * 0.8)
      let ax = 0
      let ay = 0
      for (let i = 0; i < S.avoidBoxes.length; i++) {
        const b = S.avoidBoxes[i]
        const nx = clamp(f.x, b[0], b[2])
        const ny = clamp(f.y, b[1], b[3])
        const dx = f.x - nx
        const dy = f.y - ny
        const d = Math.hypot(dx, dy)
        if (d >= margin) continue
        const w = Math.pow(1 - d / margin, 2)
        if (d > 0.5) {
          const k = w / d
          ax += dx * k - dy * k * 0.35 * f.orbitSide
          ay += dy * k + dx * k * 0.35 * f.orbitSide
        } else {
          const dl = f.x - b[0]
          const dr = b[2] - f.x
          const dt = f.y - b[1]
          const db = b[3] - f.y
          const m = Math.min(dl, dr, dt, db)
          if (m === dl) ax -= 1
          else if (m === dr) ax += 1
          else if (m === dt) ay -= 1
          else ay += 1
        }
      }
      if (ax || ay) {
        tx += ax * margin * 0.9
        ty += ay * margin * 0.9
        if (mode !== 'flee' && mode !== 'feed') mode = 'avoid'
      }
    }
    tx = clamp(tx, 18, S.pondW - 18)
    ty = clamp(ty, 18, S.pondH - 18)
    f.mode = mode

    const desired = Math.atan2(ty - f.y, tx - f.x)
    const turn = angleDiff(desired, f.heading)
    const maxTurn = (f.startle > 0.3 ? 2.6 : 1.2 + 1.6 * f.rush) * dt
    f.heading += clamp(turn, -maxTurn, maxTurn)

    const base = cfg.fish.swimSpeed * f.speedScale
    let speed
    if (mode === 'flee') {
      speed = base + 150 * f.startle
    } else {
      speed = (base + base * f.rush) * (1 - 0.42 * Math.min(1, Math.abs(turn) / 1.4))
      if (mode === 'curious') speed *= 0.9
      if (mode === 'school') speed *= 1.04
      if (food && food.d < 38) speed *= 0.55
    }
    f.x += Math.cos(f.heading) * speed * dt
    f.y += Math.sin(f.heading) * speed * dt
    f.x = clamp(f.x, 6, S.pondW - 6)
    f.y = clamp(f.y, 6, S.pondH - 6)
    f.speed = speed

    if (
      mode !== 'flee' &&
      food &&
      Math.hypot(food.p.x - f.x, food.p.y - f.y) < Math.max(S.cw * 1.6, 12)
    ) {
      const idx = WATER.pellets.indexOf(food.p)
      if (idx !== -1) {
        WATER.pellets.splice(idx, 1)
        WATER.bites.push({ x: food.p.x, y: food.p.y, age: 0 })
        WATER.eaten++
      }
    }

    f.X[0] = f.x
    f.Y[0] = f.y
    for (let i = 1; i < f.N; i++) {
      const ax = f.X[i - 1]
      const ay = f.Y[i - 1]
      let ang = Math.atan2(f.Y[i] - ay, f.X[i] - ax)
      if (i > 1) {
        const ref = Math.atan2(f.Y[i - 1] - f.Y[i - 2], f.X[i - 1] - f.X[i - 2])
        const bend = angleDiff(ang, ref)
        const maxBend = 0.14
        if (Math.abs(bend) > maxBend) ang = ref + (bend > 0 ? maxBend : -maxBend)
      }
      f.X[i] = ax + Math.cos(ang) * f.seg
      f.Y[i] = ay + Math.sin(ang) * f.seg
    }

    for (let i = 0; i < f.N - 1; i++) {
      f.L[i] = Math.hypot(f.X[i + 1] - f.X[i], f.Y[i + 1] - f.Y[i]) || 1e-6
    }
  }

  function updateWorld(dt) {
    if (S.pondVisible) {
      for (const f of FISHES) updateFish(f, dt)
    }
    updateWater(dt)
  }

  // ---------- 鱼的形体 ----------
  function bodyHalfWidth(f, s) {
    const W = f.len * 0.178
    const head = 0.82 + 0.18 * Math.sin(Math.min(1, s / 0.16) * Math.PI * 0.5)
    const taper = 1 - 0.68 * smoothstep(0.46, 0.96, s)
    return W * head * taper
  }

  function waveAt(f, s) {
    return Math.sin(f.phase - s * 5.4) * f.len * 0.038 * Math.pow(s, 1.5)
  }

  const hit = { s: 0, v: 0, d: 0 }

  function nearestOnSpine(f, px, py, out) {
    let best = Infinity
    let bs = 0
    let bv = 0
    for (let i = 0; i < f.N - 1; i++) {
      const ax = f.X[i]
      const ay = f.Y[i]
      const vx = f.X[i + 1] - ax
      const vy = f.Y[i + 1] - ay
      let t = ((px - ax) * vx + (py - ay) * vy) / (f.L[i] * f.L[i])
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const dx = px - (ax + vx * t)
      const dy = py - (ay + vy * t)
      const d2 = dx * dx + dy * dy
      if (d2 < best) {
        best = d2
        bs = (i + t) / (f.N - 1)
        bv = (vx * dy - vy * dx) / f.L[i]
      }
    }
    out.s = bs
    out.v = bv
    out.d = Math.sqrt(best)
    return out
  }

  // kohaku：头、背中、尾前三块红白；sanke 额外点墨；tancho 只有头顶一块红
  function isRedPatch(f, s, q) {
    if (f.pattern === 2) {
      const n = (noise2(s * 14 + f.seed, q * 8 + 2.1) - 0.5) * 0.12
      return Math.pow((s - 0.075) / 0.062, 2) + Math.pow(q / 0.42, 2) + n < 1
    }
    const n = (noise2(s * 9 + 2.3 + f.seed * 0.13, q * 5 + 4.1) - 0.5) * 0.3
    const p0 = Math.pow((s - 0.03) / 0.095, 2) + Math.pow(q / 0.74, 2)
    const p1 = Math.pow((s - 0.3) / 0.125, 2) + Math.pow((q + 0.05) / 0.74, 2)
    const p2 = Math.pow((s - 0.59) / 0.075, 2) + Math.pow((q - 0.08) / 0.58, 2)
    return p0 + n < 1 || p1 + n < 1 || p2 + n < 1
  }

  // 墨斑只给 sanke，点在红白之间的留白处，避免低分辨率下像破洞
  function isSumiPatch(f, s, q) {
    if (f.pattern !== 1) return false
    const n = (noise2(s * 16 + 7.1 + f.seed * 0.17, q * 8 + 1.7) - 0.5) * 0.24
    const s0 = Math.pow((s - 0.145) / 0.045, 2) + Math.pow((q + 0.42) / 0.24, 2)
    const s1 = Math.pow((s - 0.465) / 0.038, 2) + Math.pow((q - 0.34) / 0.2, 2)
    return s0 + n < 1 || s1 + n < 1
  }

  // 把鱼光栅化进字符格：5 点采样做边缘抗锯齿，波长沿脊骨衰减到尾
  function collectFish(f) {
    const cw = S.cw
    const ch = S.ch
    f.count = 0
    if (!S.pondVisible) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < f.N; i++) {
      if (f.X[i] < minX) minX = f.X[i]
      if (f.X[i] > maxX) maxX = f.X[i]
      if (f.Y[i] < minY) minY = f.Y[i]
      if (f.Y[i] > maxY) maxY = f.Y[i]
    }
    const pad = f.len * 0.22 + cw
    const left = S.pondLeft
    const top = S.pondTop
    const r0 = Math.max(0, Math.floor((top + minY - pad) / ch))
    const r1 = Math.min(S.rows - 1, Math.ceil((top + maxY + pad) / ch))
    const c0 = Math.max(0, Math.floor((left + minX - pad) / cw))
    const c1 = Math.min(S.cols - 1, Math.ceil((left + maxX + pad) / cw))
    if (r1 < r0 || c1 < c0) return

    const ox = cw * 0.32
    const oy = ch * 0.32
    const sx = [0, -ox, ox, -ox, ox]
    const sy = [0, -oy, -oy, oy, oy]

    const ti = f.N - 1
    const tdx = f.X[ti] - f.X[ti - 1]
    const tdy = f.Y[ti] - f.Y[ti - 1]
    const tlen = Math.hypot(tdx, tdy) || 1
    const tux = tdx / tlen
    const tuy = tdy / tlen
    const tailLen = f.len * 0.25
    const tailAngle = 0.95

    for (let ry = r0; ry <= r1; ry++) {
      const cy = ry * ch + ch * 0.5 - top
      for (let rx = c0; rx <= c1; rx++) {
        const cx = rx * cw + cw * 0.5 - left
        let inside = 0
        let fin = 0
        let side = 0
        for (let k = 0; k < 5; k++) {
          const px = cx + sx[k]
          const py = cy + sy[k]
          nearestOnSpine(f, px, py, hit)
          const hw = bodyHalfWidth(f, hit.s)
          const cap = hit.s <= 0 || hit.s >= 1
          const dBody = cap ? hit.d : Math.abs(hit.v - waveAt(f, hit.s))
          if (dBody < hw) {
            inside++
          } else {
            const q = (hit.v - waveAt(f, hit.s)) / hw
            const aq = Math.abs(q)
            const pec = Math.pow((hit.s - 0.2) / 0.105, 2) + Math.pow((aq - 1.02) / 0.62, 2) < 1
            const pel = Math.pow((hit.s - 0.55) / 0.055, 2) + Math.pow((aq - 1.02) / 0.4, 2) < 1
            if (pec || pel) {
              side++
            } else {
              const dx0 = px - f.X[ti]
              const dy0 = py - f.Y[ti]
              const along = dx0 * tux + dy0 * tuy
              if (along > 0) {
                const lat = tux * dy0 - tuy * dx0
                const ang = Math.atan2(lat, along)
                if (Math.abs(ang) < tailAngle) {
                  const kk = Math.abs(ang) / tailAngle
                  const reach =
                    tailLen * (0.8 + 0.2 * Math.sqrt(kk)) * (1 - 0.06 * smoothstep(0.9, 1, kk))
                  if (Math.hypot(along, lat) <= reach) fin++
                }
              }
            }
          }
        }
        if (!inside && !fin && !side) continue

        if (!inside) {
          const cell = f.cells[f.count] || (f.cells[f.count] = {})
          cell.rx = rx
          cell.ry = ry
          cell.glyph = '%'
          cell.color = fin >= 2 || side >= 2 ? FIN_TIP : FIN
          cell.tile = FIN_TILE
          cell.red = false
          cell.sumi = false
          cell.kind = fin > 0 ? 'tail' : 'side'
          f.count++
          S.mask[ry * S.cols + rx] = 1
          continue
        }

        nearestOnSpine(f, cx, cy, hit)
        const s = hit.s
        const hw = bodyHalfWidth(f, s)
        const q = clamp((hit.v - waveAt(f, s)) / hw, -1, 1)
        const cov = inside / 5
        const radial = 1 - Math.abs(q)
        let light = 0.28 + 0.72 * Math.pow(radial, 0.55)
        light *= 1 - 0.18 * smoothstep(0.6, 1, s)

        const red = isRedPatch(f, s, q)
        const sumi = !red && isSumiPatch(f, s, q)
        const idx = clamp(
          Math.round(1 + light * 4.6 + (hash2(rx + 9 + f.seed * 7, ry + 17) - 0.5) * 1.1),
          1,
          6,
        )
        const eye = cov > 0.55 && s < 0.055 && Math.abs(Math.abs(q) - 0.66) < 0.07

        let glyph
        let color
        let tile = null
        if (eye) {
          glyph = 'o'
          color = EYE
          tile = EYE_TILE
        } else if (cov < 0.55) {
          glyph = cov < 0.35 ? ':' : 't'
          color = EDGE
        } else if (sumi) {
          glyph = idx >= 4 ? '#' : '8'
          color = SUMI
        } else {
          glyph = RAMP[idx - 1]
          color = red ? fishRed[idx - 1] : fishWhite[idx - 1]
          tile = red ? fishTileR[idx - 1] : fishTileW[idx - 1]
        }

        const cell = f.cells[f.count] || (f.cells[f.count] = {})
        cell.rx = rx
        cell.ry = ry
        cell.glyph = glyph
        cell.color = color
        cell.tile = tile
        cell.red = red
        cell.sumi = sumi
        cell.kind = 'body'
        f.count++
        S.mask[ry * S.cols + rx] = 1
      }
    }

    // 锦鲤触须：从吻端向前伸出两对短须，必须落在钝头轮廓之外才可见
    const hux = Math.cos(f.heading)
    const huy = Math.sin(f.heading)
    const nux = -huy
    const nuy = hux
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const px =
          f.X[0] + hux * f.len * (0.17 + k * 0.04) + nux * side * f.len * (0.03 + k * 0.025)
        const py =
          f.Y[0] + huy * f.len * (0.17 + k * 0.04) + nuy * side * f.len * (0.03 + k * 0.025)
        const rx = Math.floor((left + px) / cw)
        const ry = Math.floor((top + py) / ch)
        if (rx < 0 || rx >= S.cols || ry < 0 || ry >= S.rows) continue
        const idx = ry * S.cols + rx
        if (S.mask[idx]) continue
        const cell = f.cells[f.count] || (f.cells[f.count] = {})
        cell.rx = rx
        cell.ry = ry
        cell.glyph = k ? '.' : ':'
        cell.color = FIN_TIP
        cell.tile = null
        cell.red = false
        cell.sumi = false
        cell.kind = 'barbel'
        f.count++
        S.mask[idx] = 1
      }
    }
  }

  function collectSchool() {
    S.mask.fill(0)
    S.halo.fill(0)
    for (const f of FISHES) collectFish(f)
    for (const f of FISHES) {
      for (let i = 0; i < f.count; i++) {
        const c = f.cells[i]
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const rr = c.ry + dy
            const cc = c.rx + dx
            if (rr < 0 || rr >= S.rows || cc < 0 || cc >= S.cols) continue
            const idx = rr * S.cols + cc
            if (!S.mask[idx]) S.halo[idx] = 1
          }
        }
      }
    }
  }

  // ---------- 文字压暗 ----------
  function updateReadingK() {
    S.readingK = cfg.readingDim && !S.heroEl ? REDUCED_READING_K : 1
  }

  function measureDim() {
    if (S.destroyed) return
    const hero = typeof document !== 'undefined' ? document.querySelector('.hero-section') : null
    if (hero !== S.heroEl) {
      S.heroEl = hero
      if (!hero) {
        FISHES.length = 0
        WATER.pellets.length = 0
        WATER.bites.length = 0
        POINTER.active = false
        POINTER.speed = 0
      }
    }

    if (hero) {
      const r = hero.getBoundingClientRect()
      S.pondLeft = r.left
      S.pondTop = r.top
      S.pondW = Math.max(1, r.width)
      S.pondH = Math.max(1, r.height)
      S.pondVisible = r.bottom > 0 && r.top < S.h && r.right > 0 && r.left < S.w
      if (!FISHES.length) initFish()
    } else {
      S.pondVisible = false
      S.pondW = Math.max(1, S.w)
      S.pondH = Math.max(1, S.h)
    }

    // 水体让路用视口坐标：画布固定，页面滚动时文字在动，水不跟着动。
    const boxes = []
    const seen = new Set()
    const nodes = document.querySelectorAll(DIM_SELECTOR)
    for (const el of nodes) {
      if (seen.has(el)) continue
      seen.add(el)
      if (el.closest('.bgp, .theme-switcher-global, .site-header')) continue
      const b = el.getBoundingClientRect()
      if (b.width < 2 || b.height < 2) continue
      if (b.bottom < -60 || b.top > S.h + 60) continue
      boxes.push([
        b.left / S.cw - 0.45,
        b.top / S.ch - 0.45,
        b.right / S.cw + 0.45,
        b.bottom / S.ch + 0.45,
      ])
    }
    S.dimBoxes = boxes

    // 鱼群避让只关心 hero 内的文字块，坐标仍用池内局部坐标。
    const avoid = []
    if (hero) {
      for (const el of hero.querySelectorAll('[data-water-avoid]')) {
        const b = el.getBoundingClientRect()
        if (b.width < 2 || b.height < 2) continue
        avoid.push([
          b.left - S.pondLeft,
          b.top - S.pondTop,
          b.right - S.pondLeft,
          b.bottom - S.pondTop,
        ])
      }
    }
    S.avoidBoxes = avoid
    updateReadingK()
  }

  function updateDim() {
    const dim = S.dimGrid
    if (!dim.length) return
    dim.fill(0)
    const boxes = S.dimBoxes
    if (!boxes.length) return
    const feather = 3.2
    for (let ry = 0; ry < S.rows; ry++) {
      const cy = ry + 0.5
      for (let rx = 0; rx < S.cols; rx++) {
        const cx = rx + 0.5
        let best = 0
        for (let i = 0; i < boxes.length; i++) {
          const b = boxes[i]
          const dx = Math.max(b[0] - cx, 0, cx - b[2])
          const dy = Math.max(b[1] - cy, 0, cy - b[3])
          const k = 1 - smoothstep(0, feather, Math.hypot(dx, dy))
          if (k > best) best = k
        }
        if (best > 0.08) dim[ry * S.cols + rx] = Math.min(7, Math.ceil(best * 7))
      }
    }
  }

  // ---------- 尺寸 ----------
  function resize() {
    if (S.destroyed || typeof window === 'undefined') return
    resizePending = false
    const oldW = S.w
    const oldH = S.h
    const oldCols = S.cols
    const oldRows = S.rows
    const oldPondW = S.pondW
    const oldPondH = S.pondH
    const first = oldCols === 0

    S.w = Math.max(1, Math.round(window.innerWidth))
    S.h = Math.max(1, Math.round(window.innerHeight))
    S.isMobile = S.w < 720
    const budget = cfg.advanced.pixelBudget * 1e6
    S.dpr = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(budget / (S.w * S.h)),
    )

    // 1440/1920 保持原型字符大小；超过后逐步放大，列数封顶 160、总格 18k
    S.cw = clamp(Math.round((S.w / 125) * cfg.advanced.cellK), 6, 24)
    S.cw = Math.max(S.cw, Math.ceil(S.w / 160))
    while (
      S.cw < 48 &&
      Math.ceil(S.w / S.cw) * Math.ceil(S.h / (S.cw + 2)) > 18000
    ) {
      S.cw++
    }
    S.ch = S.cw + 2
    S.cols = Math.ceil(S.w / S.cw)
    S.rows = Math.ceil(S.h / S.ch)
    S.effDensity = cfg.waterDensity * (S.isMobile ? 0.85 : 1)

    canvas.width = Math.round(S.w * S.dpr)
    canvas.height = Math.round(S.h * S.dpr)
    canvas.style.width = `${S.w}px`
    canvas.style.height = `${S.h}px`
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0)
    ctx.font = `600 ${Math.round(S.ch * 0.72)}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const n = S.cols * S.rows
    if (first || S.cols !== oldCols || S.rows !== oldRows) {
      S.levels = new Uint8Array(n)
      S.mask = new Uint8Array(n)
      S.halo = new Uint8Array(n)
      S.dimGrid = new Uint8Array(n)
      S.field = new Float32Array(n)
      S.jitter = new Float32Array(n)
      S.waveBoost = new Float32Array(n)
      for (let ry = 0; ry < S.rows; ry++) {
        for (let rx = 0; rx < S.cols; rx++) {
          S.jitter[ry * S.cols + rx] = (hash2(rx, ry) - 0.5) * 0.85
        }
      }
    }

    if (first || !WATER.a.length) {
      // 先量 hero 再初始化鱼，首帧就有真实池尺寸
      measureDim()
      if (S.heroEl && !FISHES.length) initFish()
      initWater()
    } else {
      measureDim()
      remapWorld(oldW, oldH, oldCols, oldRows, oldPondW, oldPondH)
      if (S.heroEl) applyFishCount()
    }

    refreshField(true)
    updateDim()
    draw()
  }

  function scheduleResize() {
    resizePending = true
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      if (resizePending) resize()
    })
  }

  // 点击涟漪：把扩张亮环折进一张亮度增量图，
  // 只遍历每圈覆盖到的格子，晚期的环不会整页空转。
  function buildWaveBoost() {
    const boost = S.waveBoost
    if (!boost.length) return
    boost.fill(0)
    const waves = WATER.waves
    if (!waves.length || !cfg.ripple) return

    const { cw, ch, cols, rows, time } = S
    for (let wi = 0; wi < waves.length; wi++) {
      const wv = waves[wi]
      const age = time - wv.t0
      if (age < 0 || age > WAVE_LIFE) continue
      const size = wv.size > 0 ? wv.size : 1
      const radius = age * 250 * size * cfg.rippleSpread
      const reach = 72 * size * 1.8
      const outer = radius + reach
      const inner = Math.max(0, radius - reach)
      const fade = wv.strength * 1.2 * Math.exp(-age * 1.05 * cfg.rippleDecay)
      if (fade < 0.004) continue

      const x0 = Math.max(0, Math.floor((wv.x - outer) / cw))
      const x1 = Math.min(cols - 1, Math.ceil((wv.x + outer) / cw))
      const y0 = Math.max(0, Math.floor((wv.y - outer) / ch))
      const y1 = Math.min(rows - 1, Math.ceil((wv.y + outer) / ch))
      if (x1 < x0 || y1 < y0) continue

      const inner2 = inner * inner
      const outer2 = outer * outer
      for (let ry = y0; ry <= y1; ry++) {
        const dy = ry * ch + ch * 0.5 - wv.y
        const dy2 = dy * dy
        const row = ry * cols
        for (let rx = x0; rx <= x1; rx++) {
          const dx = rx * cw + cw * 0.5 - wv.x
          const d2 = dx * dx + dy2
          if (d2 < inner2 || d2 > outer2) continue
          const ring = Math.abs(Math.sqrt(d2) - radius) / reach
          if (ring >= 1) continue
          const k = 1 - ring
          boost[row + rx] += fade * k * k * k
        }
      }
    }
  }

  // ---------- 绘制 ----------
  function draw() {
    if (S.destroyed || !S.cols || !S.rows) return
    const { w, h, cw, ch, cols, rows } = S

    ctx.clearRect(0, 0, w, h)
    ctx.globalAlpha = 1
    ctx.font = `600 ${Math.round(ch * 0.72)}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    refreshField()

    const levels = S.levels
    const field = S.field
    const jitter = S.jitter
    const boost = S.waveBoost
    const water = WATER.a
    const dim = S.dimGrid
    const waterLimit = clamp(Math.round(cfg.waterLimit), 1, 10)
    const ambientCap = (waterLimit - 1) / 9
    const dimScale = cfg.dimStrength / 7
    const brush = BRUSHES[cfg.brush] || BRUSHES.gradient
    const brushWeight = brush.weight
    const readingK = S.readingK
    const presence = cfg.presence

    collectSchool()
    buildWaveBoost()

    let lit = 0
    let wake = 0
    let peak = 0
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const idx = ry * cols + rx
        const e = water[idx]
        if (e > peak) peak = e
        if (e > 0.18) wake++
        let v = field[idx]
        // 环境场只用到「水纹档位」上限；鱼尾与涟漪在此之上仍可冲到高亮档
        v = Math.pow(v, cfg.advanced.gamma)
        if (v > ambientCap) v = ambientCap
        if (e > 0.002) v += Math.min(0.62, e * 1.45) * (1 - v)
        const wb = boost[idx]
        if (wb > 0.001) v += wb * (1 - v)
        if (v > 1) v = 1
        let lv = Math.round(v * 9 + jitter[idx] * 1.0)
        if (lv <= 0) {
          levels[idx] = 0
        } else {
          lv = lv > 9 ? 9 : lv
          levels[idx] = lv + 1
          lit++
        }
      }
    }
    WATER.wake = wake
    WATER.peak = peak

    // 水体字符：梯度 10 档直接对字符，积木按同一批档位折算成块面
    let alpha = -1
    let style = ''
    for (let ry = 0; ry < rows; ry++) {
      const gy = ry * ch + ch * 0.5
      for (let rx = 0; rx < cols; rx++) {
        const idx = ry * cols + rx
        const lv = levels[idx]
        if (!lv) continue
        if (S.mask[idx] || S.halo[idx]) continue
        const glyph = brush.glyphs[lv - 1]
        if (!glyph || glyph === ' ') continue
        const dlev = dim[idx]
        let a = brushWeight * presence * readingK
        if (dlev) a *= 1 - dlev * dimScale
        if (a < 0.01) continue
        if (a > 1) a = 1
        if (a !== alpha) {
          ctx.globalAlpha = a
          alpha = a
        }
        const c = waterColors[lv - 1]
        if (c !== style) {
          ctx.fillStyle = c
          style = c
        }
        ctx.fillText(glyph, rx * cw + cw * 0.5, gy)
      }
    }
    ctx.globalAlpha = 1

    // 由深到浅：depth 小的先画，近处的鱼盖住远处的
    FISH_ORDER.length = 0
    if (S.pondVisible && FISHES.length) {
      for (const f of FISHES) if (f.emerge > 0.01) FISH_ORDER.push(f)
      FISH_ORDER.sort((a, b) => a.depth - b.depth)
    }

    // 影子：越深的鱼影子偏移越大，暗示离池底更近
    for (const f of FISH_ORDER) {
      const emerge = smoothstep(0, 1, f.emerge)
      const depth = clamp(f.depth, 0, 1)
      const shadowAlpha = clamp(cfg.fish.shadowAlpha * (1.15 - 0.15 * depth), 0, 1)
      if (shadowAlpha <= 0.002) continue
      const off = depth < 0.7 ? 2 : 1
      ctx.save()
      const rise = (1 - emerge) * ch * 2.4
      if (rise > 0.05) ctx.translate(0, rise)
      ctx.fillStyle = SHADOW
      for (let i = 0; i < f.count; i++) {
        const c = f.cells[i]
        if (c.kind === 'barbel' || c.ry + off >= rows) continue
        let a = emerge * shadowAlpha * readingK
        const dlev = dim[(c.ry + off) * cols + c.rx]
        if (dlev) a *= 1 - dlev * dimScale
        ctx.globalAlpha = a
        ctx.fillText(':', c.rx * cw + cw * 0.5, (c.ry + off) * ch + ch * 0.5)
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1

    // 饲料压在鱼体之下，鱼游过时自然遮住
    if (S.pondVisible) {
      for (const p of WATER.pellets) {
        const rx = Math.floor((S.pondLeft + p.x) / cw)
        const ry = Math.floor((S.pondTop + p.y) / ch)
        if (rx < 0 || rx >= cols || ry < 0 || ry >= rows) continue
        const dlev = dim[ry * cols + rx]
        let a = readingK
        if (dlev) a *= 1 - dlev * dimScale
        ctx.globalAlpha = a
        ctx.fillStyle = FOOD_TILE
        ctx.fillRect(rx * cw + 1, ry * ch + 1, cw - 1, ch - 1)
        ctx.fillStyle = FOOD
        ctx.fillText('*', rx * cw + cw * 0.5, ry * ch + ch * 0.5)
      }
    }
    ctx.globalAlpha = 1

    // 每条鱼先铺瓦片再铺字符，近处的鱼完整盖住远处的
    for (const f of FISH_ORDER) {
      const emerge = smoothstep(0, 1, f.emerge)
      const depth = clamp(f.depth, 0, 1)
      const tileAlpha = clamp(cfg.fish.tileAlpha * (0.62 + 0.38 * depth), 0, 1)
      const bodyAlpha = (0.55 + 0.45 * depth) * readingK
      ctx.save()
      const rise = (1 - emerge) * ch * 2.4
      if (rise > 0.05) ctx.translate(0, rise)

      for (let i = 0; i < f.count; i++) {
        const c = f.cells[i]
        if (!c.tile) continue
        let a = emerge * tileAlpha
        const dlev = dim[c.ry * cols + c.rx]
        if (dlev) a *= 1 - dlev * dimScale
        ctx.globalAlpha = a
        ctx.fillStyle = c.tile
        ctx.fillRect(c.rx * cw + 1, c.ry * ch + 1, cw - 1, ch - 1)
      }

      for (let i = 0; i < f.count; i++) {
        const c = f.cells[i]
        let a = emerge * bodyAlpha
        const dlev = dim[c.ry * cols + c.rx]
        if (dlev) a *= 1 - dlev * dimScale
        ctx.globalAlpha = a
        ctx.fillStyle = c.color
        ctx.fillText(c.glyph, c.rx * cw + cw * 0.5, c.ry * ch + ch * 0.5)
      }

      ctx.restore()
    }
    ctx.globalAlpha = 1

    if (S.pondVisible) {
      for (const b of WATER.bites) {
        const k = b.age / BITE_MS
        const gi = k < 0.33 ? 0 : k < 0.66 ? 1 : 2
        const rx = Math.floor((S.pondLeft + b.x) / cw)
        const ry = Math.floor((S.pondTop + b.y) / ch)
        if (rx < 0 || rx >= cols || ry < 0 || ry >= rows) continue
        const dlev = dim[ry * cols + rx]
        let a = readingK
        if (dlev) a *= 1 - dlev * dimScale
        ctx.globalAlpha = a
        ctx.fillStyle = BITE_COLORS[gi]
        ctx.fillText(BITE_GLYPHS[gi], rx * cw + cw * 0.5, ry * ch + ch * 0.5)
      }
    }
    ctx.globalAlpha = 1

    S.lit = lit
  }

  // ---------- 主循环 ----------
  function frameMs() {
    return 1000 / (S.isMobile ? 30 : 60)
  }

  function loop(now) {
    S.raf = 0
    if (!S.running || S.destroyed) return
    S.raf = requestAnimationFrame(loop)
    if (!S.visible) return
    if (!S.last) S.last = now
    const dt = Math.min((now - S.last) / 1000, 0.1)
    S.last = now
    S.acc += dt

    if (S.lastDraw && now - S.lastDraw < frameMs() - 2) return
    S.lastDraw = now

    let steps = 0
    while (S.acc >= STEP - 0.0015 && steps < 4) {
      S.time += STEP
      updateWorld(STEP)
      S.acc -= STEP
      steps++
    }
    if (!steps) return

    draw()
    S.frames++
    if (now - S.fpsT > 800) {
      S.fps = Math.round((S.frames * 1000) / (now - S.fpsT))
      S.frames = 0
      S.fpsT = now
    }
  }

  function start() {
    if (S.running || S.destroyed || reduced.matches) return
    S.running = true
    S.last = 0
    S.lastDraw = 0
    S.acc = 0
    S.raf = requestAnimationFrame(loop)
  }

  function stop() {
    S.running = false
    if (S.raf) cancelAnimationFrame(S.raf)
    S.raf = 0
  }

  function stillFrame() {
    stop()
    if (S.heroEl) {
      const warm = 240
      S.time = 12.5 - warm * STEP
      initFish()
      initWater()
      for (let i = 0; i < warm; i++) {
        S.time += STEP
        updateWorld(STEP)
      }
    }
    S.time = 21.4
    measureDim()
    updateDim()
    refreshField(true)
    draw()
  }

  function refresh() {
    if (S.destroyed) return
    if (reduced.matches) {
      stillFrame()
      return
    }
    refreshField(true)
    updateDim()
    draw()
  }

  // ---------- 输入 ----------
  function onPointerMove(e) {
    if (S.destroyed) return
    if (e.pointerType === 'touch' || reduced.matches) {
      POINTER.active = false
      POINTER.speed = 0
      return
    }
    if (e.target && e.target.closest && e.target.closest(PANEL_SELECTOR)) {
      POINTER.active = false
      POINTER.speed = 0
      return
    }
    const hero = S.heroEl
    if (!hero) {
      POINTER.active = false
      return
    }
    const r = hero.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      POINTER.active = false
      POINTER.speed = 0
      return
    }
    const now = performance.now()
    if (POINTER.active && POINTER.last) {
      const dt = Math.max(0.008, (now - POINTER.last) / 1000)
      const vx = (x - POINTER.x) / dt
      const vy = (y - POINTER.y) / dt
      POINTER.speed = Math.hypot(vx, vy)
      if (POINTER.speed > cfg.fish.startleSpeed) {
        let scared = 0
        for (const f of FISHES) {
          const d = Math.hypot(f.x - x, f.y - y)
          if (d < f.len * cfg.fish.startleReach) {
            f.startle = 1
            f.startleAngle = Math.atan2(f.y - y, f.x - x)
            scared++
            addWave(S.pondLeft + f.x, S.pondTop + f.y, { strength: 0.5, size: 0.8 })
          }
        }
        if (scared) POINTER.speed = 0
      }
    }
    POINTER.x = x
    POINTER.y = y
    POINTER.last = now
    POINTER.active = true
  }

  function onPointerLeave() {
    POINTER.active = false
    POINTER.speed = 0
  }

  function onPointerDown(e) {
    if (e.button !== 0 || e.defaultPrevented || S.destroyed) return
    if (reduced.matches) return
    const t = e.target
    if (
      t &&
      t.closest &&
      t.closest(
        'a, button, input, textarea, select, label, [contenteditable], .bgp, .theme-switcher-global, .site-header',
      )
    ) {
      return
    }
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && String(sel).trim()) return

    addWave(e.clientX, e.clientY, { strength: 1 })

    const hero = S.heroEl
    if (!hero) return
    const r = hero.getBoundingClientRect()
    if (
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    ) {
      feedAt(e.clientX - r.left, e.clientY - r.top)
    }
  }

  let scrollMeasureRaf = 0
  function onScroll() {
    if (scrollMeasureRaf) return
    scrollMeasureRaf = requestAnimationFrame(() => {
      scrollMeasureRaf = 0
      if (S.destroyed) return
      measureDim()
      updateDim()
      if (!S.running) draw()
    })
  }

  function onResize() {
    scheduleResize()
  }

  function onVisibility() {
    S.visible = !document.hidden
    POINTER.active = false
    POINTER.speed = 0
    if (document.hidden) {
      stop()
    } else {
      S.last = 0
      start()
    }
  }

  function onMotionChange(e) {
    if (e.matches) {
      stillFrame()
    } else if (S.visible) {
      S.last = 0
      start()
    }
  }

  // ---------- 启动 ----------
  applyTheme(cfg.theme)

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onPointerMove, { passive: true, signal })
    window.addEventListener('pointerdown', onPointerDown, { passive: true, signal })
    window.addEventListener('pointerleave', onPointerLeave, { signal })
    window.addEventListener('resize', onResize, { signal })
    window.addEventListener('scroll', onScroll, { passive: true, signal })
    document.addEventListener('visibilitychange', onVisibility, { signal })
    reduced.addEventListener('change', onMotionChange, { signal })
  }

  resize()

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (S.destroyed) return
      measureDim()
      updateDim()
      if (!S.running) draw()
    })
  }

  if (reduced.matches) stillFrame()
  else start()

  return {
    setOptions(next = {}) {
      if (S.destroyed) return
      const flags = mergeInto(cfg, next)

      if (flags.theme) applyTheme(cfg.theme)
      if (flags.field) {
        S.effDensity = cfg.waterDensity * (S.isMobile ? 0.85 : 1)
      }
      if (next.ripple === false) WATER.waves.length = 0
      if (flags.reading) updateReadingK()
      if (flags.fishCount) applyFishCount()
      if (flags.fishLength) {
        setFishLength()
        if (!S.running) for (const f of FISHES) rebuildSpine(f)
      }

      if (flags.resize) {
        scheduleResize()
        return
      }
      if (flags.field) refreshField(true)
      if (!S.running) {
        updateDim()
        draw()
      }
    },

    measure() {
      if (S.destroyed) return
      measureDim()
      updateDim()
      refreshField(true)
      if (!S.running) draw()
    },

    refresh,

    stats() {
      return {
        theme: cfg.theme,
        brush: cfg.brush,
        waveMode: cfg.waveMode,
        cols: S.cols,
        rows: S.rows,
        cell: S.cw,
        dpr: +S.dpr.toFixed(2),
        fish: FISHES.length,
        pond: {
          left: Math.round(S.pondLeft),
          top: Math.round(S.pondTop),
          w: Math.round(S.pondW),
          h: Math.round(S.pondH),
          visible: S.pondVisible,
        },
        dimBoxes: S.dimBoxes.length,
        avoidBoxes: S.avoidBoxes.length,
        waves: WATER.waves.length,
        pellets: WATER.pellets.length,
        wake: WATER.wake,
        readingK: S.readingK,
        reduced: reduced.matches,
        fps: S.fps,
        time: +S.time.toFixed(2),
      }
    },

    destroy() {
      if (S.destroyed) return
      S.destroyed = true
      stop()
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      if (scrollMeasureRaf) cancelAnimationFrame(scrollMeasureRaf)
      resizeRaf = 0
      scrollMeasureRaf = 0
      if (ac) ac.abort()
      WATER.waves.length = 0
      WATER.pellets.length = 0
      WATER.bites.length = 0
      FISHES.length = 0
      FISH_ORDER.length = 0
      S.dimBoxes = []
      S.avoidBoxes = []
    },
  }
}

export { WAVE_MODES as ASCII_BACKGROUND_WAVE_MODES }
