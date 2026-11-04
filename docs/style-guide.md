# 样式规范

> 状态：现行。由 `scripts/check-styles.mjs` 守门，存量例外记在 `scripts/style-baseline.json`。
> 适用范围：`src/` 下的 CSS 与组件样式。

## 一、适用范围与豁免

| 区域 | 约束 |
| --- | --- |
| 页面、共享组件、导航、主题切换器 | 完全约束 |
| `src/pages/Player.css` | 文本受约束；磁带物理标签与图标例外 |
| `src/index.css` | token 与颜色源文件，允许裸 hex |
| `src/pages/Lab.css`、`src/components/lab/`、`ThreeHero.css` | 豁免，保留演示视觉语言 |

豁免不是永久许可证。新增豁免必须写进本文件，并在 PR/提交说明里写原因。

## 二、字号（已落地）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--fs-micro` | 12px | 元信息、标签、面板说明 |
| `--fs-ui` | 14px | 导航、页脚、次要正文、控件 |
| `--fs-body` | 16px | 正文、卡片标题 |
| `--fs-heading-sm` | 20px | 区块标题、文章 h2/h3 |
| `--fs-heading` | 28px | 大区块标题、移动端页面标题 |
| `--fs-display` | 36px | 桌面页面标题、文章标题 |

配套行高：

```css
--lh-tight: 1.15;    /* 展示级标题 */
--lh-heading: 1.25;  /* 页面/文章标题 */
--lh-snug: 1.4;      /* 卡片标题 */
--lh-body: 1.7;      /* 正文 */
```

规则：

1. 只写 `font-size: var(--fs-*)`，不写裸 px。
2. 响应式只改 token（`@media (max-width: 768px)` 里覆盖 `--fs-*`），页面不各自调字号。
3. 中文标题字距 0~+0.01em，**禁止负字距**；正文行高 1.7，标题 1.1–1.25。
4. 确实需要新档位时，先改本文件和 `index.css`，不要在组件里临时加。

例外：图标字形（导航图标、emoji、面板圆点）、Player 磁带上的装饰标签。它们不是排版文本，保留裸值，并由 baseline 记录。

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

1. 新代码不出现 `#rrggbb`、`rgba()`；颜色定义只放在 `src/index.css`。
2. 主题差异只通过 `[data-site-theme]`、`[data-paper]`、`--paper-mix` 改变量，组件里禁止 `if (paper)` 分支。
3. 纸色用 `--paper-mix` 在暖白与暖纸之间插值；强调色整组切换，不参与混合。
4. 全站不引入蓝、紫、青作为强调色；需要新颜色时先判断它属于六组中的哪一组。
5. 对比度：正文对画布/卡片 ≥ 4.5:1，弱文字 ≥ 3:1，强调色作为文字 ≥ 4.5:1，焦点圈对相邻色 ≥ 3:1。

## 四、间距与圆角

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

### 圆角（尚未落地）

现状 33 种取值。目标只保留 6 / 12 / 999 三档；正圆用 `50%`（几何事实，不算设计档位）。新代码不要引入 8px、10px、14px 这类值，旧代码随页面迁移收敛。

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
| 裸 hex | `src/index.css` 之外新增颜色即失败 |

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
| 圆角 | 33 种取值，尚未 token 化 |
| 几何间距 | Header / 导航 / 切换器 / Player 的胶囊与磁带尺寸仍用裸 px |
| `Player.css` | 20 处装饰字号、56 处物理间距保留，等装饰 token 方案 |
| `Lab` | 永久豁免，不参与统一 |

## 九、修改入口

改样式前先查这张表，不要直接在页面里加裸值。

| 想改什么 | 入口 | 注意 |
| --- | --- | --- |
| 全局颜色 / 语义 | `src/index.css` 的 `:root`、`[data-site-theme="light"]`、`[data-paper="on"]` | 先判断属于六组中的哪一组；组件里不写颜色 |
| 新增一个语义色 | 同上，三种模式都要给值 | 深色、暖白、纸色缺一不可；纸色用 `--paper-mix` 插值 |
| 纸色强度 / 开关 | `src/components/ui/background-settings.js`、`src/components/Layout.jsx` | 默认值与范围在 settings；`--paper-mix` 由 Layout 写到根元素 |
| 字号 | `src/index.css` 的 `--fs-*` | 6 档已固定；移动端在 `max-width: 768px` 覆盖 |
| 行高 | `src/index.css` 的 `--lh-*` | 标题 1.15–1.25，正文 1.7 |
| 间距 | `src/index.css` 的 `--space-1..8` | 只用于 padding / margin / gap；几何与装饰值豁免 |
| 正文栏宽 | `src/index.css` 的 `--measure`、`src/pages/Post.css` | 默认 35 字；页面宽度由目录列 + 栏宽 + 内边距推导 |
| 导航 / 切换器玻璃、阴影 | `src/components/Header.css`、`src/components/ui/theme-switcher.css` | 几何参数另有设置面板，不要改死值 |
| 主题切换逻辑 | `src/components/ui/ThemeSwitcherProvider.jsx` | 只写 `data-site-theme` / `data-paper`，不要在组件里判断 |
| 新增页面 | 页面 CSS + 语义 token | 不写裸 hex、字号、间距；跑 `npm run check:styles` |
| 检查规则 / 例外 | `scripts/check-styles.mjs`、`scripts/style-baseline.json` | baseline 必须 review，不要整体刷新 |

## 十、文档分工

| 文件 | 管什么 |
| --- | --- |
| `AGENTS.md` | agent 的命令、约定、已知陷阱 |
| `README.md` | 项目概览与页面清单 |
| `docs/style-guide.md` | 本文，样式规则与例外 |
| `content/README.md` | 文章 frontmatter 与写作规则 |
| `reports-tool/README.md` | 日报工具的运行与交付规则 |
