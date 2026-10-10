import contentPosts from 'virtual:wuyu-content'

export const posts = contentPosts

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug)
}

export function getPostByLegacyId(id) {
  return posts.find((post) => post.legacyId === String(id))
}

export function getPostsByCategory(category) {
  if (!category || category === '全部') return posts
  return posts.filter((post) => post.category === category)
}

export function getCategories() {
  return [...new Set(posts.map((post) => post.category).filter(Boolean))].sort()
}

export function getAdjacentPosts(slug) {
  const index = posts.findIndex((post) => post.slug === slug)
  if (index < 0) return { previous: undefined, next: undefined }

  return {
    previous: posts[index + 1],
    next: posts[index - 1],
  }
}

export function getArchiveGroups() {
  const groups = new Map()

  posts.forEach((post) => {
    const date = new Date(post.date)
    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const key = `${year}-${month}`
    const group = groups.get(key) || { key, year, month, posts: [] }
    group.posts.push(post)
    groups.set(key, group)
  })

  return [...groups.values()].sort((left, right) => right.key.localeCompare(left.key))
}
