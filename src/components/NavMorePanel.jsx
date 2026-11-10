import { Link, useLocation } from 'react-router-dom'
import Icon from './ui/Icon'
import './NavMorePanel.css'

const moreItems = [
  { path: '/lab', label: '探索', description: '实验与交互演示', icon: 'compass' },
  { path: '/player', label: 'CD机', description: '磁带播放器', icon: 'disc' },
]

export default function NavMorePanel({ open, onClose }) {
  const { pathname } = useLocation()

  return (
    <div className="nav-more-panel" data-open={open ? 'true' : undefined}>
      {moreItems.map((item) => {
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`)

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-more-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={onClose}
          >
            <Icon name={item.icon} size={20} className="nav-more-icon" />
            <span className="nav-more-label">{item.label}</span>
            <span className="nav-more-desc">{item.description}</span>
          </Link>
        )
      })}
    </div>
  )
}
