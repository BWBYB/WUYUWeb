# 样式规范

> 状态：现行。由 `scripts/check-styles.mjs` 守门，存量例外记在 `scripts/style-baseline.json`。
> 适用范围：`src/` 下的 CSS 与组件样式。

## 索引

| 想查什么 | 章节 |
| --- | --- |
| 哪些文件受约束、哪些豁免 | 一、适用范围与豁免 |
| 字号、字重、行高 | 二、字号 |
| 语义颜色与三种模式 | 三、颜色 |
| 页面骨架、断点、层级、间距、圆角 | 四、页面骨架、间距与圆角 |
| 动效时长与降级 | 五、动效 |
| 自动检查与 baseline | 六、检查 |
| 提交前跑什么 | 七、提交前 |
| 已知债务 | 八、已知债务 |
| 改某个决定该动哪个文件 | 九、修改入口 |
| 图片比例与图标 | 十、图片与图标 |
| 按钮、表单、卡片、链接与展示组件 | 十一、组件 |
| 各 md 的职责 | 十二、文档分工 |

## 一、适用范围与豁免

| 区域 | 约束 |
| --- | --- |
| 页面、共享组件、导航、主题切换器 | 完全约束 |
| `src/pages/Player.css` | 文本受约束；磁带物理标签与图标例外 |
| `src/styles/tokens.css` | token 与颜色源文件，允许裸 hex |
| `src/pages/Lab.css`、`src/components/lab/`、`ThreeHero.css` | 豁免，保留演示视觉语言 |

豁免不是永久许可证。新增豁免必须写进本文件，并在 PR/提交说明里写原因。

## 二、字号（已落地）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--fs-micro` | 12px | 元信息、标签、面板说明 |
| `--fs-ui` | 14px | 导航、页脚、次要正文、控件 |
| `--fs-body` | 16px | 正文、卡片标题 |
| `--fs-lead` | 18px | 导语、列表摘要 |
| `--fs-heading-sm` | 20px | 区块标题、文章 h2/h3 |
| `--fs-heading-md` | 24px | 列表标题 |
| `--fs-heading` | 28px | 大区块标题、移动端页面标题 |
| `--fs-display` | 36px | 桌面页面标题、文章标题 |

### 字重

