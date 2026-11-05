import Button from '../components/ui/Button'
import '../styles/effects.css'
import './Resume.css'

const profile = {
  name: 'WUYU',
  role: '计算机专业学生 · AI Agent 方向',
  location: '深圳',
  email: 'hello@example.com',
  github: 'https://github.com',
  summary: '即将毕业的计算机专业学生，关注 AI Agent 与工具化实践。喜欢把学到的东西做成能用的页面和工具，也记录过程中的判断与取舍。',
}

const projects = [
  {
    period: '2025 — 至今',
    title: 'AI Agent 工具实践',
    org: '个人项目',
    points: [
      '用 Dify 搭建面向日常任务的小工具，梳理从提示词到工作流的完整链路。',
      '在 M1 Pro 上尝试本地大模型推理，记录性能与可用性边界。',
    ],
  },
  {
    period: '2025',
    title: 'WUYUWeb 个人站点',
    org: '独立开发',
    points: [
      'React + Vite 搭建的个人站点，覆盖文章、归档、时间线与实验页。',
      '建立颜色、字号、间距、圆角、阴影与组件规范，并用检查脚本守门。',
    ],
  },
]

const education = {
  period: '2022 — 2026',
  title: '计算机专业 · 本科',
  org: '即将毕业',
  points: ['在读期间持续做个人项目，方向从 Web 前端逐步转向 AI Agent。'],
}

const skills = [
  { label: '前端', items: ['React', 'JavaScript', 'HTML/CSS'] },
  { label: '后端与工具', items: ['Python', 'Node.js', 'Docker', 'Git'] },
  { label: 'AI', items: ['Dify', 'Agent 工作流', '本地模型'] },
]

export default function Resume() {
  return (
    <div className="resume-page">
      <header className="resume-header fade-in fade-in-1">
        <span className="resume-kicker">RESUME</span>
        <h1 className="resume-title">{profile.name}</h1>
        <p className="resume-role">{profile.role}</p>
        <div className="resume-actions">
          <a className="btn btn--primary" href={`mailto:${profile.email}`}>联系我</a>
          <Button variant="secondary" onClick={() => window.print()}>打印 / 保存 PDF</Button>
        </div>
      </header>

      <div className="resume-layout">
        <main className="resume-main">
          <section className="resume-card glass-card fade-in fade-in-2">
            <h2 className="resume-section-title">个人简介</h2>
            <p className="resume-summary">{profile.summary}</p>
          </section>

          <section className="resume-card glass-card fade-in fade-in-3">
            <h2 className="resume-section-title">项目经历</h2>
            <div className="resume-entries">
              {projects.map((project) => (
                <article className="resume-entry" key={`${project.period}-${project.title}`}>
                  <div className="resume-entry-head">
                    <span className="resume-period">{project.period}</span>
                    <h3 className="resume-entry-title">{project.title}</h3>
                    <span className="resume-org">{project.org}</span>
                  </div>
                  <ul className="resume-points">
                    {project.points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="resume-card glass-card fade-in fade-in-4">
            <h2 className="resume-section-title">教育经历</h2>
            <article className="resume-entry">
              <div className="resume-entry-head">
                <span className="resume-period">{education.period}</span>
                <h3 className="resume-entry-title">{education.title}</h3>
                <span className="resume-org">{education.org}</span>
              </div>
              <ul className="resume-points">
                {education.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </article>
          </section>
        </main>

        <aside className="resume-side">
          <section className="resume-card glass-card fade-in fade-in-2">
            <h2 className="resume-section-title">联系方式</h2>
            <div className="resume-contact-list">
              <a className="resume-contact" href={`mailto:${profile.email}`}>
                <span>邮箱</span>
                <strong>{profile.email}</strong>
              </a>
              <a className="resume-contact" href={profile.github} target="_blank" rel="noopener noreferrer">
                <span>GitHub</span>
                <strong>github.com</strong>
              </a>
              <div className="resume-contact">
                <span>所在地</span>
                <strong>{profile.location}</strong>
              </div>
            </div>
          </section>

          <section className="resume-card glass-card fade-in fade-in-3">
            <h2 className="resume-section-title">技能</h2>
            <div className="resume-skill-groups">
              {skills.map((group) => (
                <div className="resume-skill-group" key={group.label}>
                  <span className="resume-skill-label">{group.label}</span>
                  <div className="resume-tags">
                    {group.items.map((item) => <span className="resume-tag" key={item}>{item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
