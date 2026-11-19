import { createContext, useContext } from 'react'

// 页面可请求 Header 保持分裂（里程碑导航停靠时用）。
// 默认 no-op，脱离 Layout 渲染时也不会报错。
export const HeaderPinContext = createContext(() => {})

export function useHeaderPin() {
  return useContext(HeaderPinContext)
}
