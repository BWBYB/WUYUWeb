import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getPostsByCategory } from '../lib/content/posts'
import '../styles/effects.css'
import './Blog.css'

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const categories = ['全部', ...getCategories()]
  const filteredPosts = getPostsByCategory(activeCategory)

  return (
    <div className="blog-page">
      <div className="blog-header fade-in fade-in-1">
        <div className="blog-heading-row">
          <div>
            <h1 className="blog-title">文章</h1>
            <p className="blog-desc">记录想法、技术和生活</p>
          </div>
          <Link to="/archive" className="archive-link">按时间归档 &rarr;</Link>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter fade-in fade-in-2">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="blog-post-list">
        {filteredPosts.map((post, index) => (
          <article key={post.slug} className={`blog-post-card glass-card fade-in fade-in-${Math.min(index + 2, 5)}`}>
            <div className="blog-post-meta">
              {post.category && <span className="blog-post-category">{post.category}</span>}
              <time className="blog-post-date">{post.date}</time>
            </div>
            <Link to={`/blog/${post.slug}`} className="blog-post-link">
              <h2 className="blog-post-title">{post.title}</h2>
              <p className="blog-post-excerpt">{post.summary}</p>
              {post.tags.length > 0 && (
                <div className="blog-post-tags" aria-label="文章标签">
                  {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
              )}
              <span className="read-more">阅读全文 &rarr;</span>
            </Link>
          </article>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="empty-state glass-card">
          <p>这个分类下还没有文章</p>
        </div>
      )}
    </div>
  )
}
