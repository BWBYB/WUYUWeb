import { DEFAULT_ABOUT_STATS_LAYOUT, useAboutStatsLayout } from '../../hooks/useAboutStatsLayout'
import Switch from './Switch'
import './ThemeSwitcherCustomizer.css'
import './AboutStatsCustomizer.css'

// 关于页收尾模块的六项统计（总提交数 / 活跃率 / 近一周 / 最忙一天 / 连续 ×2）
// 只是横向位置有两个版本，切换开关即可对比，不影响数据与字体。
export default function AboutStatsCustomizer() {
  const [layout, updateLayout] = useAboutStatsLayout()
  const balanced = layout === 'balanced'

  return (
    <section className="theme-customizer glass-card" aria-labelledby="about-stats-customizer-title">
      <div className="theme-customizer-heading">
        <div>
          <span className="theme-customizer-kicker">ABOUT STATS</span>
          <h2 id="about-stats-customizer-title">关于页统计条</h2>
          <p>
            六项提交统计在卡片里的横向位置。默认与状态行左缘齐平（距外框 33px）；
            打开后整条再缩进 16px（49px），与上面的「最近更新」拉开一档层级。
          </p>
        </div>
        <div className="theme-customizer-actions">
          <button
            type="button"
            className="theme-customizer-reset btn btn--text btn--sm"
            onClick={() => updateLayout(DEFAULT_ABOUT_STATS_LAYOUT)}
          >
            恢复默认
          </button>
        </div>
      </div>

      <div className="theme-customizer-section">
        <div className="theme-customizer-section-heading">
          <h3>位置</h3>
          <span>Layout</span>
        </div>
        <div className="theme-customizer-grid">
          <div className="theme-customizer-control about-stats-toggle">
            <span className="theme-customizer-control-copy">
              <span>左侧缩进</span>
              <small>{balanced ? '开：缩进 16px（距外框 49）' : '关：与状态行齐平（距外框 33）'}</small>
            </span>
            <Switch
              checked={balanced}
              onChange={(value) => updateLayout(value ? 'balanced' : 'flush')}
              label="统计条左侧缩进"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
