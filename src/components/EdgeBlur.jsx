import { useThemeSwitcherTheme } from './ui/theme-switcher-context'
import './EdgeBlur.css'

// 视口上下边缘的纯模糊层：全站渲染一次，导航与主题切换器在更高层。
export default function EdgeBlur() {
  const { edgeBlurSettings } = useThemeSwitcherTheme()

  if (!edgeBlurSettings.enabled) return null

  return (
    <>
      <div className="edge-blur edge-blur--top" aria-hidden="true" />
      <div className="edge-blur edge-blur--bottom" aria-hidden="true" />
    </>
  )
}
