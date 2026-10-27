import { useEffect, useRef, useState } from 'react'
import {
  BACKGROUND_BRUSHES,
  BACKGROUND_MODES,
  BACKGROUND_PALETTES,
  BACKGROUND_POINTERS,
} from './ui/background-settings'
import './AsciiBackgroundPanel.css'

const MODE_LABEL = { ascii: '字符', aurora: '极光', none: '无' }
const BRUSH_LABEL = { density: '梯度', halftone: '半调', block: '积木', line: '线描', dot: '点阵' }
const POINTER_LABEL = { yield: '让开', light: '点亮', off: '静默' }
const PALETTE_LABEL = { warm: '暖版', site: '跟站点' }

// 右下角一颗几乎看不见的入口。背景是常驻物，参数不该占用正文空间。
export default function AsciiBackgroundPanel({ settings, onChange }) {
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
  // 旧存储里没有这些项时按默认值显示，避免 output 出现 NaN
  const lightK = Number.isFinite(settings.lightK) ? settings.lightK : 1
  const flow = Number.isFinite(settings.flow) ? settings.flow : 1

  return (
    <div className="bgp" ref={rootRef}>
      {open && (
        <div className="bgp__panel" role="dialog" aria-label="背景设置">
          <div className="bgp__row">
            <b>背景</b>
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
              <div className="bgp__row">
                <b>配色</b>
                {BACKGROUND_PALETTES.map(palette => (
                  <button
                    key={palette}
                    type="button"
                    onClick={() => onChange({ palette })}
                    aria-pressed={settings.palette === palette}
                  >
                    {PALETTE_LABEL[palette]}
                  </button>
                ))}
              </div>

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
                <b>存在感</b>
                <div className="bgp__meter">
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={Math.round(settings.presence * 100)}
                    aria-label="背景存在感"
                    onChange={event => onChange({ presence: Number(event.target.value) / 100 })}
                  />
                  <output>{settings.presence.toFixed(2)}</output>
                </div>
              </div>

              <div className="bgp__row">
                <b>让路</b>
                <div className="bgp__meter">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(settings.yieldK * 100)}
                    aria-label="内容区让路强度"
                    onChange={event => onChange({ yieldK: Number(event.target.value) / 100 })}
                  />
                  <output>{Math.round(settings.yieldK * 100)}%</output>
                </div>
              </div>

              <div className="bgp__row">
                <b>浓淡</b>
                <div className="bgp__meter">
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={Math.round(settings.density * 100)}
                    aria-label="字符分布浓淡"
                    onChange={event => onChange({ density: Number(event.target.value) / 100 })}
                  />
                  <output>{settings.density.toFixed(2)}</output>
                </div>
              </div>

              <div className="bgp__row">
                <b>流速</b>
                <div className="bgp__meter">
                  <input
                    type="range"
                    min="10"
                    max="220"
                    value={Math.round(flow * 100)}
                    aria-label="背景流动速度"
                    onChange={event => onChange({ flow: Number(event.target.value) / 100 })}
                  />
                  <output>{flow.toFixed(2)}</output>
                </div>
              </div>

              <div className="bgp__row">
                <b>指针</b>
                {BACKGROUND_POINTERS.map(pointer => (
                  <button
                    key={pointer}
                    type="button"
                    onClick={() => onChange({ pointer })}
                    aria-pressed={settings.pointer === pointer}
                  >
                    {POINTER_LABEL[pointer]}
                  </button>
                ))}
              </div>

              <div className="bgp__row">
                <b>效果</b>
                <button
                  type="button"
                  onClick={() => onChange({ ripple: !settings.ripple })}
                  aria-pressed={settings.ripple}
                >
                  涟漪
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ motes: !settings.motes })}
                  aria-pressed={settings.motes}
                >
                  浮尘
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ keyLight: !settings.keyLight })}
                  aria-pressed={settings.keyLight}
                >
                  主光
                </button>
              </div>

              <div className="bgp__row">
                <b>光强</b>
                <div className="bgp__meter">
                  <input
                    type="range"
                    min="10"
                    max="250"
                    value={Math.round(lightK * 100)}
                    aria-label="光效强度（主光 / 指针 / 涟漪）"
                    onChange={event => onChange({ lightK: Number(event.target.value) / 100 })}
                  />
                  <output>{lightK.toFixed(2)}</output>
                </div>
              </div>
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
