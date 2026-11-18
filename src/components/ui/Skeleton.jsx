import './skeleton.css'

export default function Skeleton({
  variant = 'text',
  lines = 3,
  className = '',
}) {
  if (variant === 'card') {
    return (
      <div className={`skeleton skeleton--card${className ? ` ${className}` : ''}`} aria-hidden="true">
        <span className="skeleton__media" />
        <span className="skeleton__line" style={{ width: '82%' }} />
        <span className="skeleton__line" style={{ width: '56%' }} />
      </div>
    )
  }

  return (
    <div className={`skeleton skeleton--text${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className="skeleton__line"
          style={{ width: index === lines - 1 ? '62%' : `${100 - index * 5}%` }}
        />
      ))}
    </div>
  )
}
