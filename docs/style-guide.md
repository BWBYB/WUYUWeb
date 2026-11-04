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

组件只引用语义变量，不判断当前是深色、冷白还是纸色：

```
--bg / --bg-card / --bg-card-hover
--text / --text-h / --text-muted
--border / --border-hover
--glass / --glass-border
--accent-1..3
--paper-mix
```

规则：

1. 新代码不出现 `#rrggbb`、`rgba()`；颜色定义只放在 `src/index.css`。
2. 玻璃高光、内阴影、折射边缘是材质例外，允许裸 `rgba`；新增前先看 `Header.css` 与 `theme-switcher.css` 的现有配方。
3. 主题差异只通过 `[data-site-theme]`、`[data-paper]`、`--paper-mix` 改变量，组件里禁止 `if (paper)` 分支。
4. 纸色强度用 `--paper-mix` 在冷白与暖纸之间插值，不要把两套颜色写两遍。

## 四、间距与圆角（尚未 token 化）

现状：88 种 padding、33 种圆角。这是下一阶段的工作，本文件先定目标，不假装已经完成。

- 间距按 4px 阶梯：4 / 8 / 12 / 16 / 24 / 32 / 48 / 64。
- 圆角只保留 6 / 12 / 999 三档；正圆用 `50%`（几何事实，不算设计档位）。
- 新代码不要引入 15px、18px、10px 这类值；旧代码随页面迁移逐步收敛。

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
| 间距 / 圆角 | 尚未 token 化，检查脚本暂不覆盖 |
| `Player.css` | 20 处装饰字号保留，等 `--fs-deco-*` 方案 |
| `Lab` | 永久豁免，不参与统一 |

## 九、文档分工

| 文件 | 管什么 |
| --- | --- |
| `AGENTS.md` | agent 的命令、约定、已知陷阱 |
| `README.md` | 项目概览与页面清单 |
| `docs/style-guide.md` | 本文，样式规则与例外 |
| `content/README.md` | 文章 frontmatter 与写作规则 |
| `reports-tool/README.md` | 日报工具的运行与交付规则 |
