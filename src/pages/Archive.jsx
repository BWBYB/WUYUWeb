import { Link } from 'react-router-dom'
import { getArchiveGroups } from '../lib/content/posts'
import ChapterRail from '../components/ChapterRail'
import '../styles/effects.css'
import './Archive.css'

export default function Archive() {
  const groups = getArchiveGroups()
  const chapters = groups.map((group) => ({
    id: `archive-${group.key}`,
    title: `${group.year} 年 ${Number(group.month)} 月`,
    level: 2,
  }))
  const hasChapters = chapters.length >= 3

  return (
    <div className="archive-page">
      <header className="archive-header fade-in fade-in-1">
        <h1 className="archive-title">文章归档</h1>
      </header>

      <div className="archive-groups">
        {groups.map((group, index) => (
          <section
            key={group.key}
            id={`archive-${group.key}`}
            className={`archive-group fade-in fade-in-${Math.min(index + 2, 5)}`}
          >
            <h2>{group.year} 年 {Number(group.month)} 月</h2>
            <div className="archive-list">
              {group.posts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="archive-item">
                  <span>{post.title}</span>
                  <time dateTime={post.date}>{post.date}</time>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ChapterRail
        chapters={hasChapters ? chapters : []}
        mode={hasChapters ? 'chapters' : 'progress'}
        label={hasChapters ? '归档目录' : '页面进度'}
      />
    </div>
  )
}
