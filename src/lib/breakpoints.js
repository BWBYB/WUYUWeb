// 全站断点：CSS 的 @media 不能写 var()，所以这里给 JS 用常量，
// CSS 里写字面值，由 scripts/check-styles.mjs 校验白名单与降序。
export const BREAKPOINTS = {
  wide: 1200,
  tablet: 900,
  mobile: 768,
  small: 600,
}

export const MEDIA = {
  wide: `(max-width: ${BREAKPOINTS.wide}px)`,
  tablet: `(max-width: ${BREAKPOINTS.tablet}px)`,
  mobile: `(max-width: ${BREAKPOINTS.mobile}px)`,
  small: `(max-width: ${BREAKPOINTS.small}px)`,
}