只使用已加载的三档，不声明 700（`font-synthesis: none` 下会静默回退到 600）：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--fw-regular` | 400 | 正文、摘要、引用 |
| `--fw-medium` | 500 | 标签、按钮、卡片次级标题 |
| `--fw-semibold` | 600 | 页面标题、文章标题、强调 |

`index.html` 加载 IBM Plex Mono 300/400/500/600（代码、ASCII 与 Lab 样张）、Noto Serif SC 400/600（中文衬线），`src/index.css` 另声明得意黑 Smiley Sans（标签）。英文与数字全站统一使用自托管的 Anthropic Serif TTF（`src/assets/fonts/AnthropicSerifWebText.ttf`，只有 400 一档，`src/index.css` 声明）；Anthropic Sans 与 Anthropic Mono 已停止加载。新增字重前必须先改字体 URL。

全站正文、标题、元信息与日期统一使用同一套 `--serif-editorial`（英文 Anthropic Serif → 中文思源宋体）；`--sans`、`--serif`、`--mono`、`--accent-font`、`--post-date-font` 都是它的别名，不再引入第二种 Anthropic 字体。中文统一由回退字体渲染（Anthropic Serif 无中文字形）。仅两处例外：导航走 `--nav-font`（PingFang 黑体栈），标签走 `--tag-font`（得意黑）。

全站英文与数字统一为 Anthropic Serif；单字重 400，`font-synthesis: none` 关闭合成粗体，500/600 的英文按 400 渲染，中文仍按思源宋 600 渲染。日期、正文数字与标题数字都走同一套栈，不再区分等宽。

信息型小字（分类、脚注、kicker，12–14px）与页脚文字使用 `--accent-font`（同一 Serif 栈）；导航项与更多面板使用 `--nav-font`（PingFang 黑体）；所有标签（分类、文章标签、技术栈胶囊）使用 `--tag-font`（得意黑）；导航 Logo 用 Serif 600（合成粗体，宽度按实测 em 值裁切）。代码块、ASCII 画与等宽字体样张使用 `--mono-fixed`（IBM Plex Mono），数字必须留在等宽网格里。

### 行高

| Token | 值 | 用途 |
| --- | --- | --- |
| `--lh-tight` | 1.15 | 36px 展示标题 |
| `--lh-heading` | 1.3 | 页面/文章/卡片标题 |
| `--lh-ui` | 1.5 | 控件、标签、短说明 |
| `--lh-body` | 1.7 | 正文、长文、列表 |

规则：

1. 只写 `font-size: var(--fs-*)`，不写裸 px。
2. 字重只写 `var(--fw-*)`；行高只写 `var(--lh-*)`，且必须无单位。
3. 响应式只改 token（`@media (max-width: 768px)` 里覆盖 `--fs-*`），页面不各自调字号。
4. 中文标题字距 0~+0.01em，**禁止负字距**；正文行高 1.7，标题 1.15–1.3。
5. 确实需要新档位时，先改本文件和 `index.css`，不要在组件里临时加。

例外：图标字形与单行控件允许 `line-height: 1`（几何对齐）；Player 磁带的装饰字重与行高保留裸值。它们由 baseline 记录。

## 三、颜色

颜色按用途分六组，组件只引用语义 token，不判断当前模式：

| 组 | Token |
| --- | --- |
| 表面 | `--surface-canvas` / `--surface-card` / `--surface-card-hover` / `--surface-inset` / `--surface-glass` |
| 内容 | `--content-strong` / `--content-default` / `--content-muted` / `--content-inverse` / `--content-on-accent` |
| 描边 | `--border-subtle` / `--border-strong` / `--border-glass` |
| 行动 | `--accent` / `--accent-secondary` / `--accent-tertiary` / `--accent-soft` / `--focus-ring` |
| 状态 | `--danger` |
| 选择 | `--selection-bg` / `--selection-fg` |

旧名 `--bg`、`--text-h`、`--accent-1..3` 等只作为迁移别名保留在 `index.css`，新代码不要使用。

规则：

1. 新代码不出现 `#rrggbb`、`rgba()`；颜色定义只放在 `src/styles/tokens.css`。
2. 主题差异只通过 `[data-site-theme]`、`[data-paper]`、`--paper-mix` 改变量，组件里禁止 `if (paper)` 分支。
3. 纸色用 `--paper-mix` 在白色与暖纸之间插值；强调色整组切换，不参与混合。
4. 全站不引入蓝、紫、青作为强调色；需要新颜色时先判断它属于六组中的哪一组。
5. 对比度：正文对画布/卡片 ≥ 4.5:1，弱文字 ≥ 3:1，强调色作为文字 ≥ 4.5:1，焦点圈对相邻色 ≥ 3:1。

## 四、页面骨架、间距与圆角

### 页面骨架（已落地）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--page-max` | 1100px | 首页、关于、设置、简历 |
| `--page-compact` | 820px | 文章列表、归档、时间线 |
| `--page-top` | 16px | 所有页面统一顶部留白 |
| `--page-header-gap` | 48px | 页头与正文之间 |

规则：

1. 页面外框统一 `width: 100%; max-width: var(--page-*); margin-inline: auto; padding-top: var(--page-top)`。
2. 页头标题统一 `--fs-display` / `--lh-heading`，描述统一 `--fs-body` / `--lh-body`；列表页描述限制在 `--measure`，文章页跟随 `--measure-post`。
3. 页头与正文间距统一 `--page-header-gap`，不再各页写 32 / 40 / 64。
4. 文章详情正文使用 `--measure-post`（65ch），页面宽度 = 正文 + 左右内边距；不设左侧目录列，章节目录用右下角目录岛（`TocIsland`，≤1200 与打印隐藏）。
5. Player 与 Lab 不参与页面骨架。

### 响应式断点（已落地）

| 名称 | 值 | 用途 |
| --- | --- | --- |
| `wide` | 1200px | 宽屏、浮层避让 |
| `tablet` | 900px | 平板横向、小桌面 |
| `mobile` | 768px | 移动端主断点 |
| `small` | 600px | 窄屏 |

规则：

1. 全站桌面优先，只用 `max-width`，禁止 `min-width`。
2. 同一文件内断点必须从大到小排列。
3. CSS 的 `@media` 不能写 `var()`；断点值以本表为准，JS 用 `src/lib/breakpoints.js`。
4. 不允许新增 1024、992、480 这类近似值；由 `check-styles` 拦截。
5. `≤600` 时导航常驻分裂态，滚动与回顶部都不再合并；行为在 `Header.jsx` 的 `MEDIA.small` 判断里。

