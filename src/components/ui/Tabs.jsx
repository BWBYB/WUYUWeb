import { useRef } from 'react'
import './tabs.css'

export default function Tabs({
  items,
  value,
  onChange,
  label,
  className = '',
}) {
  const optionRefs = useRef([])

  const handleKeyDown = (event, index) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    let next = index
    if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    if (event.key === 'ArrowRight') next = (index + 1) % items.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = items.length - 1
    onChange(items[next].id)
    optionRefs.current[next]?.focus()
  }

  return (
    <div className={`tabs${className ? ` ${className}` : ''}`} role="tablist" aria-label={label}>
      {items.map((item, index) => {
        const active = item.id === value

        return (
          <button
            key={item.id}
            ref={(node) => { optionRefs.current[index] = node }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`tabs__tab${active ? ' is-active' : ''}`}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
            {item.count != null ? <span className="tabs__count">{item.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
