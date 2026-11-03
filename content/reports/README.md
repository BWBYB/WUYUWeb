---
title: 日报目录说明
slug: reports-readme
date: 2026-11-03
status: draft
---

# 日报目录

这个目录存放由 agent 每天生成的日报。每篇日报是一个 Markdown 文件，构建时由 `vite.config.js` 的插件解析。

本文件带 `status: draft`，即使目录接入构建也不会出现在站点里。

## 一、文件命名

```
YYYY-MM-DD.md
```

- 一天一个文件，例如 `2026-11-03.md`
- 同一天重跑，**覆盖原文件**，不要写成 `2026-11-03-2.md`
- 只用数字和连字符，不要中文文件名
- 文件名只是约定，构建不读取；日期看 `date`，访问地址看 `slug`，三者保持一致便于管理

## 二、frontmatter

下面六个字段是日报工具的交付要求，缺一项就可能出问题。站点构建本身只强制 `title`、`slug`、`date`；其余三项缺失不一定报错，但会导致分类缺失、摘要被截断或被静默过滤，所以一律按必填处理。

```yaml
---
title: "AI 与计算机日报 · 2026-11-03（周二）"
slug: "report-2026-11-03"
date: "2026-11-03"
category: "日报"
status: "published"
summary: "今天 6 篇论文里 3 篇围绕 harness，Wave Forcing 把流式视频生成吞吐做到单卡 7.07 倍。"
---
```

| 字段 | 规则 |
| --- | --- |
| `title` | 人类可读，保留日期与星期；日期用 `YYYY-MM-DD`，不要用斜杠 |
| `slug` | **必须**是 `report-YYYY-MM-DD`，日期与 `date` 一致；全站唯一，重复会中断构建 |
| `date` | `YYYY-MM-DD`，与 `slug` 中的日期一致 |
| `category` | 固定写 `日报`；缺失时不会报错，但文章不会进「日报」分类 |
| `status` | 必须是 `published`；写成 `draft` 会被**静默过滤**，不报错也看不到 |
| `summary` | **必须** 40–80 字、单行；缺失或超长会被 `lint.py` 判为 ERROR |

可选字段：`updated`、`tags`（数组）、`cover`。

## 三、正文

- 不要用 `#` 写标题，页面已经把 `title` 渲染成大标题
- 用 `##` 分节，需要时用 `###`；只有这两级会进目录（TOC）
- 建议结构：开头一段结论，然后 2–5 个 `##` 小节
- 列表、表格、代码块都支持
- 中文排版：正文行高由站点样式控制，不要写内联样式

### 图片

```markdown
![示意图](/images/reports/2026-11-03/flow.png)
```

- 图片放在 `public/images/reports/YYYY-MM-DD/` 下，正文用**以 `/` 开头的绝对路径**
- 不要写 `./flow.png` 或 `../images/flow.png`：Markdown 的相对路径按页面 URL 解析，不是按 md 文件位置，会 404
- 不要引用外部图床

### 链接与 HTML

- 允许 `/`（站内）、`#`、`http(s)`、`mailto:`
- 正文里的裸 HTML 会被**丢弃**，只能写 Markdown
- 外链会自动加 `target="_blank" rel="noopener noreferrer"`

## 四、禁止事项

- 不要修改 `content/posts/`、`content/notion/`、`content/updates.md`
- 不要修改 `src/`、`vite.config.js`、`package.json`
- 不要新增第二个 `.md` 文件来「修正」前一天的日报，直接改当天文件
- 不要写重复的 `slug`
- 不要提交 `.DS_Store`、临时文件、编辑器缓存

## 五、自检

**不需要为每篇日报单独构建。** 站点构建只在发布时统一执行一次，日常落盘不触发构建，也不要求 agent 跑 `npm run build`。

写完后按第二节核对字段即可，重点六项：

1. 第 1 行是 `---`，字段列表之后有闭合的 `---`
2. `title`、`slug`、`date` 三个字段都存在，且日期一致
3. `slug` 等于 `report-` 加 `date`
4. `category` 是 `日报`，`status` 是 `published`
5. `summary` 是单行，长度 40–80 字
6. 正文没有任何以 `# ` 开头的行

`reports-tool/run-daily.sh` 会在交付前自动跑一遍 `lint.py`，上面六项以那份结果为准。

格式错误不会在落盘时报错，但会在下一次发布构建时暴露，并导致整站构建失败，所以上面六项必须逐条确认。

需要本地预览时，运行一次 `npm run dev`，日报会出现在 `/blog` 的「日报」分类下，详情页是 `/blog/report-YYYY-MM-DD`。dev 模式下保存 md 会自动刷新，同样不需要手动构建。

## 六、与站点仓库的关系

本目录是 WUYUWeb 仓库的一部分，日报文件随站点一起提交、一起部署。

- 不要在本目录执行 `git init`，也不要单独建立仓库
- 不要执行 `git add`、`git commit`、`git push`，提交由站点维护者统一处理
- 嵌套的独立仓库（目录内出现 `.git/`）不会被父仓库跟踪，上线时平台拿不到这些文件，线上会是空的