### 层级（已落地）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--z-background` | -1 | 画布、玻璃伪元素 |
| `--z-raised` | 10 | 组件内抬升（预留） |
| `--z-sticky` | 100 | 顶栏 |
| `--z-dock` | 1000 | 底部主题切换器 |
| `--z-dock-panel` | 1100 | 背景设置面板，盖住 dock |
| `--z-modal` | 1200 | 右下目录岛（TocIsland） |

规则：

1. 全局浮层只用 `var(--z-*)`；组件内部相对层级保留小整数（导航 2 / 12 / 16、Player 1 / 10）。
2. 导航内部使用局部变量 `--nav-z-base` / `--nav-z-panel` / `--nav-z-fieldset`，不进入全局阶梯。
3. z-index 不能跨 stacking context；弹窗必须 portal 到根层级，否则写 9999 也盖不过 header。
4. 背景只用负层，内容不用负值；禁止新增 999、9999。

### 间距（已落地）

8 档，4px 基准：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--space-1` | 4px | 贴边、徽标内边距 |
| `--space-2` | 8px | 图标与文字、列表间隙 |
| `--space-3` | 12px | 控件内边距、小卡片 |
| `--space-4` | 16px | 常规内边距、卡片间距 |
| `--space-5` | 24px | 区块内边距、段落间距 |
| `--space-6` | 32px | 大区块间距 |
| `--space-7` | 48px | 章节之间 |
| `--space-8` | 64px | 页面级大留白 |

规则：

1. `padding` / `margin` / `gap` 只写 `var(--space-*)`；`0`、`auto`、`%` 例外。
2. 负 margin、`calc()` 里的布局补偿、`scroll-margin` 不算设计间距，保留原值并记入 baseline。
3. 响应式不单独调间距 token；需要压缩时改容器与流式布局，避免同一组件出现第二套间距。
4. 例外：`Header.css`、`navigation-switcher.css`、`theme-switcher.css` 的胶囊几何，`Layout.css` 的 72px 顶栏偏移，`Player.css` 的磁带物理布局。

### 阴影与边框（已落地）

阴影分三层，共用一组几何参数：

| Token | 用于 | 几何 |
| --- | --- | --- |
| `--shadow-1` | 卡片、列表项 | 基准 × 0.35 |
| `--shadow-2` | 下拉、面板、主题切换器 | 基准 × 0.7 |
| `--shadow-3` | 导航胶囊、浮层 | 基准 × 1 |

边框分两套强度：

| 变量 | 作用 |
| --- | --- |
| `--border-strength` | 普通边框（卡片、分隔、输入框） |
| `--glass-strength` | 玻璃边框（胶囊、玻璃卡片边缘） |

规则：

1. 组件不写裸 `box-shadow`；卡片用 `--shadow-1`，浮层用 `--shadow-2`，导航用 `--shadow-3`。
2. 玻璃的 8 层 inset 高光属于材质例外，保留在 `Header.css` / `theme-switcher.css` / `components.css`（玻璃按钮）；外投影仍必须走 `--shadow-2/3`。
3. 设置页「阴影与边框」卡片是唯一入口，导航与主题切换器不再各自提供阴影滑块。
4. Player、Lab 的物理阴影豁免。

### 玻璃材质（已落地）

三档强度，全部来自 `--glass-neutral`，不新增第四档：

| 层 | 透明底 | 用途 |
| --- | --- | --- |
| 容器 | 12%（`--glass-card-opacity`） | 卡片、空状态面板、分段轨道、面包屑胶囊 |
| 选中 | 32% | 分段指示器、导航选中胶囊 |
| 强调 | `--accent-soft` + 赭石描边 | accent 标签、状态徽标 |

规则：

1. 8 层 inset 只给厚玻璃面板（卡片、空状态、按钮、导航）；标签、分段轨道、面包屑等小件用 4 层，避免描边过密。
2. 一层 blur：同一组件树只让最外层容器挂 `backdrop-filter`，子元素只做 inset 高光。分段轨道的 blur 在轨道上，指示器不再叠。
3. 亮暗差异只由 `--glass-reflex-light` / `--glass-reflex-dark` 控制，组件不写模式分支。
4. 玻璃只包裹有表面的组件；正文链接与默认面包屑保持纯文字。

### 圆角（已落地）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--radius-sm` | 8px | 控件、输入框、小卡片 |
| `--radius-md` | 12px | 常规卡片、标签 |
| `--radius-lg` | 16px | 大卡片、面板 |
| `--radius-pill` | 999px | 胶囊、导航、标签按钮 |
| `--radius-circle` | 50% | 正圆 |

