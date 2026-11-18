import './badge.css'

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const classes = ['badge', tone !== 'neutral' ? `badge--${tone}` : '', className].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}
