import { useId } from 'react'
import './progress.css'

export default function Progress({
  value,
  max = 100,
  label,
  tone = 'accent',
  showValue = true,
  className = '',
}) {
  const labelId = useId()
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const rounded = Math.round(percent)

  return (
    <div className={`progress${className ? ` ${className}` : ''}`}>
      {label || showValue ? (
        <div className="progress__head">
          {label ? <span className="progress__label" id={labelId}>{label}</span> : <span />}
          {showValue ? <span className="progress__value">{rounded}%</span> : null}
        </div>
      ) : null}
      <div
        className="progress__track"
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : '进度'}
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className={`progress__fill progress__fill--${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
