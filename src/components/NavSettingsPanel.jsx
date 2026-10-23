import { Link } from 'react-router-dom'
import { useThemeSwitcherTheme, useNavSettings } from './ui/theme-switcher-context'
import { usePerformanceEffects } from '../hooks/usePerformanceEffects'

const THEME_OPTIONS = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '系统' },
]

const SPEED_MIN = 0.1
const SPEED_MAX = 3
const DURATION_MIN = 0.2
const DURATION_MAX = 1.2

function percent(value, min, max) {
  return ((Number(value) - min) / (max - min)) * 100
}

// 分裂态设置小窗口的内容层。
// 容器高度与裁切由 Header.css 的 .nav-pill / .nav-settings-panel 负责，这里只管控件。
export default function NavSettingsPanel({ open, onClose }) {
  const { theme, setTheme } = useThemeSwitcherTheme()
  const { navSettings, updateNavSetting, resetNavSettings } = useNavSettings()
  const [performanceEffectsEnabled, setPerformanceEffectsEnabled] = usePerformanceEffects()

  return (
    <div className="nav-settings-panel" data-open={open ? 'true' : undefined}>
      <div className="nav-settings-rows">
        <div className="nav-setting-row">
          <span className="nav-setting-label" id="nav-setting-theme-label">
            主题
          </span>
          <div
            className="nav-setting-segment"
            role="group"
            aria-labelledby="nav-setting-theme-label"
          >
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="nav-setting-segment-btn"
                aria-pressed={theme === option.value}
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="nav-setting-row nav-setting-row--range">
          <span className="nav-setting-label">倍速</span>
          <input
            className="nav-setting-range"
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            step={0.01}
            value={navSettings.animationSpeed}
            style={{ '--range-progress': `${percent(navSettings.animationSpeed, SPEED_MIN, SPEED_MAX)}%` }}
            aria-label="动画倍速"
            onChange={(event) => updateNavSetting('animationSpeed', Number(event.target.value))}
          />
          <output className="nav-setting-value">{navSettings.animationSpeed.toFixed(2)}×</output>
        </label>

        <label className="nav-setting-row nav-setting-row--range">
          <span className="nav-setting-label">时长</span>
          <input
            className="nav-setting-range"
            type="range"
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={0.01}
            value={navSettings.stretchDuration}
            style={{
              '--range-progress': `${percent(navSettings.stretchDuration, DURATION_MIN, DURATION_MAX)}%`,
            }}
            aria-label="分裂时长"
            onChange={(event) => updateNavSetting('stretchDuration', Number(event.target.value))}
          />
          <output className="nav-setting-value">{navSettings.stretchDuration.toFixed(2)}s</output>
        </label>

        <div className="nav-setting-row">
          <span className="nav-setting-label" id="nav-setting-perf-label">
            高耗能
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={performanceEffectsEnabled}
            aria-labelledby="nav-setting-perf-label"
            className="nav-setting-switch"
            onClick={() => setPerformanceEffectsEnabled(!performanceEffectsEnabled)}
          >
            <span className="nav-setting-switch-knob" />
          </button>
        </div>
      </div>

      <div className="nav-settings-footer">
        <button type="button" className="nav-settings-reset" onClick={resetNavSettings}>
          恢复默认
        </button>
        <Link to="/settings" className="nav-settings-detail" onClick={onClose}>
          详细设置 <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
