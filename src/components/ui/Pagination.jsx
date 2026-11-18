import Icon from './Icon'
import './pagination.css'

function getPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < total - 1) pages.push('end-ellipsis')
  pages.push(total)

  return pages
}

export default function Pagination({
  page,
  totalPages,
  onChange,
  label = '分页',
  className = '',
}) {
  const pages = getPages(page, totalPages)

  const go = (next) => {
    const target = Math.min(totalPages, Math.max(1, next))
    if (target !== page) onChange(target)
  }

  return (
    <nav className={`pagination${className ? ` ${className}` : ''}`} aria-label={label}>
      <button
        type="button"
        className="pagination__button"
        aria-label="上一页"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {pages.map((item) => (
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className={`pagination__button${item === page ? ' is-active' : ''}`}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`第 ${item} 页`}
            onClick={() => go(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="pagination__ellipsis" aria-hidden="true">…</span>
        )
      ))}

      <button
        type="button"
        className="pagination__button"
        aria-label="下一页"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </nav>
  )
}
