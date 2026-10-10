import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Lab from './pages/Lab'
import Player from './pages/Player'
import About from './pages/About'
import Settings from './pages/Settings'
import Archive from './pages/Archive'
import { getPostByLegacyId } from './lib/content/posts'
import './styles/effects.css'
import './App.css'

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
          <Route path="/lab" element={<Lab />} />
          <Route path="/player" element={<Player />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
