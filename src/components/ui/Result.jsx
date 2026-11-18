import Icon from './Icon'
import './result.css'

const STATUS = {
  success: { icon: 'check' },
  info: { icon: 'info' },
  empty: { mark: '∅' },
}

export default function Result({
  status = 'success',
  title,
  description,
  children,
  className = '',
}) {
  const config = STATUS[status] || STATUS.success

  return (
    <section className={`result result--${status}${className ? ` ${className}` : ''}`}>
      <span className="result__mark" aria-hidden="true">
        {config.mark || <Icon name={config.icon} size={24} />}
      </span>
      <h3 className="result__title">{title}</h3>
      {description ? <p className="result__desc">{description}</p> : null}
      {children ? <div className="result__actions">{children}</div> : null}
    </section>
  )
}
