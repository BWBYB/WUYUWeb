import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Post from './pages/Post'
import About from './pages/About'
import Settings from './pages/Settings'
import Archive from './pages/Archive'
import Timeline from './pages/Timeline'
import { getPostByLegacyId } from './lib/content/posts'
import './styles/effects.css'
import './App.css'

// 重交互页（three.js / 音频）路由级懒加载，避免首屏为它们买单
const Lab = lazy(() => import('./pages/Lab'))
const Player = lazy(() => import('./pages/Player'))
const UpdatesEditor = import.meta.env.DEV
  ? lazy(() => import('./pages/UpdatesEditor'))
  : null

function LegacyPostRedirect() {
  const { id } = useParams()
  const post = getPostByLegacyId(id)
  return <Navigate replace to={post ? `/blog/${post.slug}` : '/blog'} />
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Post />} />
          <Route path="/post/:id" element={<LegacyPostRedirect />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/timeline" element={<Timeline />} />
          {UpdatesEditor && (
            <Route
              path="/updates-editor"
              element={<Suspense fallback={<div className="route-loading">正在加载编辑器…</div>}><UpdatesEditor /></Suspense>}
            />
          )}
          <Route path="/lab" element={<Suspense fallback={<div className="route-loading">正在加载探索页…</div>}><Lab /></Suspense>} />
          <Route path="/player" element={<Suspense fallback={<div className="route-loading">正在加载播放器…</div>}><Player /></Suspense>} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