规则：

1. 常规圆角只用 sm / md / lg 三档，不写 10px、14px、18px。
2. 胶囊用 `--radius-pill`，正圆用 `--radius-circle`；`calc(高度 / 2)` 属于几何计算，保留原值并记入 baseline。
3. Player 磁带的物理圆角豁免，不参与统一。

## 五、动效

- 导航相关时长从 `--nav-stretch-duration` 派生，不写死毫秒。
- 主题切换只过渡颜色，挂 `data-theme-anim` 700ms，用完即摘。
- 所有动画在 `prefers-reduced-motion` 下必须降级或关闭。
- 玻璃淡入淡出与面板展开的先后顺序写在 `Header.css` 注释里，改动前先读。

## 六、检查

```bash
npm run check:styles
```

脚本只拦「新增」违规，存量走 `scripts/style-baseline.json`：

| 规则 | 说明 |
| --- | --- |
| 裸 `font-size` | 超出 baseline 即失败 |
| 负字距 | 中文标题的主要退化方式 |
| 裸间距 | `padding` / `margin` / `gap` 中新增 px |
| 裸圆角 | 新增 px / % 圆角；胶囊与正圆必须用 token |
| 裸字重 | 新增数字字重即失败 |
| 裸行高 | 新增无单位 / px 行高即失败（`1` 的图标例外走 baseline） |
| 全局 z-index | ≥100 的裸值即失败，必须用 `--z-*` |
| 裸 hex | `src/styles/tokens.css` 之外新增颜色即失败 |

确认是合理例外时：

```bash
node scripts/check-styles.mjs --update
```

然后**必须 review baseline 的 diff**，只接受确实无法 token 化的条目（图标、装饰字、玻璃高光）。不要为了让检查通过而整体刷新 baseline。

## 七、提交前

```bash
npm run lint
npm run check:styles
npm run build
```

涉及颜色的改动，再补一轮视觉检查：1440 / 768 / 390 × 深色 / 冷白 / 纸色，至少看首页、文章页、设置页。

## 八、已知债务

| 项 | 说明 |
| --- | --- |
| `site-theme.css` | 浅色与纸色各写一套元素级覆盖，应改为变量切换 |
| 旧颜色别名 | 组件仍在用 `--bg` / `--text-h` 等旧名，需按区域迁移到语义 token |
| 几何圆角 | Header 的 `calc(高度 / 2)`、Player 的 39 处物理圆角保留裸值 |
| 几何间距 | Header / 导航 / 切换器 / Player 的胶囊与磁带尺寸仍用裸 px |
| `Player.css` | 20 处装饰字号、56 处物理间距保留，等装饰 token 方案 |
| 单字重 | Anthropic Serif 只有 400，英文 500/600 默认无合成粗体；导航 Logo 例外，单独开了 `font-synthesis: weight` |
| `Lab` | 永久豁免，不参与统一 |

## 九、修改入口

改样式前先查这张表，不要直接在页面里加裸值。

