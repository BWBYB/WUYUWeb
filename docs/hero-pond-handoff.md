# WUYUWeb 首页池塘 Hero — 执行交接

> 日期：2026-10-28  
> 状态：已执行（`agent/hero-pond` @ `52619a8`，本地分支，未推送）  
> 范围：桌面首页 hero  
> 基线：`agent/koi-fusion` @ `7372908`（本地分支，未推送）

## 0. 一句话

把首页 hero 从七层居中名片改成满屏空池：只保留左下角两行标识和右下角无字滚动浮标。导航、主题切换器、背景设置、Bento 全部不动。

## 1. 硬约束

- 旧 hero 的头像、在线状态、大标题、打字文本、说明、两个 CTA、三个社交链接、滚动提示、光斑全部删除，不保留、不隐藏、不注释。
- 题签、竖排中文、朱红印章、四角遥测标签（POND 001 / 3 KOI / 60 FPS）已明确否决，不要恢复。
- 桌面优先。本轮不做移动端布局设计，只保留一条 80px 顶部偏移保护，避免首屏高度错位。
- 只改 `src/pages/Home.jsx` 和 `src/pages/Home.css`。
- 不改 Header、导航、路由、文章、Bento 结构、主题切换器、背景设置面板、引擎默认参数。
- 不新增依赖。
- 不提交、不推送、不 stash、不执行 `git reset --hard` / `git checkout .` / `git clean`。
- 任何情况下都不要动 `main`。

## 2. 工作区基线（先保护）

本稿最初执行时，这 3 个调优文件尚未提交。它们已在 `7372908` 提交，并包含在 `agent/hero-pond` 的基线里，正常情况下不会再出现在 `git status` 中：

- `src/components/ui/background-settings.js`
  - 默认 `waveMode: 'cross'`、`wavelength: 1.25`、`waterLimit: 7`
- `src/lib/ascii-background.js`
  - 同步上述默认值；浅色水色改为 `[58, 72, 86]`；波峰细粒与 jitter 调整
- `src/styles/effects.css`
  - 浅色模式下玻璃卡片背景降到 `rgba(255,255,255,0.4)`，hover 为 `0.52`

执行前先确认：

```bash
git status --short --branch
```

预期只有 `agent/hero-pond`（以及未跟踪的 `docs/`）。如果这 3 个文件出现未提交改动，先看 `git diff 7372908 -- <文件>`；与描述不符就停止并报告，不要回滚、不要覆盖。

工作分支已建好：`agent/hero-pond`。若在新副本上重做，从 `agent/koi-fusion` 新建：

```bash
git switch -c agent/hero-pond
```

这批调优已在基线提交里。不要 commit 调优文件，不要 stash。最终说明 hero 改动时，只引用 Home.jsx / Home.css 的 diff：

```bash
git diff -- src/pages/Home.jsx src/pages/Home.css
```

## 3. 最终首屏

```
┌────────────────────────────────────────────────────────────┐
│       ┌──────────────────────────────────────────┐         │
│       │ WUYU   首页 文章 归档 实验室 CD机 设置   │         │
│       └──────────────────────────────────────────┘         │
│                                                            │
│                                                            │
│            ·        ~        .        ~        .           │
│                  ⌁                                         │
│      ~        .        ~        .        ~                 │
│                                                            │
│                       ⌁                                    │
│                                                            │
│                                                            │
│  ● WUYUWEB                                           ·     │
│    前端 · AI · 观察笔记   关于                        │     │
│                                                      ⌄     │
└────────────────────────────────────────────────────────────┘
```

- 首屏四个锚点：顶部导航胶囊、底部主题切换器、左下角字幕、右下角滚动浮标。中间完全留给水和鱼。
- UI 留在 1100px 主内容框内（实际内容宽 1052px，含 24px 内边距）；水体和鱼是全屏的，可以游出框。形成“界面是观测窗、池塘比界面大”的关系。
- 不要为了全幅使用 `100vw` 负 margin，避免滚动条导致的横向溢出。
- 首屏文案只保留：
  - `WUYUWEB`（h1）
  - `前端 · AI · 观察笔记`
  - `关于`
- `关于` 链接到 `/about`。
- 背景模式为 `ascii / aurora / none` 时，hero 都保持透明；没有任何卡片底色。

