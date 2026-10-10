import { useParams, Link } from 'react-router-dom'
import { getPostById } from '../data/posts'
import '../styles/effects.css'
import './Post.css'

export default function Post() {
  const { id } = useParams()
  const post = getPostById(id)

  if (!post) {
    return (
      <div className="post-not-found glass-card">
        <h1>文章不存在</h1>
        <Link to="/blog">&larr; 返回文章列表</Link>
      </div>
    )
  }

  const paragraphs = post.content.split('\n\n').filter(p => p.trim())

  return (
    <article className="post-page fade-in">
      <Link to="/blog" className="back-link">&larr; 返回文章列表</Link>

      <header className="post-header">
        <div className="post-header-meta">
          <span className="post-header-category">{post.category}</span>
          <time className="post-header-date">{post.date}</time>
        </div>
        <h1 className="post-header-title">{post.title}</h1>
      </header>

      <div className="post-content glass-card">
        <div className="post-content-inner">
          {paragraphs.map((p, i) => {
            if (p.startsWith('## ')) {
              return <h2 key={i}>{p.replace('## ', '')}</h2>
            }
            if (p.startsWith('### ')) {
              return <h3 key={i}>{p.replace('### ', '')}</h3>
            }
            if (p.startsWith('```')) {
              const lines = p.split('\n')
              const code = lines.slice(1, -1).join('\n')
              return <pre key={i}><code>{code}</code></pre>
            }
            if (p.includes('\n- ') || p.startsWith('- ')) {
              const items = p.split('\n').filter(l => l.startsWith('- ')).map(l => l.replace('- ', ''))
              return (
                <ul key={i}>
                  {items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              )
            }
            if (p.match(/^\d+\./)) {
              const items = p.split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, ''))
              return (
                <ol key={i}>
                  {items.map((item, j) => <li key={j}>{item}</li>)}
                </ol>
              )
            }
            const formatted = p
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
          })}
        </div>
      </div>

      <footer className="post-footer">
        <Link to="/blog" className="post-footer-link">&larr; 阅读更多文章</Link>
      </footer>
    </article>
  )
}
