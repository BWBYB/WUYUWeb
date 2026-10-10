import { Link } from 'react-router-dom'
import { getArchiveGroups } from '../lib/content/posts'
import '../styles/effects.css'
import './Archive.css'

export default function Archive() {
  return (
    <div className="archive-page">
      <header className="archive-header fade-in fade-in-1">
        <h1 className="archive-title">文章归档</h1>
        <p className="archive-desc">按时间回看写下的内容</p>
      </header>

      <div className="archive-groups">
        {getArchiveGroups().map((group, index) => (
          <section key={group.key} className={`archive-group fade-in fade-in-${Math.min(index + 2, 5)}`}>
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
    </div>
  )
}
