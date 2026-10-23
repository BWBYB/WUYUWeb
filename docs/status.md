# Status

## Goal

把导航栏分裂态的「设置」入口从跳转 `/settings` 改为原地展开：右侧导航条向下拉伸成设置小窗口，上边界固定、宽度不变、圆角恒定。

## Completed

**一期 · 分层时序**（`3e680c1`）

- 几何 500ms 主轴；面板透明度 80ms 延迟 / 200ms；图标退场 0ms / 140ms
- 关闭方向图标延迟 200ms，等面板淡出后再浮现
- `fieldset` 加 `align-self: flex-start`，修复图标随容器长高下移

**二期 · 面板真实内容**（`1603fc7`）

- 新增 `src/components/NavSettingsPanel.jsx`：4 项控件 + 底部两个操作
- 主题三态（浅色/深色/系统）接 `setTheme`，`aria-pressed` 同步
- 倍速滑块 0.1–3（step 0.01）接 `updateNavSetting('animationSpeed')`
- 分裂时长滑块 0.2–1.2s（step 0.01）接 `updateNavSetting('stretchDuration')`
- 高耗能开关 `role="switch"` + `aria-checked`，接 `usePerformanceEffects`
- 底部「恢复默认」接 `resetNavSettings`，「详细设置」跳转后关闭面板
- 面板高度 200px → 280px，圆角仍 `--nav-height/2` = 31.5px
- 视觉修正两处：面板补 `color-mix(in srgb, var(--nav-content-color) 6%, transparent)` 自身底色（浅色下与页面糊在一起）；底部「恢复默认」显式设 `color: var(--nav-content-color)`（原继承外层暗色）

**其他**

- 设置小窗口雏形（`ed1272f`）：⚙ 改 `<button>`，分裂态展开、合并态跳转，三种关闭方式
- 文章正文塌陷修复 `.post-content { grid-column: 2 }`（`c43f9d2`）
- `/lab`、`/player` 路由级懒加载，three.js 脱离首屏（`639bb33`）
- 文档面重建 README / AGENTS.md / status.md / llms.txt（`79b754e`），补内容必填字段（`6e61558`）

## In Progress

- 二期待人工验收：功能已提交 `1603fc7`，手感尚未由用户实测确认

## Next

- 验收二期：真实滚动进入分裂态，点 ⚙ 展开，观察开/关两向的图标与面板先后次序
- 三期可访问性：⚙ 补 `aria-expanded` / `aria-controls`，面板关闭时 `inert`，Esc 关闭，关闭后焦点回 ⚙

## Blocked

- 无

## Evidence

- 分支 `agent/navigation-experiment`，HEAD `1603fc7`（二期代码）
- `npm run lint`：18 warnings / 0 errors（无新增；`rules-of-hooks` 为 error 级且无违规）
- `npm run build`：通过，主包 350 kB（gzip 116 kB），ThreeHero 533 kB 独立 chunk
- 展开态实测：`pill.top` 恒 16px、高 280px、宽 260px、圆角 31.5px
- 倍速拉到 2× → `--nav-stretch-duration` 为 0.250s，滑块 / 输出 / 存储三处同步
- 主题切「浅色」→ `documentElement.dataset.siteTheme = light`，写入 `my-blog-theme-switcher-theme`
- 开关 → `aria-checked=true`，旋钮 `translateX(14px)`，写入 `my-blog-performance-effects`
- 「恢复默认」→ 回到 1.00× / 0.50s

## Last Updated

2026-10-23