## 4. Home.jsx 改动

当前文件：

- `TypedText` 组件在约 8–40 行。
- 旧 hero 在约 48–104 行。
- Bento 从约 107 行开始。

### 4.1 删除

- 删除整个 `TypedText` 组件。
- 删除 `useState, useEffect` 导入；保留 `Link`，把 React 导入改为 `useRef`。
- 删除 hero 内的：
  - `.hero-glow-1` / `.hero-glow-2`
  - `.hero-inner`
  - `.hero-avatar-wrap`、`.hero-avatar`、`.hero-avatar-ring`、`.hero-status`
  - `.hero-main-title`
  - `.hero-typed-line`
  - `.hero-desc`
  - `.hero-actions` 及两个按钮
  - `.hero-social` 及三个链接
  - `.hero-scroll-hint`
- 删除 hero 上的 `fade-in fade-in-1` 类；入场动画改由新标签自己控制。

### 4.2 新 hero 结构

```jsx
<section className="hero-section" aria-labelledby="hero-title">
  <div className="hero-label" data-water-avoid>
    <div className="hero-label__name">
      <span className="hero-label__dot" aria-hidden="true" />
      <h1 id="hero-title" className="hero-label__title">WUYUWEB</h1>
    </div>
    <p className="hero-label__sub">
      前端 · AI · 观察笔记
      <Link to="/about" className="hero-label__link" data-water-dim>
        关于
      </Link>
    </p>
  </div>

  <button
    type="button"
    className="hero-scroll-float"
    aria-label="向下滚动"
    data-water-avoid
    onClick={scrollToContent}
  >
    <span className="hero-scroll-float__dot" aria-hidden="true" />
    <span className="hero-scroll-float__line" aria-hidden="true" />
    <span className="hero-scroll-float__chevron" aria-hidden="true" />
  </button>
</section>
```

引擎的鱼避让循环读取的是 `[data-water-avoid]`（见 `src/lib/ascii-background.js`），不是 `data-koi-avoid`；写错属性不会报错，只是鱼不会避开。

### 4.3 Bento ref 与滚动

- 给 `.bento-grid` 加 `ref={bentoRef}`，不改其内部结构。
- `Home` 内使用：

```jsx
const bentoRef = useRef(null)

function scrollToContent() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  bentoRef.current?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  })
}
```

- 滚动落点由 CSS 的 `scroll-margin-top` 控制，不要手算 `window.scrollTo`。
- 不要新增状态、不要新增 effect、不要监听 scroll 事件。

## 5. Home.css 改动

### 5.1 删除旧 hero 样式

删除 `Home.css` 中从 `.hero-section` 到 `.hero-scroll-hint` 的旧规则，以及相关 keyframes，当前约在 10–272 行。包括：

- `.hero-section`
- `html[data-water-bg="on"] .hero-section`
- `html[data-site-theme="light"][data-water-bg="on"] .hero-section`
- `.hero-glow` / `.hero-glow-1` / `.hero-glow-2`
- `@keyframes hero-glow-float`
- `.hero-inner`
- 所有 `.hero-avatar-*`、`.hero-status*`
- `.hero-main-title`
- `.hero-typed-line`、`.typed-cursor`、`@keyframes blink`
- `.hero-desc`
- `.hero-actions`、`.hero-btn*`
- `.hero-social*`
- `.hero-scroll-hint`、`.hero-scroll-arrow`、`@keyframes scroll-hint-bounce`

Bento 的样式从 `.bento-grid` 开始，保持不动。

删除后跑一次：

```bash
rg "hero-(glow|inner|avatar|status|main-title|typed|desc|actions|btn|social|scroll-hint|scroll-arrow)" src
```

预期无结果。如果其他页面引用这些类，停止并报告。

### 5.2 新 hero 样式

以下数值是基准，不要擅自放大成标题：