| 想改什么 | 入口 | 注意 |
| --- | --- | --- |
| 全局颜色 / 语义 | `src/styles/tokens.css` 的 `:root`、`[data-site-theme="light"]`、`[data-paper="on"]` | 先判断属于六组中的哪一组；组件里不写颜色 |
| 新增一个语义色 | 同上，三种模式都要给值 | 深色、白色、纸色缺一不可；纸色用 `--paper-mix` 插值 |
| 纸色强度 / 开关 | `src/components/ui/background-settings.js`、`src/components/Layout.jsx` | 默认值与范围在 settings；`--paper-mix` 由 Layout 写到根元素 |
| 基础字体 | `src/styles/tokens.css` 的字栈、`src/index.css` 的 `@font-face` | 全站只用 Anthropic Serif；Sans/Mono 已停用；导航 `--nav-font`（黑体）、标签 `--tag-font`（得意黑）、Logo Serif 合成粗体、代码/ASCII `--mono-fixed` |
| 字号 | `src/styles/tokens.css` 的 `--fs-*` | 8 档已固定；移动端在 `max-width: 768px` 覆盖 |
| 字重 | `src/styles/tokens.css` 的 `--fw-*`、`index.html` 的字体 URL | 三档 400/500/600；不声明 700 |
| 行高 | `src/styles/tokens.css` 的 `--lh-*` | 四档；`1` 只用于图标几何对齐 |
| 间距 | `src/styles/tokens.css` 的 `--space-1..8` | 只用于 padding / margin / gap；几何与装饰值豁免 |
| 页面骨架 / 容器宽度 | `src/styles/tokens.css` 的 `--page-*`、各页面根类 | wide 1100 / compact 820；页头间距与顶部留白统一走 token |
| 响应式断点 | `src/lib/breakpoints.js`、各 CSS 的 `@media` | 只用 1200 / 900 / 768 / 600；桌面优先、同文件降序 |
| 全局层级 | `src/styles/tokens.css` 的 `--z-*`、`src/components/Header.css` 的 `--nav-z-*` | 浮层用 token；组件内部小整数保留 |
| 正文栏宽 | `src/styles/tokens.css` 的 `--measure`、`--measure-post`、`src/pages/Post.css` | 列表摘要 35em；文章详情 65ch，居中且无左侧目录列 |
| 文章目录 | `src/components/ChapterRail.jsx`、`src/components/TocIsland.jsx`、`src/hooks/useTocActive.js` | 右侧刻度轨与右下目录岛共用同一份滚动定位；目录岛高度跟导航设置（`settings.height * 0.9`） |
| 圆角 | `src/styles/tokens.css` 的 `--radius-*` | 常规三档 + 胶囊/正圆；几何半高与 Player 豁免 |
| 图片比例 | `src/styles/tokens.css` 的 `--ratio-*`、`src/styles/media.css` | 封面 16:9 / 卡片 4:3 / 头像 1:1 |
| 图标 | `src/components/ui/Icon.jsx` | 24 网格、1.75 描边、currentColor |
| 按钮 / 表单 | `src/components/ui/Button.jsx`、`Field.jsx`、`src/styles/components.css` | 主/次/文字按钮；控件 40 / 密集 36 / 移动 44 |
| 卡片内边距 | `src/styles/tokens.css` 的 `--card-pad*`、`src/styles/effects.css` | 面板 24、内容主卡 32 |
| 链接 | `src/styles/components.css`、`src/pages/Post.css` | 正文常下划线；操作链接无下划线 |
| favicon | `public/favicon.svg` | 32 网格、无渐变无滤镜、≤ 2 KB |
| 动效时长 / 缓动 | `src/components/ui/nav-settings.js`、`src/components/ui/theme-switcher-settings.js`、组件 CSS | 导航时长与缓动走设置；主题过渡 700ms 在 Provider |
| 阴影 / 边框强度 | `src/components/ui/surface-settings.js`、`src/components/ui/SurfaceCustomizer.jsx` | 全局唯一入口；组件只读 `--shadow-1/2/3` 与 `--border-*` |
| 导航 / 切换器玻璃 | `src/components/Header.css`、`src/components/ui/theme-switcher.css` | 内部高光保留，外部投影走全局阴影层级 |
| 主题切换逻辑 | `src/components/ui/ThemeSwitcherProvider.jsx` | 只写 `data-site-theme` / `data-paper`，不要在组件里判断 |
| 新增页面 | 页面 CSS + 语义 token | 不写裸 hex、字号、间距；跑 `npm run check:styles` |
| 检查规则 / 例外 | `scripts/check-styles.mjs`、`scripts/style-baseline.json` | baseline 必须 review，不要整体刷新 |

## 十、图片与图标

### 图片比例

| Token | 比例 | 用途 |
| --- | --- | --- |
| `--ratio-wide` | 16:9 | 文章封面、日报头图、列表缩略图 |
| `--ratio-card` | 4:3 | 卡片配图、编辑器预览 |
| `--ratio-square` | 1:1 | 头像、作者图 |

规则：

1. 图片一律走 `.media` + `.media--wide/card/square`，不直接写 `width` / `max-height`。
2. 需要保留完整构图的图（架构图、截图、公式）用 `.prose-image`，按原比例缩放，不裁切。
3. 所有图片必须有比例占位（`aspect-ratio` 或 `width`/`height`），避免 CLS。
4. 封面固定 16:9，素材 1600×900，至少 1200×675，≤ 300 KB。
5. 图片路径写站点绝对路径，文件放 `public/` 下（现有 `public/content-images/` 可用）。

### 图标

| 项 | 规则 |
| --- | --- |
| 网格 | 24 × 24 |
| 描边 | 1.75，round cap / join |
| 尺寸 | 16 / 20 / 24 |
| 颜色 | `currentColor`，不写死 |
| 实现 | `src/components/ui/Icon.jsx`，本地 path 表 |

