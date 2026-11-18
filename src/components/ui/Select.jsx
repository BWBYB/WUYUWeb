import Icon from './Icon'
import './select.css'

export default function Select({
  label,
  value,
  onChange,
  options,
  hint,
  className = '',
}) {
  return (
    <label className={`field select-field${className ? ` ${className}` : ''}`}>
      <span className="field__label">{label}</span>
      <span className="select">
        <select
          className="control select__control"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" size={16} className="select__icon" />
      </span>
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}
