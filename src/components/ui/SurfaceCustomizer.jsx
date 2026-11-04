import { useThemeSwitcherTheme } from './theme-switcher-context'
import './ThemeSwitcherCustomizer.css'
import './SurfaceCustomizer.css'

const formatters = {
  shadowStrength: value => `${Math.round(Number(value) * 100)}%`,
  shadowY: value => `${Math.round(Number(value))}px`,
  shadowBlur: value => `${Math.round(Number(value))}px`,
  shadowSpread: value => `${Math.round(Number(value))}px`,
  borderStrength: value => `${Math.round(Number(value) * 100)}%`,
  glassStrength: value => `${Math.round(Number(value) * 100)}%`,
}

function Control({ label, description, setting, min, max, step, value, update }) {
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

// 全局阴影与边框：三层阴影共用一组几何参数，边框分普通与玻璃两套强度。
export default function SurfaceCustomizer() {
  const { surfaceSettings, updateSurfaceSetting, resetSurfaceSettings } = useThemeSwitcherTheme()

  return (
    <section className="theme-customizer glass-card" aria-labelledby="surface-customizer-title">
      <div className="theme-customizer-heading">
        <div>
          <span className="theme-customizer-kicker">SURFACE</span>
          <h2 id="surface-customizer-title">阴影与边框</h2>
          <p>统一调节卡片、面板与导航的层级，改动即时保存。</p>
        </div>
        <div className="theme-customizer-actions">
          <button type="button" className="theme-customizer-reset" onClick={resetSurfaceSettings}>
            恢复默认
          </button>
        </div>
      </div>

      <div className="surface-preview">
        <div className="surface-preview__card" aria-hidden="true" />
        <div className="surface-preview__float" aria-hidden="true" />
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>阴影</h3>
          <span>Shadow</span>
        </div>
        <div className="theme-customizer-grid">
          <Control label="浓度" description="三层阴影共用" setting="shadowStrength" min={0} max={2} step={0.01} value={surfaceSettings.shadowStrength} update={updateSurfaceSetting} />
          <Control label="垂直偏移" description="导航层基准，卡片按比例缩小" setting="shadowY" min={0} max={40} step={1} value={surfaceSettings.shadowY} update={updateSurfaceSetting} />
          <Control label="模糊" description="导航层基准，卡片按比例缩小" setting="shadowBlur" min={0} max={80} step={1} value={surfaceSettings.shadowBlur} update={updateSurfaceSetting} />
          <Control label="扩散" description="正=放大轮廓，负=收紧" setting="shadowSpread" min={-8} max={16} step={1} value={surfaceSettings.shadowSpread} update={updateSurfaceSetting} />
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>边框</h3>
          <span>Border</span>
        </div>
        <div className="theme-customizer-grid">
          <Control label="普通边框" description="卡片、分隔、输入框" setting="borderStrength" min={0} max={2} step={0.01} value={surfaceSettings.borderStrength} update={updateSurfaceSetting} />
          <Control label="玻璃边框" description="胶囊、玻璃卡片的边缘" setting="glassStrength" min={0} max={2} step={0.01} value={surfaceSettings.glassStrength} update={updateSurfaceSetting} />
        </div>
      </div>
    </section>
  )
}