规则：

1. 导航与操作图标用线性图标，不再使用 Unicode 字符或 emoji。
2. 主题切换器的填充 SVG 是控件材质例外，保留填充；重绘时必须维持 36 网格与现有选中态。
3. Player 的 `←` / `✕` 属于实体设备语言，保留。
4. 纯装饰图标 `aria-hidden="true"`；只有图标的按钮必须有 `aria-label`。
5. 新增图标先加进 `Icon.jsx`，不要在组件里散装 `<svg>`。

## 十一、组件

### 控件尺寸

| Token | 值 | 用途 |
| --- | --- | --- |
| `--control-h` | 40px | 默认按钮、输入框、select |
| `--control-h-sm` | 36px | 密集设置面板 |
| `--control-h-touch` | 44px | ≤600 触控目标 |
| `--control-px` | 16px | 默认水平内边距 |
| `--control-px-sm` | 12px | 紧凑按钮 / 输入框 |
| `--control-radius` | 12px | 标准控件圆角 |

### 按钮

`src/components/ui/Button.jsx`：

```jsx
<Button variant="primary | secondary | text" size="md | sm" />
```

| 类型 | 默认 | hover | active |
| --- | --- | --- | --- |
| primary | 赭石玻璃 22% / 胶囊 / `--content-strong` | 赭石玻璃 30% | 赭石玻璃 36% / 内压 1px |
| secondary | 中性玻璃 12% / 胶囊 / `--content-strong` | 中性玻璃 18% / `--accent` 文字 | 中性玻璃 36% / `--content-strong` |
| text | 透明 / `--accent` | `--accent-soft` / `--accent-secondary` | 同 hover |

禁用：透明度 0.45，`pointer-events: none`。主/次按钮都是胶囊玻璃，8 层 inset 高光与导航栏、主题切换器同源；按下落到 36% 选中胶囊。滑动胶囊与单选逻辑仍归 switcher。

### 表单

`src/components/ui/Field.jsx` + `.control`：

- 高度 40，移动端 44
- 透明边框 + 中性玻璃 12% 底，沿用导航同源 8 层 inset 高光与 `--glass-blur`
- hover 玻璃提亮 6%；focus：边框 `--accent` + 2px `--focus-ring`，offset 2
- error：边框 `--danger`，`.field__error`
- textarea 与 input 同一材质，最小高度 96，行高 `--lh-body`
- select 与 input 同高，option 使用 `--surface-canvas` / `--content-strong`

### 开关

`src/components/ui/Switch.jsx`：

- 36 × 20 胶囊轨道，16px 玻璃滑块，滑块带高光渐变与 1px 暗边
- 关：中性玻璃 30%，hover 38%；开：赭石玻璃 36%，hover 44%
- 轨道与按钮共用 8 层 inset 高光；focus-visible 用 `--focus-ring`

### 卡片

| 类 | 内边距 | 用途 |
| --- | --- | --- |
| `.glass-card` | `--card-pad` 24 | 设置、工具、普通面板 |
| `.bento-card` / `.blog-post-card` / `.about-card` | `--card-pad-feature` 32 | 首页、博客、关于的内容主卡 |

- 圆角 `--radius-lg`，边框 `--border-glass`，阴影 `--shadow-1`
- 静态卡不位移；整卡可点时加 `.card--interactive`，hover 抬 2px、阴影升到 `--shadow-2`
- 卡片标题 20 / 600，正文 16 / 400

### 链接

| 类型 | 默认 | hover |
| --- | --- | --- |
| 正文链接 `.link-inline` / `.post-content a` | `--accent` + 1px 下划线，offset 2 | `--accent-secondary` + 2px 下划线 |
| 操作链接 `.link-action` | `--content-default`，无下划线 | `--accent` |

- visited 不改色
- 键盘焦点统一 `--focus-ring`，2px + offset 2
- 导航、主题切换器、Player、Lab 为材质/物理例外，不套普通按钮与链接

### 排版

`src/styles/tokens.css` 的字体与字号阶梯：

