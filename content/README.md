# WUYUWeb 内容库

这个目录可以直接用 Obsidian 打开。

- `posts/`: 本地维护的文章
- `notion/`: Notion 同步生成的文章，请勿手动编辑
- `templates/`: Obsidian 写作模板
- `updates.md`: 网站更新记录，所有记录追加在同一个文件中

文章使用 Markdown + frontmatter，发布状态为 `published` 才会显示在网站中。

必填字段只有三个，缺任何一个都会让 `npm run dev` 与 `npm run build` **直接报错中断**：

| 字段 | 说明 |
| --- | --- |
| `title` | 文章标题 |
| `slug` | URL 片段，全站唯一；重复同样会中断构建 |
| `date` | 发布日期，`YYYY-MM-DD` |

其余字段可选：`updated`、`summary`（列表摘要，缺省时取正文前 160 字）、`category`、`tags`、`cover`、`legacyId`（旧链接 `/post/:id` 的重定向来源）。

正文的目录只识别 `##` 与 `###` 两级标题；只用 `#` 的文章不会生成目录。

新文章可直接套用 `templates/post.md`——它自带 `status: draft`，写完记得改成 `published`，否则文章不会出现在站点里，也不会报错。

更新记录使用 `## 日期｜标题`、引用摘要和列表项目的固定格式，可直接套用 `templates/update-entry.md`。

本地运行 `npm run dev` 后，可以打开 `/updates-editor` 用网页表单编辑并保存更新记录。生产构建只提供 `/timeline` 只读展示。
