import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import matter from 'gray-matter'
import { marked } from 'marked'
import fs from 'node:fs'
import path, { resolve } from 'node:path'

const contentDirectories = ['content/posts', 'content/notion']
const virtualContentModule = 'virtual:wuyu-content'
const resolvedContentModule = `\0${virtualContentModule}`

function collectMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectMarkdownFiles(filePath)
    return entry.isFile() && entry.name.endsWith('.md') ? [filePath] : []
  })
}

function slugifyHeading(value, index) {
  const slug = value
    .toLowerCase()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `section-${index + 1}`
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildMarkdownPost(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(source)
  const slug = String(data.slug || '').trim()
  const title = String(data.title || '').trim()

  if (!slug || !title || !data.date) {
    throw new Error(`文章缺少必填字段（title、slug、date）：${filePath}`)
  }

  if (String(data.status || 'published').toLowerCase() !== 'published') {
    return null
  }

  const toc = []
  const usedHeadingIds = new Map()
  const headings = [...content.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)]
  headings.forEach((match, index) => {
    const rawTitle = match[1].trim().replace(/[`*_~]/g, '')
    const baseId = slugifyHeading(rawTitle, index)
    const count = usedHeadingIds.get(baseId) || 0
    usedHeadingIds.set(baseId, count + 1)
    toc.push({
      level: Number(match[0].match(/^#+/)[0].length),
      title: rawTitle,
      id: count ? `${baseId}-${count + 1}` : baseId,
    })
  })

  const renderer = new marked.Renderer()
  renderer.html = () => ''
  let html = marked.parse(content, { gfm: true, breaks: false, renderer })
  let headingIndex = 0
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_match, level, inner) => {
    const heading = toc[headingIndex++]
    if (!heading) return `<h${level}>${inner}</h${level}>`
    return `<h${level} id="${escapeHtml(heading.id)}">${inner}</h${level}>`
  })

  const relativePath = path.relative(process.cwd(), filePath).replaceAll(path.sep, '/')
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_>`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    id: slug,
    slug,
    title,
    summary: String(data.summary || plainText.slice(0, 160)).trim(),
    excerpt: String(data.summary || plainText.slice(0, 160)).trim(),
    content: html,
    date: normalizeDate(data.date),
    updated: data.updated ? normalizeDate(data.updated) : normalizeDate(data.date),
    legacyId: data.legacyId ? String(data.legacyId) : null,
    category: data.category ? String(data.category).trim() : '',
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    cover: data.cover ? String(data.cover) : null,
    wordCount: plainText ? plainText.split(/\s+/).length : 0,
    toc,
    source: relativePath.startsWith('content/notion/') ? 'notion' : 'obsidian',
  }
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function readContentPosts() {
  const posts = contentDirectories
    .flatMap((directory) => collectMarkdownFiles(resolve(directory)))
    .map(buildMarkdownPost)
    .filter(Boolean)
    .sort((left, right) => new Date(right.date) - new Date(left.date))

  const seenSlugs = new Set()
  for (const post of posts) {
    if (seenSlugs.has(post.slug)) {
      throw new Error(`文章 slug 重复：${post.slug}`)
    }
    seenSlugs.add(post.slug)
  }

  return posts
}

function markdownContentPlugin() {
  return {
    name: 'wuyu-content',
    resolveId(id) {
      return id === virtualContentModule ? resolvedContentModule : undefined
    },
    load(id) {
      if (id !== resolvedContentModule) return undefined
      return `export default ${JSON.stringify(readContentPosts())}`
    },
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.md') || !file.includes(`${path.sep}content${path.sep}`)) return
      server.moduleGraph.invalidateAll()
      server.ws.send({ type: 'full-reload' })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [markdownContentPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
    },
  },
})
