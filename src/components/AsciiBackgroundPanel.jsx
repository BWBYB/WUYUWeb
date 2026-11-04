import { useEffect, useRef, useState } from 'react'
import {
  BACKGROUND_BRUSHES,
  BACKGROUND_MODES,
  BACKGROUND_RANGES,
  WAVE_LABELS,
  WAVE_MODES,
} from './ui/background-settings'
import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import './AsciiBackgroundPanel.css'

const MODE_LABEL = { ascii: '字符', aurora: '极光', none: '无' }
const BRUSH_LABEL = { gradient: '梯度', block: '积木' }

const pct = value => `${Math.round(value * 100)}%`
const times = value => `${value.toFixed(2)}×`
const cells = value => `${value} 格`

const WATER_ROWS = [
  {
    type: 'range',
    path: ['waveSpeed'],
    label: '波动速度',
    range: BACKGROUND_RANGES.waveSpeed,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['waterDensity'],
    label: '水纹密度',
    range: BACKGROUND_RANGES.waterDensity,
    step: 0.01,
    format: pct,
  },
  {
    type: 'range',
    path: ['waterLimit'],
    label: '水纹档位',
    range: BACKGROUND_RANGES.waterLimit,
    step: 1,
    format: value => `${value} / 10`,
  },
  {
    type: 'range',
    path: ['presence'],
    label: '水体强度',
    range: BACKGROUND_RANGES.presence,
    step: 0.05,
    format: pct,
  },
  {
    type: 'range',
    path: ['amplitude'],
    label: '波幅',
    range: BACKGROUND_RANGES.amplitude,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['wavelength'],
    label: '波长',
    range: BACKGROUND_RANGES.wavelength,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['direction'],
    label: '流向',
    range: BACKGROUND_RANGES.direction,
    step: 5,
    format: value => `${Math.round(value)}°`,
  },
  {
    type: 'range',
    path: ['turbulence'],
    label: '紊乱度',
    range: BACKGROUND_RANGES.turbulence,
    step: 0.05,
    format: times,
  },
  {
    type: 'toggle',
    path: ['ripple'],
    label: '点击涟漪',
  },
  {
    type: 'range',
    path: ['rippleSize'],
    label: '涟漪大小',
    range: BACKGROUND_RANGES.rippleSize,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['rippleSpread'],
    label: '涟漪扩散',
    range: BACKGROUND_RANGES.rippleSpread,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['rippleDecay'],
    label: '涟漪衰减',
    range: BACKGROUND_RANGES.rippleDecay,
    step: 0.05,
    format: times,
  },
]

const FISH_ROWS = [
  {
    type: 'range',
    path: ['fish', 'count'],
    label: '鱼群数量',
    range: BACKGROUND_RANGES.fish.count,
    step: 1,
    format: value => `${value} 条`,
  },
  {
    type: 'range',
    path: ['fish', 'lengthMin'],
    label: '最小体长',
    range: BACKGROUND_RANGES.fish.lengthMin,
    step: 1,
    format: cells,
  },
  {
    type: 'range',
    path: ['fish', 'lengthMax'],
    label: '最大体长',
    range: BACKGROUND_RANGES.fish.lengthMax,
    step: 1,
    format: cells,
  },
  {
    type: 'range',
    path: ['fish', 'lengthVariation'],
    label: '体型差异',
    range: BACKGROUND_RANGES.fish.lengthVariation,
    step: 0.05,
    format: pct,
  },
  {
    type: 'range',
    path: ['fish', 'swimSpeed'],
    label: '巡游速度',
    range: BACKGROUND_RANGES.fish.swimSpeed,
    step: 2,
    format: value => `${value} px/s`,
  },
  {
    type: 'range',
    path: ['fish', 'curiosityRadius'],
    label: '好奇半径',
    range: BACKGROUND_RANGES.fish.curiosityRadius,
    step: 10,
    format: value => `${value} px`,
  },
  {
    type: 'range',
    path: ['fish', 'startleSpeed'],
    label: '惊逃阈值',
    range: BACKGROUND_RANGES.fish.startleSpeed,
    step: 50,
    format: value => `${value} px/s`,
  },
  {
    type: 'range',
    path: ['fish', 'startleReach'],
    label: '惊逃距离',
    range: BACKGROUND_RANGES.fish.startleReach,
    step: 0.1,
    format: value => `${value.toFixed(1)}× 体长`,
  },
  {
    type: 'range',
    path: ['fish', 'emergeDuration'],
    label: '浮现时长',
    range: BACKGROUND_RANGES.fish.emergeDuration,
    step: 0.1,
    format: value => `${value.toFixed(1)} s`,
  },
  {
    type: 'range',
    path: ['fish', 'tileAlpha'],
    label: '鱼瓦片透明度',
    range: BACKGROUND_RANGES.fish.tileAlpha,
    step: 0.01,
    format: pct,
  },
  {
    type: 'range',
    path: ['fish', 'shadowAlpha'],
    label: '鱼影浓度',
    range: BACKGROUND_RANGES.fish.shadowAlpha,
    step: 0.01,
    format: pct,
  },
]

const SCREEN_ROWS = [
  {
    type: 'range',
    path: ['dimStrength'],
    label: '文字压暗',
    range: BACKGROUND_RANGES.dimStrength,
    step: 0.05,
    format: pct,
  },
  {
    type: 'toggle',
    path: ['readingDim'],
    label: '阅读页减淡',
  },
]

