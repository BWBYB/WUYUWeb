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
const virtualUpdatesModule = 'virtual:wuyu-updates'
const resolvedUpdatesModule = `\0${virtualUpdatesModule}`
const updatesFilePath = resolve('content/updates.md')

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

function safeHref(value) {
  const href = String(value || '').trim()
  if ((href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#') || /^(https?:|mailto:)/i.test(href)) return href
  return '#'
}

function createSafeMarkdownRenderer() {
  const renderer = new marked.Renderer()
  renderer.html = () => ''
  renderer.link = function link({ href, title, tokens }) {
    const safeUrl = escapeHtml(safeHref(href))
    const linkText = this.parser.parseInline(tokens)
    const titleAttribute = title ? ` title="${escapeHtml(title)}"` : ''
    const external = /^(https?:|mailto:)/i.test(String(href || '').trim())
      ? ' target="_blank" rel="noopener noreferrer"'
      : ''
    return `<a href="${safeUrl}"${titleAttribute}${external}>${linkText}</a>`
  }
  return renderer
}

function renderUpdateMarkdown(value, inline = false) {
  return inline
    ? marked.parseInline(value, { renderer: createSafeMarkdownRenderer() })
    : marked.parse(value, { renderer: createSafeMarkdownRenderer() })
}

function parseUpdatesMarkdown(source) {
  const { content } = matter(source)
  const headings = [...content.matchAll(/^##\s+(.+?)\s*$/gm)]
  const records = headings.map((heading, index) => {
    const headingText = heading[1].trim()
    const match = headingText.match(/^(\d{4}-\d{2}-\d{2})\s*[｜|]\s*(.+)$/)
    if (!match) throw new Error(`更新记录标题格式错误：${headingText}`)

    const sectionStart = heading.index + heading[0].length
    const sectionEnd = headings[index + 1]?.index ?? content.length
    const lines = content.slice(sectionStart, sectionEnd).trim().split(/\r?\n/)
    const summaryLines = []
    let lineIndex = 0

    while (lineIndex < lines.length && lines[lineIndex].trim() === '') lineIndex += 1
    while (lineIndex < lines.length && /^>\s?/.test(lines[lineIndex].trim())) {
      summaryLines.push(lines[lineIndex].trim().replace(/^>\s?/, ''))
      lineIndex += 1
    }

    const summary = summaryLines.join('\n').trim()
    const items = lines
      .slice(lineIndex)
      .map(line => line.trim().match(/^[-*+]\s+(.+)$/)?.[1]?.trim())
      .filter(Boolean)

    return {
      date: match[1],
      title: match[2].trim(),
      summary,
      summaryHtml: summary ? renderUpdateMarkdown(summary, true) : '',
      items,
      detailsHtml: items.length ? renderUpdateMarkdown(items.map(item => `- ${item}`).join('\n')) : '',
      count: items.length,
    }
  })

  return records.sort((left, right) => right.date.localeCompare(left.date))
}

function readContentUpdates() {
  if (!fs.existsSync(updatesFilePath)) return []
  return parseUpdatesMarkdown(fs.readFileSync(updatesFilePath, 'utf8'))
}

function readRequestBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', chunk => {
      body += chunk
      if (body.length > 1_000_000) reject(new Error('更新记录内容不能超过 1 MB'))
    })
    request.on('end', () => resolveBody(body))
    request.on('error', reject)
  })
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
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
      if (id === virtualContentModule) return resolvedContentModule
      if (id === virtualUpdatesModule) return resolvedUpdatesModule
      return undefined
    },
    load(id) {
      if (id === resolvedContentModule) return `export default ${JSON.stringify(readContentPosts())}`
      if (id === resolvedUpdatesModule) return `export default ${JSON.stringify(readContentUpdates())}`
      return undefined
    },
    configureServer(server) {
      server.middlewares.use('/__wuyu/updates', async (request, response) => {
        if (request.method === 'GET') {
          const markdown = fs.existsSync(updatesFilePath)
            ? fs.readFileSync(updatesFilePath, 'utf8')
            : ''
          return sendJson(response, 200, { markdown })
        }

        if (request.method !== 'POST') {
          response.setHeader('Allow', 'GET, POST')
          return sendJson(response, 405, { error: '只支持 GET 和 POST' })
        }

        try {
          const payload = JSON.parse(await readRequestBody(request))
          const markdown = typeof payload.markdown === 'string' ? payload.markdown.trim() : ''
          if (!markdown) throw new Error('更新记录内容不能为空')
          const records = parseUpdatesMarkdown(markdown)
          if (records.length === 0) throw new Error('至少需要一条更新记录')

          const temporaryPath = `${updatesFilePath}.tmp`
          fs.writeFileSync(temporaryPath, `${markdown}\n`, 'utf8')
          fs.renameSync(temporaryPath, updatesFilePath)
          return sendJson(response, 200, { ok: true })
        } catch (error) {
          return sendJson(response, 400, { error: error instanceof Error ? error.message : '保存失败' })
        }
      })
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
