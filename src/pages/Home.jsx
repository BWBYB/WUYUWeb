import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { posts } from '../lib/content/posts'
import ChapterRail from '../components/ChapterRail'
import Icon from '../components/ui/Icon'
import '../styles/effects.css'
import './Home.css'

const works = [
  { name: '组件库', meta: '36 组件 · 7 分类', to: '/library', icon: 'grid' },
  { name: '简历', meta: '在校经历 · 全栈 → Agent', to: '/resume', icon: 'resume' },
  { name: 'Lab', meta: '实验与动效', to: '/lab', icon: 'compass' },
]

export default function Home() {
  // 日报每天一篇，混进最新文章会把手写文章挤出首页
  const recentPosts = posts.filter(post => post.category !== '日报').slice(0, 3)
  const bentoRef = useRef(null)

  function scrollToContent() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bentoRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section" data-koi-pond aria-labelledby="hero-title">
        <div className="hero-label" data-water-avoid>
          <div className="hero-label__name">
            <span className="hero-label__dot" aria-hidden="true" />
            <h1 id="hero-title" className="hero-label__title">WUYUWEB</h1>
          </div>
          <p className="hero-label__sub">
            前端 · AI · 观察笔记
            <Link to="/about" className="hero-label__link" data-water-dim>
              关于
            </Link>
          </p>
        </div>

        <button
          type="button"
          className="hero-scroll-float"
          aria-label="向下滚动"
          data-water-avoid
          onClick={scrollToContent}
        >
          <span className="hero-scroll-float__dot" aria-hidden="true" />
          <span className="hero-scroll-float__line" aria-hidden="true" />
          <span className="hero-scroll-float__chevron" aria-hidden="true" />
        </button>
      </section>

      {/* Bento Grid */}
      <div className="bento-grid" ref={bentoRef}>
        {/* Latest Posts - Large Card */}
        <div className="bento-card bento-large glass-card fade-in fade-in-2">
          <div className="card-header">
            <h2 className="card-title">最新文章</h2>
            <Link to="/blog" className="card-link">
              全部
              <Icon name="chevronRight" size={14} />
            </Link>
          </div>
          <div className="card-posts">
            {recentPosts.map(post => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="card-post-item">
                <div className="card-post-meta">
                  <span className="card-post-category">{post.category}</span>
                  <time className="card-post-date">{post.date}</time>
                </div>
                <h3 className="card-post-title">{post.title}</h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Now - Small Card */}
        <div className="bento-card bento-small bento-now glass-card fade-in fade-in-3">
          <div className="card-header">
            <h2 className="card-title">现在</h2>
          </div>
          <p className="now-book">《AI Agent》第四章</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }}></div>
          </div>
          <span className="progress-label">60% 读完</span>
          <div className="now-stack">
            <span className="now-label">技术栈</span>
            <div className="tech-pills">
              {['React', 'Python', 'Dify', 'Docker'].map(tech => (
                <span key={tech} className="tech-pill">{tech}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Works - Large Card */}
        <div className="bento-card bento-large glass-card fade-in fade-in-4">
          <div className="card-header">
            <h2 className="card-title">作品</h2>
          </div>
          <div className="work-list">
            {works.map(work => (
              <Link key={work.to} to={work.to} className="work-item">
                <span className="work-icon">
                  <Icon name={work.icon} size={18} />
                </span>
                <span className="work-name">{work.name}</span>
                <span className="work-meta">{work.meta}</span>
                <Icon name="chevronRight" size={16} className="work-arrow" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quote - Small Card */}
        <div className="bento-card bento-small quote-card glass-card fade-in fade-in-5">
          <blockquote className="bento-quote">
            「在不确定中找到自己的节奏，在焦虑和期待之间找到平衡。」
          </blockquote>
          <p className="quote-author">— 写于深圳的秋天</p>
        </div>
      </div>

      <ChapterRail mode="progress" label="页面进度" />
    </div>
  )
}
