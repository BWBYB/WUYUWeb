import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import './breadcrumb.css'

export default function Breadcrumb({ items, label = '面包屑', className = '' }) {
  return (
    <nav className={`breadcrumb${className ? ` ${className}` : ''}`} aria-label={label}>
      {items.map((item, index) => {
        const last = index === items.length - 1
        const content = (
          <>
            {item.icon ? <Icon name={item.icon} size={14} /> : null}
            {item.label}
          </>
        )

        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <span className="breadcrumb__separator" aria-hidden="true">/</span> : null}
            {last ? (
              <span className="breadcrumb__current" aria-current="page">{content}</span>
            ) : item.to ? (
              <Link className="breadcrumb__link" to={item.to}>{content}</Link>
            ) : (
              <span className="breadcrumb__text">{content}</span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
