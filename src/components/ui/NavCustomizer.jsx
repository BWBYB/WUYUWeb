import { useNavSettings } from './theme-switcher-context'
import { easingFromControls, scaledDuration } from './nav-settings'

// 复用 ThemeSwitcherCustomizer.css 里的 .theme-customizer-* 通用控件样式，
// 因此这里不再单独写 CSS，外壳用全局 .glass-card。
const formatters = {
  stretchThreshold: value => `${Math.round(Number(value))}px`,
  stretchDuration: value => `${Number(value).toFixed(2)}s`,
  animationSpeed: value => `${Number(value).toFixed(2)}×`,
  easingStart: value => {
    const v = Number(value)
    return v === 0 ? '标准' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`
  },
  easingEnd: value => {
    const v = Number(value)
    return v === 0 ? '标准' : `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`
  },
}

function NavRangeControl({ label, description, setting, min, max, step, value, update }) {
  const progress = ((value - min) / (max - min)) * 100
  const format = formatters[setting] || (v => v)

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
        <output className="theme-customizer-value">{format(value)}</output>
      </span>
    </label>
  )
}

export default function NavCustomizer() {
  const { navSettings, updateNavSetting, resetNavSettings } = useNavSettings()

  return (
    <section className="theme-customizer glass-card" aria-labelledby="nav-customizer-title">
      <div className="theme-customizer-heading">
        <div>
          <span className="theme-customizer-kicker">NAVIGATION</span>
          <h2 id="nav-customizer-title">导航栏动效</h2>
          <p>调整顶部导航栏下滑分裂的触发与节奏。改动即时保存，返回页面生效。</p>
        </div>
        <div className="theme-customizer-actions">
          <button type="button" className="theme-customizer-reset" onClick={resetNavSettings}>
            恢复默认
          </button>
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>分裂触发</h3>
          <span>Trigger</span>
        </div>
        <div className="theme-customizer-grid">
          <NavRangeControl label="触发阈值" description="下滑多少像素开始分裂" setting="stretchThreshold" min={40} max={300} step={1} value={navSettings.stretchThreshold} update={updateNavSetting} />
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>动画快慢</h3>
          <span>Speed</span>
        </div>
        <div className="theme-customizer-grid">
          <NavRangeControl label="动画倍速" description="全局缩放所有动画时长，0.1=极慢（慢放观察），3=极快" setting="animationSpeed" min={0.1} max={3} step={0.01} value={navSettings.animationSpeed} update={updateNavSetting} />
          <NavRangeControl label="分裂时长" description="倍速 1× 时的基准过渡时间" setting="stretchDuration" min={0.2} max={1.2} step={0.01} value={navSettings.stretchDuration} update={updateNavSetting} />
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>缓动曲线</h3>
          <span>Easing</span>
        </div>
        <div className="theme-customizer-grid">
          <NavRangeControl label="起步快慢" description="负=更柔缓，正=起步更陡" setting="easingStart" min={-0.6} max={0.6} step={0.01} value={navSettings.easingStart} update={updateNavSetting} />
          <NavRangeControl label="收尾快慢" description="负=收尾更干脆，正=更慢停" setting="easingEnd" min={-0.6} max={0.6} step={0.01} value={navSettings.easingEnd} update={updateNavSetting} />
        </div>
      </div>

      <p className="theme-customizer-easing-note" style={{ margin: '16px 0 0', color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
        当前缓动曲线：{easingFromControls(navSettings.easingStart, navSettings.easingEnd)}
        &nbsp;·&nbsp;实际过渡时长：{scaledDuration(navSettings.stretchDuration, navSettings.animationSpeed)}
      </p>
    </section>
  )
}
