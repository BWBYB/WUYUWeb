# WUYUWeb

> 个人站点：文章、更新时间线、前端动效实验室与磁带播放器。
> React 19 + Vite 8 + Tailwind CSS 4，内容用 Markdown 在构建期编译。

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认跑在 http://localhost:5173 。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器（Vite，HMR） |
| `npm run build` | 生产构建，输出到 `dist/` |
| `npm run preview` | 本地预览已构建的产物 |
| `npm run lint` | oxlint 静态检查 |

`dist/` 与 `node_modules/` 都在 `.gitignore` 中。仓库不带构建产物，部署前需要自己执行一次 `npm run build`。

## 页面

| 路径 | 内容 | 加载 |
| --- | --- | --- |
| `/` | 首页 | 静态 |
| `/blog` | 文章列表 | 静态 |
| `/blog/:slug` | 文章详情，含自动生成目录 | 静态 |
| `/post/:id` | 旧链接重定向到新 slug | 静态 |
| `/archive` | 按年月归档 | 静态 |
| `/timeline` | 站点更新记录 | 静态 |
| `/about` | 关于 | 静态 |
| `/settings` | 导航动效参数调节（阈值、时长、倍速、缓动） | 静态 |
| `/lab` | 前端动效实验室：文字、动效、交互、视觉四组演示，含 three.js 3D 场景与液态玻璃导航对照 | 懒加载 |
| `/player` | 磁带风格播放器，声音由 Web Audio 振荡器实时合成，不使用音频文件 | 懒加载 |
| `/updates-editor` | 更新记录的网页编辑器 | 懒加载，**仅开发模式存在** |

路由集中定义在 `src/App.jsx`。

## 内容

文章和更新记录都在 `content/`，用 Markdown + frontmatter 维护。构建时由 `vite.config.js` 里的插件解析成虚拟模块 `virtual:wuyu-content` 注入前端，因此**内容改动会触发整页刷新**，不是局部 HMR。

frontmatter 的必填字段、目录职责与写作模板，见 [content/README.md](content/README.md)。

## 结构

```
src/
├─ pages/       路由页面（每个页面配一个同名 CSS）
├─ components/  Layout、Header、Footer、ThreeHero、AuroraBackground
│  ├─ ui/       通用组件：导航切换器、主题切换、液态玻璃按钮
│  └─ lab/      动效实验室的演示组件
├─ lib/         内容查询封装（按 slug / 分类 / 归档 / 相邻文章）
├─ hooks/       usePerformanceEffects（高耗能组件的开关）
└─ styles/      全局效果样式
content/        文章、Notion 同步目录、更新记录、Obsidian 模板
public/         favicon 与图标 sprite
```

## 技术栈

| 用途 | 依赖 |
| --- | --- |
| 框架与路由 | React 19、react-router-dom 7 |
| 构建与样式 | Vite 8、Tailwind CSS 4（`@tailwindcss/vite`） |
| 3D 与动效 | three.js 0.186、GSAP 3 |
| 内容编译 | marked 18、gray-matter 4 |
| 组件底座 | @radix-ui/react-slot、class-variance-authority、clsx、tailwind-merge |
| 静态检查 | oxlint |

## 已知限制

- **没有测试、没有 CI、没有类型检查。** `src/components/ui/` 下有 3 个 `.tsx` 文件，但项目未安装 `typescript`，Vite 只做类型剥离。唯一的自动检查是 `npm run lint`。
- **`/lab` 会加载 three.js**（约 533 kB），所以该路由与 `/player` 都做了路由级懒加载，避免首屏为它们买单。
- **`/updates-editor` 只在开发模式注册**，生产构建不含此路由。
- **文章缺必填 frontmatter 会让构建直接失败**，不是警告。

## 文档

| 文件 | 用途 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 给 AI agent 的命令、约定与已知陷阱 |
| [docs/status.md](docs/status.md) | 当前进度快照与下一步 |
| [content/README.md](content/README.md) | 内容目录职责与写作规则 |
| [llms.txt](llms.txt) | 供 LLM 检索的文档索引 |
