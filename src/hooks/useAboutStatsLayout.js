import { useEffect, useState } from 'react'

// 关于页六项统计的横向位置：
//   balanced = 左右留白相等（当前版，左内距 96）
//   flush    = 贴左满宽（老版本，左边 0、右边 127.5）
const STORAGE_KEY = 'my-blog-about-stats-layout'
const CHANGE_EVENT = 'my-blog-about-stats-layout-change'

export const ABOUT_STATS_LAYOUTS = ['balanced', 'flush']
// 默认关闭缩进：六项统计与状态行左缘齐平（33），与站点主人 Chrome 里的设置一致
export const DEFAULT_ABOUT_STATS_LAYOUT = 'flush'

function normalizeLayout(value) {
  return ABOUT_STATS_LAYOUTS.includes(value) ? value : DEFAULT_ABOUT_STATS_LAYOUT
}

function readAboutStatsLayout() {
  if (typeof window === 'undefined') return DEFAULT_ABOUT_STATS_LAYOUT

  try {
    return normalizeLayout(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_ABOUT_STATS_LAYOUT
  }
}

export function useAboutStatsLayout() {
  const [layout, setLayout] = useState(readAboutStatsLayout)

  useEffect(() => {
    const handleChange = (event) => {
      setLayout(
        normalizeLayout(
          typeof event.detail === 'string' ? event.detail : readAboutStatsLayout(),
        ),
      )
    }

    window.addEventListener(CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(CHANGE_EVENT, handleChange)
  }, [])

  const updateLayout = (next) => {
    const value = normalizeLayout(next)
    setLayout(value)

    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // 存储不可用时内存态仍然生效
    }

    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }))
  }

  return [layout, updateLayout]
}
