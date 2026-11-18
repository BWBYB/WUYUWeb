import { Navigate, useParams } from 'react-router-dom'
import ChapterRail from '../components/ChapterRail'
import Badge from '../components/ui/Badge'
import Breadcrumb from '../components/ui/Breadcrumb'
import {
  getLibraryCategory,
  getLibraryComponent,
  libraryComponents,
  libraryStatus,
  libraryStatusTone,
} from '../lib/library/catalog'
import './Library.css'

const pad = (value) => String(value).padStart(2, '0')

const chapters = [
  { id: 'library-detail-preview', title: '预览', level: 2 },
  { id: 'library-detail-notes', title: '说明', level: 2 },
]

const LIVE_DEMOS = new Set([
  'button',
  'field',
  'switch',
  'icon',
  'segmented',
  'theme-switcher',
  'lab-section',
  'tabs',
  'pagination',
  'slider',
  'checkbox',
  'select',
  'alert',
  'modal',
])

function SectionHead({ id, index, title, en }) {
  return (
    <div className="library-section-head">
      <div className="library-section-head__heading">
        <span className="library-section-head__index" aria-hidden="true">{index}</span>
        <h2 id={id}>{title}</h2>
        <span className="library-section-head__en">{en}</span>
      </div>
    </div>
  )
}

export default function LibraryDetail() {
  const { slug } = useParams()
  const component = getLibraryComponent(slug)

  if (!component) return <Navigate replace to="/components" />

  const category = getLibraryCategory(component.category)
  const order = libraryComponents.indexOf(component) + 1
  const Demo = component.demo
  const live = LIVE_DEMOS.has(component.slug)

  return (
    <div className="library-page library-detail">
      <Breadcrumb
        className="breadcrumb--capsule library-breadcrumb fade-in fade-in-1"
        items={[
          { label: '组件库', to: '/components', icon: 'grid' },
          { label: category.title },
          { label: component.name },
        ]}
      />

      <header className="library-detail__header fade-in fade-in-1">
        <div className="library-detail__meta">
          <span>{pad(order)}</span>
          <span>{component.en}</span>
          <Badge className="library-card__status" tone={libraryStatusTone[component.status]}>
            {libraryStatus[component.status]}
          </Badge>
        </div>
        <h1 className="library-detail__title">{component.name}</h1>
        <p className="library-detail__summary">{component.summary}</p>
      </header>

      <section
        id="library-detail-preview"
        className="library-detail__section fade-in fade-in-2"
        aria-labelledby="library-detail-preview-title"
      >
        <SectionHead
          id="library-detail-preview-title"
          index="01"
          title="预览"
          en="PREVIEW"
        />
        <div className={`library-stage${live ? ' is-live' : ''}`}>
          <span className="library-stage__badge">{live ? 'LIVE' : 'STATIC'}</span>
          <Demo />
        </div>
      </section>

      <section
        id="library-detail-notes"
        className="library-detail__section fade-in fade-in-3"
        aria-labelledby="library-detail-notes-title"
      >
        <SectionHead
          id="library-detail-notes-title"
          index="02"
          title="说明"
          en="NOTES"
        />
        <ol className="library-notes">
          {component.notes.map((note, index) => (
            <li key={note}>
              <span className="library-notes__index" aria-hidden="true">{pad(index + 1)}</span>
              <p>{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <ChapterRail chapters={chapters} label="组件目录" />
    </div>
  )
}
