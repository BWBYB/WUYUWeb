# Status

## Goal

把导航栏分裂态的「设置」入口从跳转 `/settings` 改为原地展开：右侧导航条向下拉伸成设置小窗口，上边界固定、宽度不变、圆角恒定。

## Completed

- 分裂态点 ⚙ 展开设置面板；合并态仍跳转 `/settings`
- 几何约束达成：上边界 16px 零位移、宽度 260px 不变、圆角恒 `--nav-height/2`（31.5px）
- 分层时序重构：几何 500ms 主轴；面板透明度 80ms 延迟 / 200ms；图标退场 0ms / 140ms
- 关闭方向图标延迟 200ms，等面板淡出后再浮现
- `fieldset` 加 `align-self: flex-start`，修复图标随容器长高下移
- 三种关闭方式：再点 ⚙、点面板外部、分裂态自动合并
- 文章正文塌陷修复：`.post-content { grid-column: 2 }`
- `/lab`、`/player` 路由级懒加载，three.js 脱离首屏（主包 578 kB → 350 kB）
- `dist/` 重建至 HEAD

对应提交：`ed1272f`（面板雏形）、`c43f9d2`（正文）、`639bb33`（懒加载）、`3e680c1`（分层时序）。

## In Progress

- 设置面板内容仍是 3 行占位文字（「动画快慢 / 主题 / 其他」，`src/components/Header.jsx`），未接真实控件

## Next

- 面板接入 4 项真实设置：主题三态、动画倍速、分裂时长、高耗能组件开关 + 底部「恢复默认 / 详细设置」
- 面板高度从 200px 调到约 280px（按 4 项内容实测后确定）
- 可访问性：⚙ 补 `aria-expanded` / `aria-controls`，面板关闭时 `inert`，Esc 关闭，关闭后焦点回到 ⚙

## Blocked

- 无

## Evidence

- 分支 `agent/navigation-experiment`，HEAD `3e680c1`，工作区干净
- `npm run lint`：18 warnings / 0 errors（`rules-of-hooks` 为 error 级且无违规）
- `npm run build`：成功，2.73s，100 modules；主包 350 kB（gzip 116 kB），ThreeHero 533 kB 独立 chunk
- 展开前后实测：`pill.top` 恒 16px、左右边界 971/1231、宽 260px、圆角 31.5px
- 计算样式：打开时面板 `delay 0.08s`、图标 `delay 0s / 0.14s`；关闭时图标 `delay 0.2s`

## Last Updated

2026-10-23