- 正文、标题、元信息统一 `--serif-editorial`（Anthropic Serif + 思源宋），`--sans` / `--mono` / `--accent-font` / `--post-date-font` 都是同一栈的别名
- 导航单独走 `--nav-font`（PingFang 黑体栈），所有标签走 `--tag-font`（得意黑）；除此之外不再引入别的字体栈
- 导航 Logo 用 `--serif-editorial` 的 600 合成粗体；比例字不能用 ch 量宽，裁切盒按实测 advance 写成 em 值
- 只有代码、ASCII 与 Player 面板使用 `--mono-fixed`（IBM Plex Mono，等宽）
- 字号只走 `--fs-display / heading / heading-md / heading-sm / body / lead / ui / micro` 八档，不临时写 px
- 英文与数字由 Anthropic Serif 接管（单字重 400，不启用合成粗体）；标题不做负字距，行高走 `--lh-tight / heading / body / ui`

### 标签

`src/components/ui/Tag.jsx`：

- 24px 高胶囊，得意黑 12（`--tag-font`）；默认中性玻璃 12% + 4 层 inset（轮廓、顶高光、底暗边、内影），不挂 blur
- `tone="accent"` 用 `--accent-soft` 底 + 赭石描边与高光
- 只做归类，不承载点击

### 状态徽标

`src/components/ui/Badge.jsx`：

- 6px 圆点 + 微字 12；默认中性色，`tone="accent"` 赭石，`tone="muted"` 第三强调色
- 只做成熟度与状态说明，不承载点击
- 组件库卡片与详情页元信息共用，页面里不再各写一套圆点样式

### 图片

`src/styles/media.css`：

- `.media--wide` 16:9、`.media--card` 4:3、`.media--square` 1:1，一律 `object-fit: cover`
- 正文插图用 `.prose-image`，不裁切并保留完整构图与说明位
- 图片写死 `width` / `height` 占位，避免加载时页面抖动

### 空状态

`src/components/ui/Empty.jsx`：

- 标记 + 一句话 + 可选动作；默认无外框，`.empty--panel` 复用卡片 8 层玻璃
- 搜索空结果与文章空分类都用 `.empty--panel`，不再另写虚线框
- 标记默认 ∅，`--fs-heading` + 赭石，透明度 0.7

### 分段控件

`src/components/ui/Segmented.jsx`：

- 选项 40px 高；轨道是 12% 中性玻璃凹槽 + 4 层 inset，承担唯一一层 blur
- 指示器为 32% 中性玻璃 + 4 层 inset，不叠 blur；0.45s `cubic-bezier(0.22, 1, 0.36, 1)` 滑动，减少动效时关闭
- options 传 `id / title / count`，`role="radiogroup"`，方向键 / Home / End 切换

### 面包屑

`src/components/ui/Breadcrumb.jsx`：

- 默认纯文字：微字 12，斜线分隔，末级 `aria-current="page"` + `--content-strong`
- `.breadcrumb--capsule` 是 36px 玻璃胶囊，只在详情页头部使用
- 链接 hover 到 `--accent`，focus 用统一焦距环

### 导航与展示补充

| 组件 | 文件 | 规则 |
| --- | --- | --- |
| 标签页 Tabs | `Tabs.jsx` + `tabs.css` | 40px 高，下划线 `scaleX` 过渡；`role="tab"` + roving tabindex，方向键 / Home / End 切换 |
| 分页 Pagination | `Pagination.jsx` + `pagination.css` | 32px 方形玻璃页码，当前页 32% 选中胶囊 + `aria-current="page"`；省略号只做视觉 |
| 分割线 Divider | `Divider.jsx` + `divider.css` | 1px `--border-subtle`；`dashed` 变体；带文字时居中微字，`role="separator"` |
| 时间线 / 统计数值 / 表格 / 列表 | 组件库标本 | 仅组件库展示，无独立组件；轨道、数值、表格与列表统一走 token 与语义标签 |

### 数据录入补充

| 组件 | 文件 | 规则 |
| --- | --- | --- |
| 滑块 Slider | `Slider.jsx` + `slider.css` | 轨道 4px、拇指 18px 玻璃；进度用内联 `--slider-progress`；label 经 `useId` 关联 |
| 复选框 Checkbox | `Checkbox.jsx` + `checkbox.css` | 18px 玻璃方框，选中赭石底 + 白勾；原生 input 隐身，键盘与读屏仍走浏览器默认 |
| 选择器 Select | `Select.jsx` + `select.css` | 复用 `.field` / `.control`，右侧 chevronDown；`appearance: none`，不另写一套高度 |

### 反馈补充