```css
.hero-section {
  --hero-top-offset: 96px;
  position: relative;
  min-height: calc(100vh - var(--hero-top-offset));
  min-height: calc(100svh - var(--hero-top-offset));
  border: 0;
  border-radius: 0;
  background: transparent;
}

/* 必须盖住 site-theme.css 的浅色 hero 底，否则浅色下会露出一块矩形水 */
html[data-site-theme="light"] .home .hero-section {
  background: transparent;
}

.hero-label {
  position: absolute;
  left: 0;
  bottom: 24px;
  z-index: 1;
  display: grid;
  gap: 8px;
  max-width: 280px;
}

.hero-label::before {
  content: "";
  width: 12px;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
}

.hero-label__name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-label__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.55;
}

.hero-label__title {
  margin: 0;
  color: var(--text-h);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  line-height: 1.2;
}

.hero-label__sub {
  margin: 0;
  color: var(--text);
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.7;
}

.hero-label__link {
  margin-left: 12px;
  color: inherit;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.hero-label__link:hover,
.hero-label__link:focus-visible {
  opacity: 1;
  border-bottom-color: currentColor;
}

.hero-label__link:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 4px;
  border-radius: 2px;
}

.hero-scroll-float {
  position: absolute;
  right: 0;
  bottom: 24px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 40px;
  height: 56px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.hero-scroll-float:hover,
.hero-scroll-float:focus-visible {
  opacity: 1;
}

.hero-scroll-float:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 4px;
  border-radius: 4px;
}

.hero-scroll-float__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: hero-float-bob 6s ease-in-out infinite;
}

.hero-scroll-float__line {
  width: 1px;
  height: 28px;
  background: currentColor;
  opacity: 0.8;
}

.hero-scroll-float__chevron {
  width: 6px;
  height: 6px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  opacity: 0.95;
}

@keyframes hero-float-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
```

浮标是唯一滚动指引：容器 `0.85`、竖线 `0.8`、箭头 `0.95`，浅色水面上三项均 ≥3:1。不要把透明度降回 `0.55 / 0.55 / 0.7`（浅色下几乎不可见）。

### 5.3 入场与间距

```css
.hero-label {
  animation: hero-label-in 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.hero-scroll-float {
  animation: hero-float-in 600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}

@keyframes hero-label-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-float-in {
  from { transform: translateY(4px); }
  to { transform: translateY(0); }
}
```

`hero-float-in` 只动画 `transform`，不把 `opacity` 写进 `fill-mode: both`，否则会锁死 hover 的透明度；基础透明度由 5.2 的容器规则控制。

### 5.4 滚动落点与窄桌面保护

```css
.bento-grid {
  scroll-margin-top: 96px;
}

@media (max-width: 1200px) {
  .hero-scroll-float {
    bottom: 96px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    --hero-top-offset: 80px;
  }

  .bento-grid {
    scroll-margin-top: 80px;
  }
}
```

- `<=1200px` 只把浮标抬高，避免和右下角背景设置圆点重叠；这不是移动端设计，不放宽其他布局。
- `<=768px` 只修首屏高度，不重排标签和浮标。

### 5.5 减少动效

```css
@media (prefers-reduced-motion: reduce) {
  .hero-label,
  .hero-scroll-float,
  .hero-scroll-float__dot {
    animation: none;
  }

  .hero-label__link,
  .hero-scroll-float {
    transition: none;
  }
}
```

## 6. 视觉与交互规则

- 标签里的 4px 圆点默认不动；只有右下角浮标的点做 6 秒上下呼吸，避免两个循环焦点。
- 鼠标悬停 `关于` 时下划线出现；键盘聚焦同样可见。
- 滚动浮标悬停只提高透明度；不要新增自定义光标。
- 点击水面继续走现有喂鱼/涟漪逻辑，不新增引擎代码。
- 鱼继续只在 hero；不给标签加底块，依靠引擎现有的 `.main h1/p` 局部压暗，`关于` 链接用 `data-water-dim`。
- 标签和滚动浮标都加 `data-water-avoid`（引擎实际读取的属性），让鱼避开。
- 不实现引导鱼横穿、Bento 滚动淡入、浮标随滚动下沉；这些属于 P2，本轮不做。

## 7. 实施顺序

### P0：静态骨架（必须）

1. 完成 Home.jsx 删除与替换。
2. 完成 Home.css 删除与新增。
3. 跑 `npm run lint` 和 `npm run build`。
4. 在 1440×900 下确认首屏高度、Bento 第二屏、无横向滚动、导航和主题切换器不变。

### P1：视觉语言（必须）

