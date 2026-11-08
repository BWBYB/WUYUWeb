export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`switch${checked ? ' switch--on' : ''}${className ? ` ${className}` : ''}`}
      onClick={() => onChange?.(!checked)}
      {...props}
    >
      <span className="switch__thumb" aria-hidden="true" />
    </button>
  )
}
