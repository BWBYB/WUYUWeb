import { useThemeSwitcherTheme } from '../ui/theme-switcher-context'
import { resume } from '../../lib/content/resume'
import Icon from '../ui/Icon'
import './IdentityCapsule.css'

// 与 Header 共用主题切换器的玻璃设置，浅/深主题的取色规则保持一致
export default function IdentityCapsule({ className = '' }) {
  const { resolvedTheme, settings } = useThemeSwitcherTheme()
  const light = resolvedTheme === 'light'

  const style = {
    '--capsule-glass-color': settings.glassColor,
    '--capsule-glass-opacity': `${settings.glassOpacity}%`,
    '--capsule-blur': `${settings.blur}px`,
    '--capsule-saturation': `${settings.saturation}%`,
    '--capsule-light-color': settings.lightColor,
    '--capsule-dark-color': settings.darkColor,
    '--capsule-content-color': light ? settings.contentColor : '#ded9cf',
    '--capsule-action-color': light ? settings.actionColor : '#c4713f',
    '--capsule-reflex-light': light ? 1 : 0.3,
    '--capsule-reflex-dark': light ? 1 : 2,
  }

  return (
    <div className={className ? `identity-capsule ${className}` : 'identity-capsule'} style={style}>
      <span className="identity-capsule__name">{resume.profile.name}</span>
      <span className="identity-capsule__sep" aria-hidden="true" />
      <span className="identity-capsule__role">{resume.profile.role}</span>
      <span className="identity-capsule__links">
        <a href={`mailto:${resume.profile.email}`} aria-label={`邮箱：${resume.profile.email}`}>
          <Icon name="mail" size={15} />
        </a>
        <a
          href={resume.profile.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Icon name="github" size={15} />
        </a>
      </span>
    </div>
  )
}
