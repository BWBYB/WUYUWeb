# WUYUWeb 内容库

这个目录可以直接用 Obsidian 打开。

- `posts/`: 本地维护的文章
- `notion/`: Notion 同步生成的文章，请勿手动编辑
- `templates/`: Obsidian 写作模板
- `updates.md`: 网站更新记录，所有记录追加在同一个文件中

文章使用 Markdown + frontmatter，发布状态为 `published` 才会显示在网站中。

更新记录使用 `## 日期｜标题`、引用摘要和列表项目的固定格式，可直接套用 `templates/update-entry.md`。

本地运行 `npm run dev` 后，可以打开 `/updates-editor` 用网页表单编辑并保存更新记录。生产构建只提供 `/timeline` 只读展示。
