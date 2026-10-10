import { useState } from 'react'
import { ThemeSwitcher } from './apple-liquid-glass-switcher'
import { useThemeSwitcherTheme } from './theme-switcher-context'
import { THEME_SWITCHER_PRESETS } from './theme-switcher-settings'
import './ThemeSwitcherCustomizer.css'

const formatters = {
  duration: value => `${Number(value).toFixed(2)}s`,
  longDuration: value => `${Number(value).toFixed(2)}s`,
  preStretch: value => `${Number(value).toFixed(2)}×`,
  stretch: value => `${Number(value).toFixed(2)}×`,
  accelDistance: value => `${Math.round(Number(value) * 100)}%`,
  cruiseDistance: value => `${Math.round(Number(value) * 100)}%`,
  settleDistance: value => `${Math.round(Number(value) * 100)}%`,
  glassOpacity: value => `${Math.round(Number(value))}%`,
  activeOpacity: value => `${Math.round(Number(value))}%`,
  blur: value => `${Math.round(Number(value))}px`,
  saturation: value => `${Math.round(Number(value))}%`,
  height: value => `${Math.round(Number(value))}px`,
  optionWidth: value => `${Math.round(Number(value))}px`,
  gap: value => `${Math.round(Number(value))}px`,
  capsuleWidth: value => `${Math.round(Number(value))}px`,
}

function RangeControl({ label, description, setting, min, max, step, value, updateSetting }) {
  const progress = ((value - min) / (max - min)) * 100
  const format = formatters[setting] || (currentValue => currentValue)

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
          onChange={event => updateSetting(setting, Number(event.target.value))}
        />
        <output className="theme-customizer-value">{format(value)}</output>
      </span>
    </label>
  )
}

