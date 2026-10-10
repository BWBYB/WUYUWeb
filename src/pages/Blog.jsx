import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getPostsByCategory } from '../data/posts'
import '../styles/effects.css'
import './Blog.css'

const categories = ['全部', '生活', '技术', '读书']

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const filteredPosts = getPostsByCategory(activeCategory)

  return (
    <div className="blog-page">
      <div className="blog-header fade-in fade-in-1">
        <h1 className="blog-title">文章</h1>
        <p className="blog-desc">记录想法、技术和生活</p>
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
          <article key={post.id} className={`blog-post-card glass-card fade-in fade-in-${Math.min(index + 2, 5)}`}>
            <div className="blog-post-meta">
              <span className="blog-post-category">{post.category}</span>
              <time className="blog-post-date">{post.date}</time>
            </div>
            <Link to={`/post/${post.id}`} className="blog-post-link">
              <h2 className="blog-post-title">{post.title}</h2>
              <p className="blog-post-excerpt">{post.excerpt}</p>
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
