// 简历内容：改文案只改这里，Resume.jsx 只负责渲染。
export const resume = {
  profile: {
    name: 'WUYU',
    role: '计算机专业学生 · AI Agent 方向',
    location: '深圳',
    email: 'hello@example.com',
    github: 'https://github.com',
    summary: '即将毕业的计算机专业学生，关注 AI Agent 与工具化实践。喜欢把学到的东西做成能用的页面和工具，也记录过程中的判断与取舍。',
  },
  skills: [
    { label: '前端', items: ['React', 'JavaScript', 'HTML/CSS'] },
    { label: '后端与工具', items: ['Python', 'Node.js', 'Docker', 'Git'] },
    { label: 'AI', items: ['Dify', 'Agent 工作流', '本地模型'] },
  ],
  projects: [
    {
      index: '01',
      title: 'AI Agent 工具实践',
      period: '2025 — 至今',
      description: '用 Dify 搭建面向日常任务的小工具，梳理从提示词到工作流的完整链路。',
      tags: ['Dify', 'Python', 'Agent'],
      href: '',
    },
    {
      index: '02',
      title: 'WUYUWeb 个人站点',
      period: '2025',
      description: 'React + Vite 搭建的个人站点，覆盖文章、归档、时间线与实验页。',
      tags: ['React', 'Vite', 'CSS'],
      href: '',
    },
    {
      index: '03',
      title: '本地模型推理实验',
      period: '2025',
      description: '在 M1 Pro 上尝试本地大模型推理，记录性能、内存与可用性边界。',
      tags: ['Python', '本地模型', 'M1 Pro'],
      href: '',
    },
  ],
  experience: [
    {
      period: '2025 — 至今',
      role: '独立开发',
      company: '个人项目',
      points: [
        '用 Dify 搭建日常任务工具，覆盖提示词、工作流与结果校验。',
        '在 M1 Pro 上测试本地模型推理，记录不同参数下的性能表现。',
      ],
    },
    {
      period: '2025',
      role: '独立开发',
      company: 'WUYUWeb',
      points: [
        '从零搭建个人站点，覆盖文章、归档、时间线与实验页。',
        '建立颜色、字号、间距、圆角、阴影与组件规范，并用检查脚本守门。',
      ],
    },
  ],
  education: [
    {
      period: '2022 — 2026',
      degree: '计算机专业 · 本科',
      school: '即将毕业',
      points: [
        '在读期间持续做个人项目，方向从 Web 前端逐步转向 AI Agent。',
      ],
    },
  ],
}
