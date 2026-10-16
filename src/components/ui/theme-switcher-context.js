import { createContext, useContext } from 'react'

export const ThemeSwitcherContext = createContext(null)

export function useThemeSwitcherTheme() {
  const context = useContext(ThemeSwitcherContext)
  if (!context) {
    throw new Error('useThemeSwitcherTheme must be used inside ThemeSwitcherProvider')
  }
  return context
}

// 导航栏动效设置也挂在同一个 context 上（Provider 内同时提供），
// 方便 Header / Settings 用一个 hook 取到全部设置。
export function useNavSettings() {
  const context = useContext(ThemeSwitcherContext)
  if (!context) {
    throw new Error('useNavSettings must be used inside ThemeSwitcherProvider')
  }
  return {
    navSettings: context.navSettings,
    updateNavSetting: context.updateNavSetting,
    resetNavSettings: context.resetNavSettings,
  }
}
