// ASCII 字符背景层引擎（纯 JS，不依赖 React）
//
// 定位：常驻背景，不是 hero。
//   · 没有视觉焦点：主光只做缓慢游移的大范围提亮，不做聚光
//   · 明度天花板压到 0.42 / 0.34，靠 presence 再调
//   · 正文区自动让路，强度按「内容区占屏比」缩放，窄屏不会被压空
//   · canvas 全透明，只画字符，底色交给 body —— 主题切换零同步成本
//
// 与原型（WorkBuddy/ascii/bg-layer）的差别：
//   1. alpha:false + fillRect → alpha:true + clearRect
//   2. 硬编码暖色 → 读站点 --text-h
//   3. colW/colX 写死 → measureSafe() 实测内容容器
//   4. 参数由 React 传入，不再读 URL / 键盘 / 面板
//   5. 暴露 destroy()，支持热更新与卸载

const MODES = ['density', 'halftone', 'block', 'line', 'dot']

// 梯度用满 10 级（含 # % @），层次全开；其余笔法按各自字符集能表达的级数来。
const R_DENSITY = ' .:-=+*#%@'
const R_HALFTONE = [' ', '.', ':', '#', '@']
const R_BLOCK = ' ░▒▓█'
const LINE_CH = ['─', '╲', '│', '╱']
const DOT_CH = ['·', '∙', '•']

// 渲染墨量的分档（0–7 档的 alpha 基准），对齐 bg-sampler 的显影强度。
// 浅色统一再乘 1.25，因为深墨落在浅纸上本身就比白字落在黑底上轻。
const BASE_ALPHA = [0, 0.06, 0.11, 0.17, 0.24, 0.33, 0.46, 0.62]
const LIGHT_ALPHA_K = 1.25
// 让路分八档：7 = 不压，0 = 内容柱正中。
// 档位要够密，否则让路的矩形边界会在大密度下显形成一块暗矩形。
// 让路既降档也降 alpha，但都不压到底 —— 正文区是「淡淡的纹理」而不是空白。
const DIM_K = [0.28, 0.36, 0.45, 0.54, 0.66, 0.78, 0.9, 1]
// 每种笔法的视觉重量补偿：积木与线描天生更抢眼
const MODE_K = [1, 0.95, 0.58, 0.74, 0.86]

// --text-h 读不到时的兜底，与 index.css 的两套主题一致
const FALLBACK_INK = {
  dark: '240,240,245',
  light: '23,25,35',
}

// 暖版整套配色，取自 bg-layer：纸 + 墨 + 暖点三件一起才叫「白偏黄 / 黑金」
const WARM_INK = { dark: '222,217,207', light: '27,26,23' }
const WARM_MOTE = { dark: '196,113,63', light: '164,80,42' }
const WARM_PAPER = { dark: '#0a0b0b', light: '#f4f1ea' }

// 4×4 有序抖动矩阵（0–15）。2×2 只有 4 级，半调用它只能出「有/无」两态，
// 换成 4×4 才有 16 级疏密，网点才有过渡。
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

// 阈值抖动表（±0.03）。背景的明暗来自 fbm，阈值化后会在网格上留下
// 一圈「台阶」硬边；逐格加一点固定随机偏移，边界就碎成颗粒。
// 固定种子而非 Math.random：每帧必须一致，否则画面会抖。
const DITHER = (() => {
  const t = new Float32Array(256)
  let r = 7
  for (let i = 0; i < 256; i++) {
    r = (r * 16807) % 2147483647
    t[i] = (r / 2147483647 - 0.5) * 0.06
  }
  return t
})()

// " #f0f0f5" / "rgb(240, 240, 245)" → "240,240,245"
export function toRgbTriplet(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1]
    const full =
      h.length === 3
        ? h
            .split('')
            .map(c => c + c)
            .join('')
        : h
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ].join(',')
  }

  const rgb = raw.match(/rgba?\(([^)]+)\)/i)
  if (rgb) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map(Number)
    if (parts.length === 3 && parts.every(Number.isFinite)) return parts.join(',')
  }

  return ''
}

