import Icon from './Icon'
import './alert.css'

const TONE_ICONS = {
  info: 'info',
  accent: 'check',
  danger: 'alert',
}

export default function Alert({
  tone = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  return (
    <div
      className={`alert alert--${tone}${className ? ` ${className}` : ''}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon name={TONE_ICONS[tone]} size={18} className="alert__icon" />
      <div className="alert__content">
        {title ? <strong className="alert__title">{title}</strong> : null}
        {children ? <div className="alert__body">{children}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="alert__close" aria-label="关闭提示" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  )
}
