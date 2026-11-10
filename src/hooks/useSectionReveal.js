import { useEffect } from 'react'

// 整屏 section 进入视口时只淡入一次，避免页面挂载时把屏幕外的动画提前播完。
export default function useSectionReveal(selector = '.resume-section') {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(selector))
    if (sections.length === 0) return

    const showAll = () => {
      sections.forEach((section) => section.classList.add('is-visible'))
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      showAll()
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, {
      threshold: 0.35,
      rootMargin: '0px 0px -10% 0px',
    })

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [selector])
}
