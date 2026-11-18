import Icon from './Icon'
import './checkbox.css'

export default function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) {
  return (
    <label className={`checkbox${className ? ` ${className}` : ''}`}>
      <input
        className="checkbox__input"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="checkbox__box" aria-hidden="true">
        <Icon name="check" size={12} />
      </span>
      <span className="checkbox__label">{label}</span>
    </label>
  )
}
