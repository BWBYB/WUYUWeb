import { useThemeSwitcherTheme } from './theme-switcher-context'
import Switch from './Switch'
import './ThemeSwitcherCustomizer.css'
import './EdgeBlurCustomizer.css'

const formatters = {
  blur: value => `${Math.round(Number(value))}px`,
  height: value => `${Math.round(Number(value))}px`,
  fade: value => `${Math.round(Number(value))}%`,
}

function RangeControl({ label, description, setting, min, max, step, value, update }) {
  const progress = ((value - min) / (max - min)) * 100

  return (
    <label className="theme-customizer-control theme-customizer-range-control">
      <span className="theme-customizer-control-copy">
        <span>{label}</span>
        <small>{description}</small>
      </span>
      <span className="theme-customizer-range-wrap">
        <input
          className="theme-customizer-range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ '--range-progress': `${progress}%` }}
          aria-label={label}
          onChange={event => update(setting, Number(event.target.value))}
        />
        <output className="theme-customizer-value">{formatters[setting](value)}</output>
      </span>
    </label>
  )
}

// 视口上下边缘模糊：全站生效，参数即时写到根元素 CSS 变量。
export default function EdgeBlurCustomizer() {
  const { edgeBlurSettings, updateEdgeBlurSetting, resetEdgeBlurSettings } = useThemeSwitcherTheme()

  return (
    <section className="theme-customizer glass-card" aria-labelledby="edge-blur-customizer-title">
      <div className="theme-customizer-heading">
        <div>
          <span className="theme-customizer-kicker">EDGE BLUR</span>
          <h2 id="edge-blur-customizer-title">边缘模糊</h2>
          <p>视口上下边缘各压一层纯模糊：只糊背景与正文，导航和主题切换器保持清晰，打印时自动隐藏。</p>
        </div>
        <div className="theme-customizer-actions">
          <button type="button" className="theme-customizer-reset btn btn--text btn--sm" onClick={resetEdgeBlurSettings}>
            恢复默认
          </button>
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>效果</h3>
          <span>Effect</span>
        </div>
        <div className="theme-customizer-grid">
          <div className="theme-customizer-control edge-blur-toggle">
            <span className="theme-customizer-control-copy">
              <span>启用</span>
              <small>上下两端同时生效</small>
            </span>
            <Switch
              checked={edgeBlurSettings.enabled}
              onChange={value => updateEdgeBlurSetting('enabled', value)}
              label="启用边缘模糊"
            />
          </div>
          <RangeControl label="模糊半径" description="backdrop blur" setting="blur" min={0} max={24} step={1} value={edgeBlurSettings.blur} update={updateEdgeBlurSetting} />
          <RangeControl label="作用高度" description="上下各一条" setting="height" min={60} max={300} step={10} value={edgeBlurSettings.height} update={updateEdgeBlurSetting} />
          <RangeControl label="实心区" description="之后渐变到透明" setting="fade" min={0} max={100} step={5} value={edgeBlurSettings.fade} update={updateEdgeBlurSetting} />
        </div>
      </div>
    </section>
  )
}
