# AGENTS.md

给在本仓库工作的 AI agent。项目概览、路由与技术栈见 [README.md](README.md)，本文只写**会改变你行为**的事实。

## 命令

```bash
npm run dev       # Vite dev server，默认 5173
npm run build     # 生产构建 → dist/
npm run lint      # oxlint，唯一的自动检查
npm run preview   # 预览 dist/
```

没有测试框架、没有 CI、没有类型检查。不要假设 `npm test` 存在。

`node_modules/` 已就绪时不需要重新 `npm install`；装包可能被沙箱拦截（见「环境」）。

## 工作区

- 本目录是 **git worktree**，分支 `agent/navigation-experiment`，`.git` 是指向主仓库的 76 字节指针文件。
- 主仓库 `/Users/Admin/Documents/ChatGPT/WUYUWeb` 在 `main`，通常保持只读，不要往那里提交。
- 两个 worktree 不能同时 checkout 同一分支。
- 删除本目录必须用 `git worktree remove`；`rm -rf` 会在主仓库 `.git/worktrees/` 留下失效记录。

## 内容管线（最容易踩的地方）

`content/` 下的 Markdown **不是**运行时读取，而是在构建期由 `vite.config.js` 的自研插件解析，通过虚拟模块 `virtual:wuyu-content` 注入。

- 改 `content/**/*.md` 会触发**整页 reload**，不是 HMR 局部更新。
- frontmatter 缺 `title` / `slug` / `date` 会 **throw 并中断整个 dev / build**；`slug` 重复同样 throw。新增文章前先核对 `content/templates/post.md`。
- `status` 不是 `published` 的文章会被**静默过滤**——不报错，但站点里看不到。
- `content/notion/` 由同步流程生成，**禁止手动编辑**。
- 开发模式下 `/__wuyu/updates` 的 POST 会**直接写盘覆盖** `content/updates.md`。测试该接口前先备份该文件。

## 约定

- 路由集中在 `src/App.jsx`。重页面（`/lab`、`/player`、`/updates-editor`）用 `lazy` + `Suspense`，新增重页面沿用此模式。
- 每个页面配一个同名 CSS（`Post.jsx` ↔ `Post.css`），样式就近维护。
- `src/components/ui/` 是共享组件。为单个页面定制样式时写在页面 CSS 里，不要改共享组件源码。
- 导航动效的所有时长挂在 CSS 变量 `--nav-stretch-duration` 上（设置页的「动画倍速」是全局缩放）。新增时序时从该变量派生，不要写死毫秒。
- 中文排版：大标题字距 0~+0.01em、行高 1.1~1.2，正文行高 1.7~1.9。

## 已知陷阱

### 导航栏

1. **`align-items` 不可插值。** `center` ↔ `flex-start` 之间切换是瞬跳，会让 logo 抽搐。改布局时保持一侧恒定，用 `margin` 或 `align-self` 补偿。
2. **`border-radius: 999px` 用在会变高的元素上会退化成大圆饼。** 用固定 `calc(var(--nav-height) / 2)`。
3. **分裂态 `fieldset` 需要 `align-self: flex-start`**，否则它按 `align-items: center` 居中在变高的容器里，图标看起来往下掉。
4. **图标淡出必须显式写进 `transition`。** 只设 `opacity: 0` 而没有对应过渡项时，它是 0ms 瞬跳。

### 文章页

5. `.post-layout` 是两列 grid（TOC 190px + 正文 720px）。`.post-content` 必须显式 `grid-column: 2`——文章没有 `##`/`###` 标题时 TOC 不渲染，正文会被 grid 自动放置塞进第一列，塌成 190px。

### 主题

6. 主题切换浮球是 `position: fixed` + `z-index: 1000` 的全局元素，会压在所有内容之上。改布局或新增页面时确认它没有遮挡正文。

## 验证

- 代码层面：`npm run lint`，并确认 `npm run build` 输出 `✓ built in`。
- 视觉层面：用 `agent-browser` 打开 `http://localhost:5173` 截图确认；它自带 Chromium，不依赖系统浏览器授权。
- 判断动效是否真的生效，读计算样式（`getComputedStyle` 的 `transitionDuration` / `transitionDelay`）比看截图可靠。

## 环境

- Node 22 下开发（`package.json` 未声明 `engines`）。
- 沙箱会拦截 `node_modules/.vite-temp/*` 的删除：`npm run build` **可能以非零退出码结束，但构建实际是成功的**。以 stdout 里的 `✓ built in` 为准，不要因此重试。
- 本机 shell 有 HTTP 代理，`curl http://localhost:5173` 会失败；加 `--noproxy '*'`。
