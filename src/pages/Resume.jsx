import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { resume } from '../lib/content/resume'
import useResumeSnap from '../hooks/useResumeSnap'
import useSectionReveal from '../hooks/useSectionReveal'
import '../styles/effects.css'
import './Resume.css'

const codeMarks = ['</>', '[]', '{}', '()', '==', '++', ';', '=>', '</>', '[]']

function SectionHeading({ children }) {
  return (
    <div className="resume-section-heading">
      <h2 className="resume-section-title">{children}</h2>
      <span className="resume-section-line" aria-hidden="true" />
    </div>
  )
}

export default function Resume() {
  const { profile, skills, projects, experience, education } = resume
  const allSkills = skills.flatMap((group) => group.items)

  // 只在简历页启用滚动吸附，桌面走 Lenis，触摸端走原生 CSS snap。
  useResumeSnap()
  // 每个整屏模块进入视口时再淡入。
  useSectionReveal()

  return (
    <div className="resume-page" id="top">
      <section className="resume-hero" data-koi-pond>
        <div className="resume-code" aria-hidden="true">
          {codeMarks.map((mark, index) => (
            <span key={`${mark}-${index}`}>{mark}</span>
          ))}
        </div>

        <div className="resume-hero-inner fade-in fade-in-1" data-water-avoid data-water-dim>
          <p className="resume-kicker">RESUME / 个人简历</p>
          <p className="resume-hello">HELLO</p>
          <h1 className="resume-title">
            我是 <span>{profile.name}</span>
          </h1>
          <p className="resume-role">{profile.role}</p>

          <div className="resume-socials">
            <a href={`mailto:${profile.email}`} aria-label={`邮箱：${profile.email}`}>
              <Icon name="mail" size={24} />
            </a>
            <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Icon name="github" size={24} />
            </a>
            <span className="resume-location">{profile.location}</span>
          </div>
        </div>
      </section>

      <div className="resume-content">
        <section id="about" className="resume-section">
          <div className="resume-section-grid">
            <SectionHeading>关于</SectionHeading>
            <div className="resume-section-body">
              <p className="resume-summary">{profile.summary}</p>
              <div className="resume-tags">
                {allSkills.map((item) => <span className="resume-tag" key={item}>{item}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="resume-section">
          <div className="resume-section-grid">
            <SectionHeading>项目</SectionHeading>
            <div className="resume-section-body">
              <div className="resume-projects">
                {projects.map((project) => {
                  const projectClass = `resume-project glass-card${project.href ? ' resume-project--link card--interactive' : ''}`
                  const content = (
                    <>
                      <div className="resume-project-top">
                        <span className="resume-project-index">{project.index}</span>
                        <span className="resume-project-period">{project.period}</span>
                      </div>
                      <h3 className="resume-project-title">{project.title}</h3>
                      <p className="resume-project-desc">{project.description}</p>
                      <div className="resume-tags">
                        {project.tags.map((tag) => <span className="resume-tag" key={tag}>{tag}</span>)}
                      </div>
                      {project.href && <span className="resume-project-link">查看项目 →</span>}
                    </>
                  )

                  if (!project.href) {
                    return <article className={projectClass} key={project.title}>{content}</article>
                  }

                  return (
                    <a
                      className={projectClass}
                      key={project.title}
                      href={project.href}
                      target={project.href.startsWith('http') ? '_blank' : undefined}
                      rel={project.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {content}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="resume-section">
          <div className="resume-section-grid">
            <SectionHeading>经历</SectionHeading>
            <div className="resume-section-body">
              <div className="resume-experience">
                {experience.map((item) => (
                  <article className="resume-entry glass-card" key={`${item.period}-${item.company}`}>
                    <div className="resume-entry-head">
                      <div>
                        <h3 className="resume-entry-title">{item.role}</h3>
                        <p className="resume-entry-org">{item.company}</p>
                      </div>
                      <span className="resume-period">{item.period}</span>
                    </div>
                    <ul className="resume-points">
                      {item.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="education" className="resume-section">
          <div className="resume-section-grid">
            <SectionHeading>教育</SectionHeading>
            <div className="resume-section-body">
              <div className="resume-experience resume-education">
                {education.map((item) => (
                  <article className="resume-entry glass-card" key={`${item.period}-${item.degree}`}>
                    <div className="resume-entry-head">
                      <div>
                        <h3 className="resume-entry-title">{item.degree}</h3>
                        <p className="resume-entry-org">{item.school}</p>
                      </div>
                      <span className="resume-period">{item.period}</span>
                    </div>
                    <ul className="resume-points">
                      {item.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="resume-end">
        <div>
          <p className="resume-end-title">{profile.name}</p>
          <p className="resume-end-meta">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <span aria-hidden="true">·</span>
            <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
        </div>
        <div className="resume-end-actions">
          <Button variant="secondary" onClick={() => window.print()}>打印 / 保存 PDF</Button>
          <a className="resume-top-link" href="#top">回到顶部 ↑</a>
        </div>
      </footer>
    </div>
  )
}
