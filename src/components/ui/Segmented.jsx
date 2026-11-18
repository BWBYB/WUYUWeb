import { useRef } from 'react'
import './segmented.css'

export default function Segmented({
  options,
  value,
  onChange,
  label,
  className = '',
}) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.id === value))
  const optionRefs = useRef([])

  const handleKeyDown = (event, index) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    let next = index
    if (event.key === 'ArrowLeft') next = (index - 1 + options.length) % options.length
    if (event.key === 'ArrowRight') next = (index + 1) % options.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = options.length - 1
    onChange(options[next].id)
    optionRefs.current[next]?.focus()
  }

  return (
    <div
      className={`segmented${className ? ` ${className}` : ''}`}
      role="radiogroup"
      aria-label={label}
      style={{ '--segmented-index': activeIndex, '--segmented-count': options.length }}
    >
      <span className="segmented__indicator" aria-hidden="true" />
      {options.map((option, index) => {
        const active = option.id === value

        return (
          <button
            key={option.id}
            ref={(node) => { optionRefs.current[index] = node }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`segmented__option${active ? ' is-active' : ''}`}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.title}
            {option.count != null ? (
              <span className="segmented__count">{option.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
