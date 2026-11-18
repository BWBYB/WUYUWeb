import './divider.css'

export default function Divider({ children, variant = 'solid', className = '' }) {
  const classes = [
    'divider',
    variant === 'dashed' ? 'divider--dashed' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} role="separator">
      {children ? (
        <>
          <span className="divider__line" />
          <span className="divider__label">{children}</span>
          <span className="divider__line" />
        </>
      ) : <span className="divider__line" />}
    </div>
  )
}
