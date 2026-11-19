import { useSearchParams } from 'react-router-dom'
import Changelog from '../components/Changelog'
import ChapterRail from '../components/ChapterRail'
import '../styles/effects.css'
import './UpdatesLog.css'

const VALID_FILTERS = new Set(['new', 'improved', 'fixed'])

export default function UpdatesLog() {
  const [searchParams] = useSearchParams()
  const tag = searchParams.get('tag')
  const initialFilter = VALID_FILTERS.has(tag) ? tag : 'all'

  return (
    <div className="updates-log-page">
      <Changelog
        headingId="updates-log"
        title="全部日志"
        initialFilter={initialFilter}
      />

      <ChapterRail mode="progress" label="页面进度" />
    </div>
  )
}
