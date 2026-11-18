import { useId } from 'react'
import './slider.css'

export default function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue = (current) => current,
  className = '',
}) {
  const id = useId()
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100

  return (
    <div className={`slider${className ? ` ${className}` : ''}`}>
      <div className="slider__head">
        <label className="slider__label" htmlFor={id}>{label}</label>
        <output className="slider__value" htmlFor={id}>{formatValue(value)}</output>
      </div>
      <input
        id={id}
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--slider-progress': `${percent}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
