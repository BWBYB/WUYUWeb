import './spin.css'

export default function Spin({
  size = 22,
  label = '加载中',
  className = '',
}) {
  return (
    <span className={`spin${className ? ` ${className}` : ''}`} role="status">
      <span
        className="spin__ring"
        style={{ '--spin-size': `${size}px` }}
        aria-hidden="true"
      />
      <span className="spin__label">{label}</span>
    </span>
  )
}
