// 简历内容：改文案只改这里，Resume.jsx 只负责渲染。
export const resume = {
  profile: {
    name: 'WUYU',
    role: '全栈工程师 → Agent 开发',
    location: '深圳',
    email: '814153912@qq.com',
    github: 'https://github.com/BWBYB',
    summary: '华侨大学计算机科学与技术专业本科生，目标岗位是前端开发与全栈开发。毕业设计 SPMTrack 覆盖 React 前端、Spring Boot 网关、FastAPI 任务流程与 Docker 部署，日常用 Codex、Cursor 辅助开发。',
  },
  skills: [
    { label: '前端', items: ['JavaScript', 'TypeScript', 'React', 'Vue3', '微信小程序'] },
    { label: '后端', items: ['Spring Boot', 'FastAPI', 'Node.js', 'WebSocket'] },
    { label: '数据与部署', items: ['MySQL', 'Docker'] },
    { label: '工具', items: ['Git', 'Codex', 'Cursor'] },
  ],
  projects: [
    {
      index: '01',
      title: 'WUYUWeb 个人网站',
      description: '个人网站：用 React 19 + Vite 构建，包含 ASCII 水体首页、简历、实验室与文章模块，持续扩充项目与视觉实验。',
      tags: ['React', 'Vite', 'React Router', 'Three.js'],
      href: 'https://github.com/BWBYB/WUYUWeb',
    },
  ],
  experience: [
    {
      period: '2025.11 — 2026.06',
      role: 'SPMTrack 视觉目标跟踪系统',
      company: '毕业设计 · 华侨大学',
      points: [
        '毕业设计：把视觉目标跟踪算法封装成可操作的 Web 系统。',
        '前端以 React + TypeScript 构建任务工作台，后端覆盖 Spring Boot 网关、FastAPI 任务流程与 Docker 部署。',
      ],
      tags: ['React', 'TypeScript', 'Spring Boot', 'FastAPI'],
    },
    {
      period: '2024.09 — 2024.12',
      role: '微信医疗报销小程序',
      company: '团队项目',
      points: [
        '参与报销申请、材料上传与个人中心等页面，独立完成 80% 以上前端开发。',
        '使用 WXS 优化小程序渲染，基于微信云开发。',
      ],
      tags: ['微信小程序', 'WXS', '微信云开发'],
    },
  ],
  education: [
    {
      period: '2022.09 — 2026.06',
      degree: '计算机科学与技术 · 本科',
      school: '华侨大学 · 厦门',
      points: [
        '主修课程：数据结构与算法、操作系统、数据库原理、计算机网络、Web 开发技术、软件工程。',
        '英语 CET-6；毕业设计为 SPMTrack 视觉目标跟踪系统。',
      ],
    },
  ],
}
