export default function Tag({
  children,
  tone = 'neutral',
  className = '',
  ...props
}) {
  const classes = [
    'tag',
    tone === 'accent' ? 'tag--accent' : '',
    className,
  ].filter(Boolean).join(' ')

  return <span className={classes} {...props}>{children}</span>
}
