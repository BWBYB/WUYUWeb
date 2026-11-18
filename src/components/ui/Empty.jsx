export default function Empty({
  text = '暂无内容',
  mark = '∅',
  className = '',
  children,
}) {
  const classes = ['empty', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span className="empty__mark" aria-hidden="true">{mark}</span>
      <p className="empty__text">{text}</p>
      {children}
    </div>
  )
}
