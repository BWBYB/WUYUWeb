import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAdjacentPosts, getPostBySlug } from '../lib/content/posts'
import ChapterRail from '../components/ChapterRail'
import TocIsland from '../components/TocIsland'
import '../styles/effects.css'
import './Post.css'

function formatReadingTime(wordCount) {
  const minutes = Math.max(1, Math.ceil(wordCount / 300))
  return `${minutes} 分钟阅读`
}

const numeralPattern = /\d+(?:-\d+)*/g

function wrapNumerals(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!/\d/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT
      if (node.parentElement.closest('code, pre, .post-numeral')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  for (const node of textNodes) {
    const text = node.nodeValue
    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    for (const match of text.matchAll(numeralPattern)) {
      fragment.append(text.slice(lastIndex, match.index))
      const span = document.createElement('span')
      span.className = 'post-numeral'
      span.textContent = match[0]
      fragment.append(span)
      lastIndex = match.index + match[0].length
    }
    fragment.append(text.slice(lastIndex))
    node.replaceWith(fragment)
  }
}

export default function Post() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)
  const contentRef = useRef(null)

  useEffect(() => {
    const container = contentRef.current
    if (!container) return undefined

    wrapNumerals(container)

    const buttons = [...container.querySelectorAll('pre')].map((pre) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'code-copy-button btn btn--text btn--sm'
      button.textContent = '复制'
      button.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.textContent || ''
        try {
          await navigator.clipboard.writeText(code)
          button.textContent = '已复制'
          window.setTimeout(() => { button.textContent = '复制' }, 1400)
        } catch {
          button.textContent = '复制失败'
        }
      })
      pre.append(button)
      return { pre, button }
    })

    return () => buttons.forEach(({ pre, button }) => pre.removeChild(button))
  }, [post?.content])

  if (!post) {
    return (
      <div className="post-not-found glass-card">
        <h1>文章不存在</h1>
        <Link to="/blog">&larr; 返回文章列表</Link>
      </div>
    )
  }

  const { previous, next } = getAdjacentPosts(post.slug)

  return (
    <article className="post-page fade-in">
      <Link to="/blog" className="back-link">&larr; 返回文章列表</Link>

      <header className="post-header">
        <div className="post-header-meta">
          {post.category && <span className="post-header-category">{post.category}</span>}
          <time className="post-header-date" dateTime={post.date}>{post.date}</time>
          <span className="post-header-date">{formatReadingTime(post.wordCount)}</span>
        </div>
        <h1 className="post-header-title">{post.title}</h1>
        {post.summary && <p className="post-header-summary">{post.summary}</p>}
        {post.tags.length > 0 && (
          <div className="post-header-tags" aria-label="文章标签">
            {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        )}
        {post.cover && <img className="post-cover media media--wide" src={post.cover} alt="" />}
      </header>

      <div className="post-content">
        <div ref={contentRef} className="post-content-inner" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {post.toc.length >= 3 && <ChapterRail key={`rail-${post.slug}`} chapters={post.toc} />}
      {post.toc.length >= 3 && <TocIsland key={post.slug} chapters={post.toc} />}

      <nav className="post-navigation" aria-label="文章导航">
        {previous ? (
          <Link to={`/blog/${previous.slug}`} className="post-navigation-link">
            <span>上一篇</span><strong>{previous.title}</strong>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/blog/${next.slug}`} className="post-navigation-link post-navigation-next">
            <span>下一篇</span><strong>{next.title}</strong>
          </Link>
        ) : <span />}
      </nav>

      <footer className="post-footer">
        <Link to="/blog" className="post-footer-link">&larr; 阅读更多文章</Link>
      </footer>
    </article>
  )
}
