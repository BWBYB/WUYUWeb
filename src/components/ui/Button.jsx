// 统一按钮：primary / secondary / text；md 为默认，sm 只给密集面板。
export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    className,
  ].filter(Boolean).join(' ')

  return <button type={type} className={classes} {...props} />
}