| 组件 | 文件 | 规则 |
| --- | --- | --- |
| 警告提示 Alert | `Alert.jsx` + `alert.css` | 左侧 2px 色条 + 图标；`danger` 用 `role="alert"`，其余 `role="status"`；关闭按钮可省 |
| 进度条 Progress | `Progress.jsx` + `progress.css` | 6px 轨道，赭石渐变填充；`role="progressbar"` + 数值；`tone` 只换填充色 |
| 骨架屏 Skeleton | `Skeleton.jsx` + `skeleton.css` | 文本行 / 卡片两种；shimmer 在 `prefers-reduced-motion` 下改为静态 |
| 加载中 Spin | `Spin.jsx` + `spin.css` | 环形 spinner，默认 22px；`role="status"` + 视觉隐藏文案；减少动效时放慢而非停转 |
| 结果页 Result | `Result.jsx` + `result.css` | 48px 标记 + 标题 + 说明 + 动作；`success / info / empty` 三态，标记色跟随语义 |
| 对话框 Modal | `Modal.jsx` + `modal.css` | portal 到 body，`--z-modal`；遮罩承担唯一一层 blur，面板 92% 画布；Escape / 遮罩关闭、焦点圈定与复原、body 滚动锁 |

### 布局（标本）

栅格 Grid 与间距 Space 只作为组件库标本（12 列、`--space-1..4`），不产出通用组件，避免页面里出现第二套布局系统。

### 导航小设置栏（紧凑例外）

固定在 280px 高的导航胶囊里，不跟随移动端 44px：

| 项 | 值 |
| --- | --- |
| 行高 | 36px，行距 8px |
| 分段按钮 | 32px 高，胶囊 |
| 滑块 | 轨道 4px，拇指 14px |
| 开关 | 36 × 20，拇指 16px |
| 底部按钮 | `btn--text btn--sm` 36px |
| 焦点 | 局部 `--focus-ring: var(--nav-action-color)` |

行高固定 36 是为了保证 4 行 + footer 在 280px 内闭合；移动端也不改成 44。底部“详细设置”是文字按钮 + 箭头，不用强调色胶囊。

### 导航更多面板

- `NavMorePanel` 复用设置面板的展开/关闭节奏，高度按入口数量自动计算（行高 × 条目 + 间距 + 内边距）
- 入口数据在 `src/components/navMoreItems.js`，当前为探索 / 组件库 / CD机三项
- 面板打开时隐藏其余导航图标与选中胶囊，只保留「更多」按钮，点击外部也可关闭
- `≤600` 常驻分裂时同样可用

### 入口

| 想改什么 | 改哪里 |
| --- | --- |
| 按钮 | `src/components/ui/Button.jsx`、`src/styles/components.css` |
| 标签 / 状态徽标 / 空状态 | `src/components/ui/Tag.jsx`、`Badge.jsx`、`badge.css`、`Empty.jsx`、`src/styles/components.css` |
| 排版 | `src/styles/tokens.css` 的字体与 `--fs-*` 阶梯 |
| 图片 | `src/styles/media.css` |
| 分段控件 | `src/components/ui/Segmented.jsx`、`segmented.css` |
| 面包屑 | `src/components/ui/Breadcrumb.jsx`、`breadcrumb.css` |
| 标签页 / 分页 / 分割线 | `src/components/ui/Tabs.jsx`、`Pagination.jsx`、`Divider.jsx` 及同名 css |
| 滑块 / 复选框 / 选择器 | `src/components/ui/Slider.jsx`、`Checkbox.jsx`、`Select.jsx` 及同名 css |
| 提示 / 进度 / 骨架 / 加载 / 结果 / 对话框 | `src/components/ui/Alert.jsx`、`Progress.jsx`、`Skeleton.jsx`、`Spin.jsx`、`Result.jsx`、`Modal.jsx` 及同名 css |
| 导航小设置栏 | `src/components/NavSettingsPanel.jsx`、`src/components/Header.css` |
| 导航更多面板 | `src/components/NavMorePanel.jsx`、`Header.jsx` |
| 表单 | `src/components/ui/Field.jsx`、`src/styles/components.css` |
| 卡片内边距 / 圆角 | `src/styles/tokens.css` 的 `--card-*`、`src/styles/effects.css` |
| 链接 | `src/styles/components.css`、`src/pages/Post.css` |

## 十二、文档分工

| 文件 | 管什么 |
| --- | --- |
| `AGENTS.md` | agent 的命令、约定、已知陷阱 |
| `README.md` | 项目概览与页面清单 |
| `docs/style-guide.md` | 本文，样式规则与例外 |
| `content/README.md` | 文章 frontmatter 与写作规则 |
| `reports-tool/README.md` | 日报工具的运行与交付规则 |