1. 入场动画、浮标呼吸、悬停/聚焦下划线。
2. reduced motion。
3. 1024 / 1280 / 1440 / 1920 下检查浮标与设置点、主题切换器不重叠。
4. 浅色/深色各截图一次。

### P2：可选，本轮不做

- 浮标随滚动下沉/淡出。
- Bento 进入视口时 12px 淡入。
- 引导鱼入场横穿、hero 内自定义光标环。

如果 P0/P1 完成后用户额外要求，再单独评估；不要顺手加。

## 8. 验收清单

### 命令

```bash
npm run lint
npm run build
```

### 视口与主题

- 1440×900：首屏 hero 底部贴齐视口，Bento 从第二屏开始。
- 1920×1080：同上；UI 仍在 1100 内容框内，水和鱼可以游出框。
- 1280×800、1024×768：滚动浮标不与右下设置点重叠。
- 浅色、深色各一遍；浅色文字可读，局部压暗不变成明显黑块。

### 功能

- [ ] 旧 hero 七层完全移除，无残留 DOM / CSS。
- [ ] 首屏只剩 `WUYUWEB`、`前端 · AI · 观察笔记`、`关于`。
- [ ] 导航胶囊位置、尺寸、交互不变。
- [ ] 底部主题切换器位置、尺寸、交互不变。
- [ ] 右下背景设置点可正常打开面板。
- [ ] 点击滚动浮标平滑滚到 Bento；减少动效时即时滚动。
- [ ] 点击水面仍有喂鱼/涟漪。
- [ ] `关于` 链接可点击，Tab 可到达，焦点可见。
- [ ] 滚动浮标可键盘触发，`aria-label` 正确。
- [ ] 背景模式 `ascii / aurora / none` 切换正常；面板设置可持久化。
- [ ] 0 console 报错。
- [ ] 60fps（桌面标签页可见时），3 条鱼。
- [ ] `document.documentElement.scrollWidth === window.innerWidth`，无横向滚动。
- [ ] 鱼不穿过左下标签（观察 30 秒）。
- [ ] `prefers-reduced-motion` 下没有循环动画。

## 9. 风险与回退

- **局部压暗变成深色方块**：先检查浅色主题。如果明显，优先提高标签文字对比度或微调位置，不要加卡片底块。
- **鱼穿过标签**：先依赖 `data-water-avoid`；仍穿过就把标签上移 24px 或缩窄到 240px，不改引擎。
- **浮标和设置点重叠**：优先用 `<=1200px` 的 `bottom: 96px` 保护；不要移动设置点。
- **1920 下 1100 框偏窄**：这是“观测窗”的刻意选择。不要在本轮改成 `100vw` 全幅；需要的话另开方案。
- **基线调优文件出现未提交改动**：立即停止，报告差异；不要回滚、不要覆盖（基线版本在 `7372908`）。
- **hover 透明度被入场动画锁住**：把入场动画改成只动 `transform`，透明度交给基础规则。

## 10. 交付格式

完成后按以下格式汇报：

```text
分支：
修改文件：
- src/pages/Home.jsx
- src/pages/Home.css

受保护、未改动：
- src/components/ui/background-settings.js
- src/lib/ascii-background.js
- src/styles/effects.css

命令结果：
- npm run lint:
- npm run build:

验收结果：
- 1440×900:
- 1920×1080:
- 1280×800 / 1024×768:
- 浅色/深色:
- 键盘 / reduced motion:
- console / fps / 横向滚动:

截图路径：

遗留问题：

提交状态：52619a8（本地分支，未推送）
```

不要执行 `git add`、`git commit`、`git push`。不要清理 `.playwright-cli/`、`/tmp` 以外的用户文件；自己启动的临时进程要关闭，但不要杀已有的 dev server。

## 11. 给执行 Agent 的开场指令

```text
请按 docs/hero-pond-handoff.md 执行 P0 + P1。先读文档和当前 Home.jsx / Home.css / Layout.css，确认 3 个调优文件已包含在基线提交 `7372908`（工作区干净）。只改 src/pages/Home.jsx 和 src/pages/Home.css；不改引擎、Header、路由、Bento、设置面板。不 commit、不 push、不 stash。完成后按文档第 10 节格式汇报 diff、截图和验收结果。
```