function ColorControl({ label, description, setting, value, updateSetting }) {
  const [draft, setDraft] = useState(value)

  const handleTextChange = event => {
    const nextValue = event.target.value
    setDraft(nextValue)
    if (/^#[0-9a-f]{6}$/i.test(nextValue)) updateSetting(setting, nextValue)
  }

  const handlePickerChange = event => {
    setDraft(event.target.value)
    updateSetting(setting, event.target.value)
  }

  const handleBlur = () => {
    if (!/^#[0-9a-f]{6}$/i.test(draft)) setDraft(value)
  }

  return (
    <label className="theme-customizer-control theme-customizer-color-control">
      <span className="theme-customizer-control-copy">
        <span>{label}</span>
        <small>{description}</small>
      </span>
      <span className="theme-customizer-color-wrap">
        <input
          className="theme-customizer-color"
          type="color"
          value={value}
          aria-label={`${label}颜色选择器`}
          onChange={handlePickerChange}
        />
        <input
          className="theme-customizer-color-value"
          value={draft}
          spellCheck="false"
          inputMode="text"
          aria-label={`${label}十六进制颜色`}
          onChange={handleTextChange}
          onBlur={handleBlur}
        />
      </span>
    </label>
  )
}

export default function ThemeSwitcherCustomizer() {
  const {
    theme,
    resolvedTheme,
    setTheme,
    settings,
    updateSetting,
    resetSettings,
    applyPreset,
  } = useThemeSwitcherTheme()

  const handlePresetChange = event => {
    const preset = event.target.value
    if (preset) applyPreset(preset)
    event.target.value = ''
  }

  return (
    <section className="theme-customizer glass-card" aria-labelledby="theme-customizer-title">
      <div className="theme-customizer-heading">
        <div>
          <span className="theme-customizer-kicker">THEME SWITCHER</span>
          <h2 id="theme-customizer-title">Customize</h2>
          <p>实时调整悬浮主题切换器的动效、玻璃质感和尺寸。</p>
        </div>
        <div className="theme-customizer-actions">
          <label className="theme-customizer-preset">
            <span>预设</span>
            <select defaultValue="" onChange={handlePresetChange} aria-label="选择 Theme Switcher 预设">
              <option value="">选择预设</option>
              {Object.entries(THEME_SWITCHER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="theme-customizer-reset" onClick={resetSettings}>
            恢复默认
          </button>
        </div>
      </div>

      <div className="theme-customizer-preview theme-provider" data-theme={resolvedTheme}>
        <span className="theme-customizer-preview-label">实时预览</span>
        <ThemeSwitcher inline value={theme} onValueChange={setTheme} settings={settings} />
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>动效</h3>
          <span>Motion</span>
        </div>
        <div className="theme-customizer-grid">
          <RangeControl label="相邻时长" description="1 ↔ 2 / 2 ↔ 3" setting="duration" min={0.3} max={2} step={0.01} value={settings.duration} updateSetting={updateSetting} />
          <RangeControl label="跨项时长" description="1 ↔ 3" setting="longDuration" min={0.4} max={2.4} step={0.01} value={settings.longDuration} updateSetting={updateSetting} />
          <RangeControl label="预拉伸" description="起步形变" setting="preStretch" min={1} max={1.2} step={0.01} value={settings.preStretch} updateSetting={updateSetting} />
          <RangeControl label="最大拉伸" description="横向形变强度" setting="stretch" min={1} max={1.5} step={0.01} value={settings.stretch} updateSetting={updateSetting} />
          <RangeControl label="加速段" description="达到高速前的距离" setting="accelDistance" min={0.05} max={0.45} step={0.01} value={settings.accelDistance} updateSetting={updateSetting} />
          <RangeControl label="巡航段" description="保持高速的位置" setting="cruiseDistance" min={0.55} max={0.9} step={0.01} value={settings.cruiseDistance} updateSetting={updateSetting} />
          <RangeControl label="收回段" description="开始减速的位置" setting="settleDistance" min={0.8} max={0.99} step={0.01} value={settings.settleDistance} updateSetting={updateSetting} />
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>玻璃外观</h3>
          <span>Appearance</span>
        </div>
        <div className="theme-customizer-grid">
          <ColorControl key={`glass-${settings.glassColor}`} label="玻璃颜色" description="外层玻璃色" setting="glassColor" value={settings.glassColor} updateSetting={updateSetting} />
          <ColorControl key={`light-${settings.lightColor}`} label="高光颜色" description="边缘反光色" setting="lightColor" value={settings.lightColor} updateSetting={updateSetting} />
          <ColorControl key={`dark-${settings.darkColor}`} label="阴影颜色" description="深部阴影色" setting="darkColor" value={settings.darkColor} updateSetting={updateSetting} />
          <ColorControl key={`content-${settings.contentColor}`} label="内容颜色" description="图标默认色" setting="contentColor" value={settings.contentColor} updateSetting={updateSetting} />
          <ColorControl key={`action-${settings.actionColor}`} label="悬停颜色" description="指针悬停色" setting="actionColor" value={settings.actionColor} updateSetting={updateSetting} />
          <RangeControl label="主体透明度" description="外层玻璃" setting="glassOpacity" min={0} max={40} step={1} value={settings.glassOpacity} updateSetting={updateSetting} />
          <RangeControl label="胶囊透明度" description="活动指示器" setting="activeOpacity" min={0} max={70} step={1} value={settings.activeOpacity} updateSetting={updateSetting} />
          <RangeControl label="背景模糊" description="backdrop blur" setting="blur" min={0} max={24} step={1} value={settings.blur} updateSetting={updateSetting} />
          <RangeControl label="饱和度" description="背景颜色强度" setting="saturation" min={80} max={240} step={1} value={settings.saturation} updateSetting={updateSetting} />
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>尺寸</h3>
          <span>Layout</span>
        </div>
        <div className="theme-customizer-grid">
          <RangeControl label="导航高度" description="整体高度" setting="height" min={48} max={96} step={1} value={settings.height} updateSetting={updateSetting} />
          <RangeControl label="按钮宽度" description="单项宽度" setting="optionWidth" min={48} max={96} step={1} value={settings.optionWidth} updateSetting={updateSetting} />
          <RangeControl label="按钮间距" description="选项之间" setting="gap" min={0} max={24} step={1} value={settings.gap} updateSetting={updateSetting} />
          <RangeControl label="胶囊宽度" description="活动指示器" setting="capsuleWidth" min={48} max={120} step={1} value={settings.capsuleWidth} updateSetting={updateSetting} />
        </div>
      </div>
    </section>
  )
}