const ADVANCED_ROWS = [
  {
    type: 'range',
    path: ['advanced', 'fbmOctaves'],
    label: '噪声层数',
    range: BACKGROUND_RANGES.advanced.fbmOctaves,
    step: 1,
    format: value => `${value} 层`,
  },
  {
    type: 'range',
    path: ['advanced', 'noiseScale'],
    label: '噪声尺度',
    range: BACKGROUND_RANGES.advanced.noiseScale,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['advanced', 'gamma'],
    label: '明暗曲线',
    range: BACKGROUND_RANGES.advanced.gamma,
    step: 0.05,
    format: value => value.toFixed(2),
  },
  {
    type: 'range',
    path: ['advanced', 'cellK'],
    label: '字符尺寸',
    range: BACKGROUND_RANGES.advanced.cellK,
    step: 0.05,
    format: times,
  },
  {
    type: 'range',
    path: ['advanced', 'pixelBudget'],
    label: '像素预算',
    range: BACKGROUND_RANGES.advanced.pixelBudget,
    step: 1,
    format: value => `${value} MP`,
  },
]

function getValue(settings, path) {
  return path.reduce((value, key) => value?.[key], settings)
}

function RangeRow({ row, value, onChange }) {
  return (
    <div className="bgp__row">
      <b>{row.label}</b>
      <div className="bgp__meter">
        <input
          type="range"
          min={row.range[0]}
          max={row.range[1]}
          step={row.step}
          value={value}
          aria-label={row.label}
          onChange={event => onChange(Number(event.target.value))}
        />
        <output>{row.format(value)}</output>
      </div>
    </div>
  )
}

function ToggleRow({ row, value, onChange }) {
  return (
    <div className="bgp__row">
      <b>{row.label}</b>
      <button type="button" aria-pressed={value} onClick={() => onChange(!value)}>
        {value ? '开' : '关'}
      </button>
    </div>
  )
}

// 右下角一颗几乎看不见的入口。背景是常驻物，参数不该占用正文空间。
export default function AsciiBackgroundPanel({ settings, onChange, onReset }) {
  const { resolvedTheme } = useThemeSwitcherTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        dotRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = event => {
      const tag = event.target?.tagName || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key === ',' || event.key === '，') {
        event.preventDefault()
        setOpen(current => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isAscii = settings.mode === 'ascii'

  const setValue = (path, value) => {
    if (path.length === 1) {
      onChange({ [path[0]]: value })
      return
    }
    onChange({ [path[0]]: { [path[1]]: value } })
  }

  const renderRow = row => {
    const value = getValue(settings, row.path)
    if (row.type === 'toggle') {
      return (
        <ToggleRow
          key={row.path.join('.')}
          row={row}
          value={value}
          onChange={next => setValue(row.path, next)}
        />
      )
    }
    return (
      <RangeRow
        key={row.path.join('.')}
        row={row}
        value={value}
        onChange={next => setValue(row.path, next)}
      />
    )
  }

  return (
    <div className="bgp" ref={rootRef}>
      {open && (
        <div className="bgp__panel" role="dialog" aria-label="背景设置">
          <div className="bgp__group">纸色</div>
          <div className="bgp__row">
            <b>仅白天模式</b>
            <button
              type="button"
              onClick={() => onChange({ paper: false })}
              aria-pressed={!settings.paper}
              disabled={resolvedTheme !== 'light'}
            >
              关闭
            </button>
            <button
              type="button"
              onClick={() => onChange({ paper: true })}
              aria-pressed={settings.paper}
              disabled={resolvedTheme !== 'light'}
            >
              纸色
            </button>
          </div>
          <div className="bgp__row">
            <b>程度</b>
            <div className="bgp__meter">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.paperStrength}
                aria-label="纸色程度"
                disabled={resolvedTheme !== 'light' || !settings.paper}
                onChange={event => onChange({ paperStrength: Number(event.target.value) })}
              />
              <output>{Math.round(settings.paperStrength * 100)}%</output>
            </div>
          </div>
          {resolvedTheme !== 'light' && (
            <p className="bgp__hint">仅白天模式生效，切到浅色后再开。</p>
          )}

          <div className="bgp__group">背景</div>
          <div className="bgp__row">
            {BACKGROUND_MODES.map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ mode })}
                aria-pressed={settings.mode === mode}
              >
                {MODE_LABEL[mode]}
              </button>
            ))}
          </div>

          {isAscii && (
            <>
              <div className="bgp__group">水面</div>
              <div className="bgp__row">
                <b>笔法</b>
                {BACKGROUND_BRUSHES.map(brush => (
                  <button
                    key={brush}
                    type="button"
                    onClick={() => onChange({ brush })}
                    aria-pressed={settings.brush === brush}
                  >
                    {BRUSH_LABEL[brush]}
                  </button>
                ))}
              </div>
              <div className="bgp__row">
                <b>波动</b>
                {WAVE_MODES.map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChange({ waveMode: mode })}
                    aria-pressed={settings.waveMode === mode}
                  >
                    {WAVE_LABELS[mode]}
                  </button>
                ))}
              </div>
              {WATER_ROWS.map(renderRow)}

              <div className="bgp__group">锦鲤</div>
              <p className="bgp__hint">锦鲤只在首页 hero 活动；移动端自动降到 2 条、30fps。</p>
              {FISH_ROWS.map(renderRow)}

              <div className="bgp__group">画面</div>
              {SCREEN_ROWS.map(renderRow)}

              <details className="bgp__advanced">
                <summary>高级 · 引擎参数</summary>
                <p className="bgp__hint">直接影响绘制开销与字符尺寸，通常保持默认即可。</p>
                {ADVANCED_ROWS.map(renderRow)}
              </details>

              <button className="bgp__reset" type="button" onClick={onReset}>
                恢复默认
              </button>
            </>
          )}
        </div>
      )}

      <button
        className="bgp__dot"
        ref={dotRef}
        type="button"
        aria-label="背景设置"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        ·
      </button>
    </div>
  )
}
