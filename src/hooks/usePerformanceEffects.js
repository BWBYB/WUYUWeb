import { useEffect, useState } from 'react'

const STORAGE_KEY = 'my-blog-performance-effects'
const CHANGE_EVENT = 'my-blog-performance-effects-change'

function readPerformanceEffectsSetting() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function usePerformanceEffects() {
  const [enabled, setEnabled] = useState(readPerformanceEffectsSetting)

  useEffect(() => {
    const handleChange = (event) => {
      if (typeof event.detail === 'boolean') {
        setEnabled(event.detail)
      } else {
        setEnabled(readPerformanceEffectsSetting())
      }
    }

    window.addEventListener(CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(CHANGE_EVENT, handleChange)
  }, [])

  const updateEnabled = (nextEnabled) => {
    setEnabled(nextEnabled)

    try {
      window.localStorage.setItem(STORAGE_KEY, String(nextEnabled))
    } catch {
      // The in-memory state still works when storage is unavailable.
    }

    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: nextEnabled }))
  }

  return [enabled, updateEnabled]
}