export function createAsciiBackground(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return {
      destroy() {},
      setOptions() {},
      measure() {},
      refresh() {},
      stats: () => null,
    }
  }

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) {
    return {
      destroy() {},
      setOptions() {},
      measure() {},
      refresh() {},
      stats: () => null,
    }
  }

  const S = {
    mode: 4, // 点阵：最轻，最适合常驻
    presence: 1,
    yieldK: 0.58,
    yieldEff: 0.58,
    density: 1,
    pointer: 'yield',
    ripple: true,
    motes: true,
    keyLight: true,
    lightK: 1, // 光强：主光 / 指针 / 涟漪的公共倍数
    flow: 0.95, // 流速：1 = bg-sampler 的原始速度
    palette: 'warm', // 暖版 / site（跟随站点 --text-h）
    theme: 'dark',
    fontFamily: '"SF Mono", "Fira Code", Menlo, monospace',
  }

  // ink = 字符墨色；mote = 暖色浮尘；paper = 铺在 canvas 上的纸色（空串 = 透明）
  let ink = WARM_INK.dark
  let mote = WARM_MOTE.dark
  let paper = WARM_PAPER.dark

  let W = 0
  let H = 0
  let dpr = 1
  let cw = 12
  let ch = 18
  let cols = 0
  let rows = 0
  let bright = new Float32Array(0)
  let dimGrid = new Uint8Array(0) // 让路因子，量化成 0–3 四档，绘制时乘到 alpha 上
  let glyph = new Int32Array(0)
  let level = new Int32Array(0)
  let attenRow = new Float32Array(0)
  let chars = []

  // 内容区（背景是 fixed，滚动不影响它的水平位置）
  let safeEl = null
  let colX = 0
  let colW = 0

  const ptr = { x: 0, y: 0, tx: 0, ty: 0, inside: false }
  const waves = []
  let motes = []

  let time = 0
  let paused = false
  let visible = typeof document === 'undefined' ? true : !document.hidden
  let raf = 0
  let last = 0
  let acc = 0

  let reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- 噪声 ----------
  const PERM = new Uint8Array(512)
  ;(() => {
    const p = []
    for (let i = 0; i < 256; i++) p[i] = i
    let r = 1
    for (let i = 255; i > 0; i--) {
      r = (r * 16807) % 2147483647
      const j = r % (i + 1)
      const t = p[i]
      p[i] = p[j]
      p[j] = t
    }
    for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]
  })()

  function grad(h, x, y) {
    switch (h & 3) {
      case 0:
        return x + y
      case 1:
        return -x + y
      case 2:
        return x - y
      default:
        return -x - y
    }
  }

  const lerp = (a, b, t) => a + (b - a) * t

  function pnoise(x, y) {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const X = xi & 255
    const Y = yi & 255
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    const aa = PERM[PERM[X] + Y]
    const ba = PERM[PERM[X + 1] + Y]
    const ab = PERM[PERM[X] + Y + 1]
    const bb = PERM[PERM[X + 1] + Y + 1]
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u)
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u)
    return lerp(x1, x2, v) * 0.5 + 0.5
  }

  function fbm(x, y) {
    let s = 0
    let amp = 0.5
    let f = 1
    for (let i = 0; i < 4; i++) {
      s += pnoise(x * f, y * f) * amp
      f *= 2.03
      amp *= 0.5
    }
    const o = s / 0.9375
    return o < 0 ? 0 : o > 1 ? 1 : o
  }

  function smooth(t) {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return t * t * (3 - 2 * t)
  }

  // ---------- 主题墨色 ----------
  function readInk() {
    const key = S.theme === 'light' ? 'light' : 'dark'

    // 暖版是成套的纸 + 墨 + 光点，缺一样都会退化成「脏灰」
    if (S.palette === 'warm') {
      ink = WARM_INK[key]
      mote = WARM_MOTE[key]
      paper = WARM_PAPER[key]
      return
    }

    paper = ''
    let parsed = ''
    if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
      parsed = toRgbTriplet(
        getComputedStyle(document.documentElement).getPropertyValue('--text-h'),
      )
    }
    ink = parsed || FALLBACK_INK[key]
    mote = ink
  }

  // 主题属性由 Provider 在 effect 里写，晚于本组件的 effect，所以推迟一帧读
  function scheduleInkRead() {
    if (typeof requestAnimationFrame !== 'function') {
      readInk()
      return
    }
    requestAnimationFrame(() => {
      readInk()
      refresh()
    })
  }

  // ---------- 尺寸与让路 ----------
  function syncYield() {
    const ratio = W > 0 ? colW / W : 0
    const scale = Math.min(1, Math.max(0.14, (1 - ratio) / 0.5))
    S.yieldEff = S.yieldK * scale
  }

  function buildAtten() {
    const topH = 92
    const botH = 96
    const featherY = 90

    for (let ry = 0; ry < rows; ry++) {
      const y = ry * ch + ch * 0.5
      const dy = Math.max(topH - y, 0, y - (H - botH))
      const k = smooth(Math.min(dy, featherY) / featherY)
      attenRow[ry] = 1 - S.yieldEff * 0.85 * k
    }
  }

  function colAtten(x) {
    const feather = 120
    const d = Math.max(colX - x, 0, x - (colX + colW))
    if (d >= feather) return 1
    return 1 - S.yieldEff + S.yieldEff * smooth(d / feather)
  }

  function resize() {
    if (typeof window === 'undefined') return

    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight

    // 格子尺寸决定「像不像 ASCII」：sampler 是 120 列、12px 格，
    // 这个尺寸下 # % @ 才认得出字形。8px 只会糊成一层噪点。
    cw = Math.max(7, Math.min(14, Math.round(W / 120)))
    ch = Math.round(cw * 1.5)
    cols = Math.ceil(W / cw)
    rows = Math.ceil(H / ch)

    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const n = cols * rows
    bright = new Float32Array(n)
    dimGrid = new Uint8Array(n)
    glyph = new Int32Array(n)
    level = new Int32Array(n)
    attenRow = new Float32Array(rows)

    measureSafe()
    initMotes()
    refresh()
  }

  // 内容区宽度：四个页面各不相同（1052 / 980 / 800 / 820），必须实测
  function measureSafe() {
    const el =
      (typeof safeEl === 'function' ? safeEl() : safeEl) ||
      (typeof document !== 'undefined' ? document.querySelector('.main > *') : null) ||
      (typeof document !== 'undefined' ? document.querySelector('.main') : null)

    let nextX
    let nextW

    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect()
      nextW = r.width
      nextX = r.left
    }

    // 测不到（首帧、路由切换中）或宽度异常时退化：居中的 62%
    if (!Number.isFinite(nextW) || nextW < 40) {
      nextW = W * 0.62
      nextX = (W - nextW) / 2
    }

    colX = nextX
    colW = nextW

    syncYield()
    buildAtten()
  }

  // ---------- 场 ----------
  const T_SPEED = 0.42

  function buildField(t) {
    const tt = t * T_SPEED * S.flow
    const driftX = tt * 5
    const driftY = tt * 2.6
    const px = ptr.x
    const py = ptr.y
    const rc = 0.94
    const rs = 0.34
    const lensR2 = 2 * 150 * 150
    const pm = S.pointer
    const usePtr = ptr.inside && pm !== 'off'

    let mx = 0
    let my = 0
    let lightR2 = 1
    if (S.keyLight) {
      // 光心放在两侧留白里较宽的一侧，半径跟着留白宽度走。
      // 放中间会被让路削成矩形暗块；放太大又会把 # @ 推到正文后面。
      const leftGap = colX
      const rightGap = Math.max(0, W - colX - colW)
      const onRight = rightGap >= leftGap
      const gap = Math.max(80, onRight ? rightGap : leftGap)
      const base = colW ? (onRight ? colX + colW + gap * 0.5 : gap * 0.5) : W * 0.62
      mx = base + Math.sin(tt * 0.06) * gap * 0.16
      my = H * (0.43 + 0.07 * Math.sin(tt * 0.05))
      const lr = colW ? Math.min(gap * 1.15, 430) : Math.min(W, H) * 0.55
      lightR2 = 2 * lr * lr
    }

    const nw = waves.length
    const dens = S.density
    const lk = S.lightK
    // 峰值要能顶到 1，否则最高那三档字符（# % @）永远排不上用场
    const keyK = 0.52 * lk

    for (let ry = 0; ry < rows; ry++) {
      const y = ry * ch + ch * 0.5
      const ay = attenRow[ry]

      for (let rx = 0; rx < cols; rx++) {
        const x = rx * cw + cw * 0.5

        const nx = (x + driftX) * 0.0028
        const ny = (y + driftY) * 0.0028
        const qx = (nx * rc - ny * rs) * 0.74
        const qy = (nx * rs + ny * rc) * 1.28

        let v = fbm(qx, qy)

        // 注意：这里不再做「阈值拉伸 + 平方」。
        // 那一步会把中间灰阶整段压掉，一屏只剩有字 / 没字两态 ——
        // 负空间改由字符表首位那个空格承担，和 bg-sampler 一致。

        if (S.keyLight) {
          const kx = x - mx
          const ky = y - my
          const g = Math.exp(-(kx * kx + ky * ky) / lightR2)
          v += keyK * g
        }

        if (usePtr) {
          const dx = x - px
          const dy2 = y - py
          const g = Math.exp(-(dx * dx + dy2 * dy2) / lensR2)
          if (pm === 'light') v += 0.42 * lk * g * (1 - v)
          else v *= 1 - 0.2 * g
        }

        if (nw) {
          for (let i = 0; i < nw; i++) {
            const w = waves[i]
            const age = t - w.t0
            if (age < 0 || age > 3.2) continue
            const wx = x - w.x
            const wy = y - w.y
            const dist = Math.sqrt(wx * wx + wy * wy)
            const ring = dist - age * 260
            v +=
              0.32 *
              lk *
              Math.exp(-(ring * ring) / 7200) *
              Math.exp(-age * 1.1) *
              (1 - v)
          }
        }

        if (dens !== 1) v *= dens

        // 连续灰阶塑形：压暗低值、保住高光，10 级 ramp 才用得上全部档位
        v = Math.pow(v > 0 ? v : 0, 1.78)

        // 让路：既降档也降 alpha，但档位只压一半 ——
        // 全压会让正文区干脆空掉（少了 sampler 那种「字还在、只是很淡」的质感），
        // 不压又会让主光把 # @ 推到正文后面。取中间：字符降一到两档，再淡下去。
        const a = ay * colAtten(x)
        const idx = ry * cols + rx
        dimGrid[idx] = a >= 0.995 ? 7 : Math.min(7, Math.round(a * 7))
        if (a < 1) v *= 0.35 + 0.65 * a
        bright[idx] = v > 1 ? 1 : v < 0 ? 0 : v
      }
    }
  }

  // ---------- 五种笔法 ----------
  function stylize(mode) {
    const n = cols * rows

    if (mode === 0) {
      chars = R_DENSITY.split('')
      const last = chars.length - 1
      for (let i = 0; i < n; i++) {
        const b = bright[i]
        // 首位是空格：低值区自然消失，不需要再拿阈值去砍密度
        glyph[i] = Math.round(b * last)
        level[i] = b < 0.015 ? 0 : Math.min(7, Math.max(1, Math.round(b * 7)))
      }
      return
    }

    if (mode === 1) {
      // 疏密由 4×4 Bayer 决定（16 级），字符由亮度分段决定 ——
      // 两层叠加，网点才有「由疏到密、由细到重」的连续感
      chars = R_HALFTONE
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const i = ry * cols + rx
          const b = bright[i]
          const th = (BAYER4[(ry & 3) * 4 + (rx & 3)] + 0.5) / 16
          if (b <= th * 0.94) {
            glyph[i] = 0
            level[i] = 0
          } else {
            // 疏密管「有没有点」，alpha 管「多亮」——两层都要连续
            glyph[i] = b < 0.3 ? 1 : b < 0.58 ? 2 : b < 0.84 ? 3 : 4
            level[i] = Math.min(7, Math.max(2, Math.round(b * 7)))
          }
        }
      }
      return
    }

    if (mode === 2) {
      chars = R_BLOCK.split('')
      for (let i = 0; i < n; i++) {
        const b = bright[i]
        const k = b < 0.09 ? 0 : b < 0.26 ? 1 : b < 0.48 ? 2 : b < 0.72 ? 3 : 4
        glyph[i] = k
        level[i] = b < 0.09 ? 0 : Math.min(7, Math.max(1, Math.round(b * 7)))
      }
      return
    }

    if (mode === 3) {
      chars = LINE_CH.slice()
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const i = ry * cols + rx
          const b = bright[i]

          const xm = rx > 0 ? i - 1 : i
          const xp = rx < cols - 1 ? i + 1 : i
          const ym = ry > 0 ? i - cols : i
          const yp = ry < rows - 1 ? i + cols : i
          const gx = bright[xp] - bright[xm]
          const gy = bright[yp] - bright[ym]
          const mag = Math.hypot(gx, gy)

          const band = b * 5.2
          const onBand = Math.abs(band - Math.round(band)) < 0.16

          if (mag < 0.01 || !onBand || b < 0.07) {
            glyph[i] = 0
            level[i] = 0
          } else {
            const ang = Math.atan2(gy, gx) + Math.PI / 2
            const oct = (((ang / Math.PI) * 4) % 4 + 4) % 4
            glyph[i] = Math.round(oct) % 4
            level[i] = Math.min(7, 3 + Math.round(b * 4))
          }
        }
      }
      return
    }

    chars = DOT_CH.slice()
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const i = ry * cols + rx
        const b = bright[i] + DITHER[(ry * 17 + rx * 5) & 255]
        // 满屏铺底、靠轻重表达明暗；只有真正接近全黑的地方才留白。
        // 字符只分四档，但 alpha 跟着亮度连续走 —— 否则光团中心会糊成一块死白。
        if (b < 0.018) {
          glyph[i] = 0
          level[i] = 0
        } else {
          glyph[i] = b < 0.22 ? 0 : b < 0.52 ? 1 : 2
          level[i] = Math.min(7, Math.max(1, Math.round(b * 7)))
        }
      }
    }
  }

  // ---------- 浮尘 ----------
  function initMotes() {
    motes = []
    const n = Math.round((W * H) / 9000)
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        amp: 8 + Math.random() * 26,
        sp: 0.05 + Math.random() * 0.12,
        ph: Math.random() * Math.PI * 2,
        rise: 3 + Math.random() * 9,
        big: Math.random() < 0.16,
        warm: Math.random() < 0.09,
      })
    }
  }

  function attenAt(x, y) {
    const ry = Math.floor(y / ch)
    const ay = ry >= 0 && ry < rows ? attenRow[ry] : 1
    return ay * colAtten(x)
  }

  function drawMotes(t) {
    if (!S.motes || !motes.length) return

    const span = H + 120
    // 浮尘是「空气感」的来源，比字符更怕看不见；光强对它只做有限放大。
    const k = S.presence * (S.theme === 'light' ? 0.85 : 1) * Math.min(1.3, S.lightK)
    const cold = 'rgba(' + ink + ',1)'
    // 少数暖点用铜色，不再拿墨色的半透明冒充 —— 那是「黑金」的一半来源
    const warm = 'rgba(' + mote + ',1)'
    let cur = ''

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = Math.round(ch * 1.05) + 'px ' + S.fontFamily

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i]
      let y = m.y - ((t * m.rise) % span)
      if (y < -60) y += span
      const x = m.x + Math.sin(t * m.sp + m.ph) * m.amp

      const d = attenAt(x, y)
      if (d < 0.25) continue

      const tw = 0.55 + 0.45 * Math.sin(t * 1.1 + m.ph * 3.1)
      ctx.globalAlpha = (m.warm ? 0.3 + 0.55 * tw : 0.22 + 0.5 * tw) * d * k

      const want = m.warm ? warm : cold
      if (want !== cur) {
        ctx.fillStyle = want
        cur = want
      }

      ctx.fillText(m.big ? '•' : '·', x, y)
    }
    ctx.globalAlpha = 1
  }

  // ---------- 绘制 ----------
  // 不再有 capFor 那道人为天花板：显影强度直接由 presence × 笔法系数决定，
  // 1.0 就等于 bg-sampler 的原强度。
  function gainNow() {
    const screenK = W < 700 ? 0.78 : 1
    return S.presence * MODE_K[S.mode] * screenK
  }

  function draw() {
    const dark = S.theme !== 'light'
    const gain = gainNow()
    const lightK = dark ? 1 : LIGHT_ALPHA_K

    // 暖版要在 canvas 上铺纸，跟站点时保持透明（底色留给 body）
    if (paper) {
      ctx.fillStyle = paper
      ctx.fillRect(0, 0, W, H)
    } else {
      ctx.clearRect(0, 0, W, H)
    }

    // 所有笔法同一个字号：点阵放大到 1.0 会在浅色下糊成一片灰块。
    ctx.font = Math.round(ch * 0.82) + 'px ' + S.fontFamily
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 单遍绘制：同一行里档位是连续变化的，换 fillStyle 的次数远少于格子数。
    // 原来的「七档各扫一遍全网格」在 180×75 下要空转 7 次，是帧时间的大头。
    const alphaOf = new Float32Array(64) // [档位 * 8 + 让路档]
    for (let lv = 1; lv < 8; lv++) {
      const base = Math.min(0.92, BASE_ALPHA[lv] * gain * lightK)
      for (let d = 0; d < 8; d++) {
        alphaOf[lv * 8 + d] = base * DIM_K[d]
      }
    }

    let curKey = -1
    for (let ry = 0; ry < rows; ry++) {
      const cy = ry * ch + ch * 0.5
      for (let rx = 0; rx < cols; rx++) {
        const i = ry * cols + rx
        const lv = level[i]
        if (lv === 0) continue
        const g = chars[glyph[i]]
        if (!g || g === ' ') continue
        const key = lv * 8 + dimGrid[i]
        if (key !== curKey) {
          const a = alphaOf[key]
          if (a <= 0.002) {
            curKey = key
            continue
          }
          ctx.fillStyle = 'rgba(' + ink + ',' + a.toFixed(3) + ')'
          curKey = key
        }
        ctx.fillText(g, rx * cw + cw * 0.5, cy)
      }
    }

    drawMotes(time * T_SPEED)
  }

  function refresh() {
    if (!cols || !rows) return
    if (reduced) {
      stillFrame()
      return
    }
    buildField(time)
    stylize(S.mode)
    draw()
  }

  function stillFrame() {
    time = 21.4
    ptr.inside = false
    buildField(time)
    stylize(S.mode)
    draw()
  }

  // ---------- 主循环 ----------
  const fps = options.fps || 24
  const frameMs = 1000 / fps

  function loop(now) {
    raf = requestAnimationFrame(loop)
    if (!visible) return
    if (!last) last = now
    const dt = Math.min(now - last, 100)
    last = now
    if (paused) return

    acc += dt
    if (acc < frameMs) return
    time += Math.min(acc, 200) / 1000
    acc = 0

    ptr.x += (ptr.tx - ptr.x) * 0.08
    ptr.y += (ptr.ty - ptr.y) * 0.08

    for (let i = waves.length - 1; i >= 0; i--) {
      if (time - waves[i].t0 > 3.4) waves.splice(i, 1)
    }

    buildField(time)
    stylize(S.mode)
    draw()
  }

  // ---------- 输入 ----------
  function onPointerMove(e) {
    const inCol = e.clientX > colX - 20 && e.clientX < colX + colW + 20
    const want = S.pointer === 'light' ? true : !inCol

    ptr.tx = e.clientX
    ptr.ty = e.clientY

    if (want && !ptr.inside) {
      ptr.x = ptr.tx
      ptr.y = ptr.ty
    }
    ptr.inside = want
  }

  function onPointerDown(e) {
    // reduced-motion 下没有 rAF 循环，收下涟漪也画不出来，直接不记
    if (!S.ripple || reduced) return
    const t = e.target
    if (
      t &&
      t.closest &&
      t.closest('a, button, input, textarea, select, label, [contenteditable]')
    ) {
      return
    }
    waves.push({ x: e.clientX, y: e.clientY, t0: time })
  }

  let resizeRaf = 0
  function onResize() {
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      resize()
    })
  }

  function onVisibility() {
    visible = !document.hidden
    last = 0
  }

  const mq =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null

  function onMotionChange(e) {
    reduced = e.matches
    if (reduced) {
      stillFrame()
    } else {
      last = 0
    }
  }

  // ---------- 启动 ----------
  if (options.safeEl) safeEl = options.safeEl
  if (typeof options.mode === 'string') {
    const idx = MODES.indexOf(options.mode)
    if (idx >= 0) S.mode = idx
  } else if (Number.isInteger(options.mode)) {
    S.mode = Math.min(MODES.length - 1, Math.max(0, options.mode))
  }
  if (Number.isFinite(options.presence)) S.presence = options.presence
  if (Number.isFinite(options.yieldK)) S.yieldK = options.yieldK
  if (Number.isFinite(options.density)) S.density = options.density
  if (options.pointer) S.pointer = options.pointer
  if (typeof options.ripple === 'boolean') S.ripple = options.ripple
  if (typeof options.motes === 'boolean') S.motes = options.motes
  if (typeof options.keyLight === 'boolean') S.keyLight = options.keyLight
  if (Number.isFinite(options.lightK)) S.lightK = options.lightK
  if (Number.isFinite(options.flow)) S.flow = Math.min(2, Math.max(0.2, options.flow))
  if (options.palette === 'warm' || options.palette === 'site') S.palette = options.palette
  if (options.theme) S.theme = options.theme
  if (options.fontFamily) S.fontFamily = options.fontFamily

  ink = FALLBACK_INK[S.theme] || FALLBACK_INK.dark

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', onMotionChange)
      else if (mq.addListener) mq.addListener(onMotionChange)
    }
  }

  resize()
  scheduleInkRead()

  if (reduced) stillFrame()
  else raf = requestAnimationFrame(loop)

  // 首屏内容还没挂上时，等一帧再测一次内容区
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      measureSafe()
      refresh()
    })
  }

  return {
    setOptions(next = {}) {
      let themeChanged = false

      if (next.mode !== undefined) {
        const idx =
          typeof next.mode === 'string' ? MODES.indexOf(next.mode) : Number(next.mode)
        if (Number.isInteger(idx) && idx >= 0 && idx < MODES.length) S.mode = idx
      }
      if (Number.isFinite(next.presence)) S.presence = next.presence
      if (Number.isFinite(next.density)) S.density = next.density
      if (Number.isFinite(next.yieldK)) {
        S.yieldK = next.yieldK
        syncYield()
        buildAtten()
      }
      if (next.pointer) S.pointer = next.pointer
      if (typeof next.ripple === 'boolean') {
        S.ripple = next.ripple
        if (!next.ripple) waves.length = 0
      }
      if (typeof next.motes === 'boolean') S.motes = next.motes
      if (typeof next.keyLight === 'boolean') S.keyLight = next.keyLight
      if (Number.isFinite(next.lightK)) S.lightK = next.lightK
      if (Number.isFinite(next.flow)) S.flow = Math.min(2, Math.max(0.2, next.flow))
      if (next.palette === 'warm' || next.palette === 'site') {
        if (next.palette !== S.palette) {
          S.palette = next.palette
          themeChanged = true
        }
      }
      if (typeof next.paused === 'boolean') {
        paused = next.paused
        last = 0
      }
      if (next.safeEl) safeEl = next.safeEl
      if (next.theme && next.theme !== S.theme) {
        S.theme = next.theme
        themeChanged = true
      }

      if (themeChanged) scheduleInkRead()
      // 这里不重测布局：滑块拖动时每帧读 getBoundingClientRect 会强制回流，
      // 内容区宽度变化由路由 effect 调 measure() 负责。
      refresh()
    },

    measure() {
      // 路由切换 / 内容容器变化时重测，不重建缓冲
      if (!cols || !rows) return
      measureSafe()
      refresh()
    },

    refresh,

    stats() {
      let used = 0
      let maxGlyph = 0
      for (let i = 0; i < level.length; i++) {
        if (level[i] > 0) {
          used++
          if (glyph[i] > maxGlyph) maxGlyph = glyph[i]
        }
      }
      return {
        mode: MODES[S.mode],
        cols,
        rows,
        cell: cw,
        density: cols && rows ? +(used / (cols * rows)).toFixed(3) : 0,
        presence: S.presence,
        lightK: S.lightK,
        flow: S.flow,
        palette: S.palette,
        paper: paper || 'none',
        ink,
        ramp: chars.length,
        maxGlyph, // 本帧用到的最重字符索引：梯度恒为 10 时说明 @ 真的出现了
        yieldK: S.yieldK,
        yieldEff: +S.yieldEff.toFixed(3),
        colX: Math.round(colX),
        colW: Math.round(colW),
        theme: S.theme,
        // 下面三项是「特效真的在跑」的硬证据，验收时不必靠肉眼
        waves: waves.length,
        motes: motes.length,
        keyLight: S.keyLight,
        ripple: S.ripple,
        // reduced-motion 下应该看到 reduced:true 且 time 永远停在 21.4
        reduced,
        time: +time.toFixed(2),
      }
    },

    // 内容区内外平均亮度比：让路是否真的生效，看这个数。
    // 必须乘上 dimGrid，否则量到的是「未让路」的场，反而看不出差别。
    profile() {
      let inSum = 0
      let inN = 0
      let outSum = 0
      let outN = 0
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const x = rx * cw + cw * 0.5
          const i = ry * cols + rx
          const v = bright[i] * DIM_K[dimGrid[i]]
          if (x > colX && x < colX + colW) {
            inSum += v
            inN++
          } else {
            outSum += v
            outN++
          }
        }
      }
      const inside = inN ? inSum / inN : 0
      const outside = outN ? outSum / outN : 0
      return {
        inside: +inside.toFixed(3),
        outside: +outside.toFixed(3),
        ratio: outside > 0 ? +(inside / outside).toFixed(2) : 0,
      }
    },

    destroy() {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)
        if (mq) {
          if (mq.removeEventListener) mq.removeEventListener('change', onMotionChange)
          else if (mq.removeListener) mq.removeListener(onMotionChange)
        }
      }
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      resizeRaf = 0
      waves.length = 0
      motes = []
    },
  }
}

export { MODES as ASCII_BACKGROUND_MODES }
