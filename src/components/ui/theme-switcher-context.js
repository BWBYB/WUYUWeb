import { createContext, useContext } from 'react'

export const ThemeSwitcherContext = createContext(null)

export function useThemeSwitcherTheme() {
  const context = useContext(ThemeSwitcherContext)
  if (!context) {
    throw new Error('useThemeSwitcherTheme must be used inside ThemeSwitcherProvider')
  }
  return context
}
