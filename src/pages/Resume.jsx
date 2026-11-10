import { useRef } from 'react'
import Icon from '../components/ui/Icon'
import { LogoLoop } from '../components/lab/LogoLoop'
import CurvedLogoLoop from '../components/lab/CurvedLogoLoop'
import ResumeLanyard from '../components/lab/ResumeLanyard'
import { PIECES } from '../components/lab/logoPieces'
import { resume } from '../lib/content/resume'
import useResumeIntro from '../hooks/useResumeIntro'
import useResumeScroll from '../hooks/useResumeScroll'
import useSectionReveal from '../hooks/useSectionReveal'
import '../styles/effects.css'
import './Resume.css'

const codeMarks = ['</>', '[]', '{}', '()', '==', '++', ';', '=>', '</>', '[]']

function SectionHeading({ children }) {
  return (
    <div className="resume-section-heading" data-water-dim-lines>
      <h2 className="resume-section-title">{children}</h2>
      <span className="resume-section-line" aria-hidden="true" />
    </div>
  )
}

export default function Resume() {
  const { profile, skills, projects, experience, education } = resume
  const allSkills = skills.flatMap((group) => group.items)
  const introRef = useRef(null)
  const windowInnerRef = useRef(null)

  // 桌面用 Lenis 平滑滚动，不做吸附；触摸端保留原生滚动。
  useResumeScroll()
  // 首屏吸附 + 内容窗口：入场进度与窗口内平移量写入 CSS 变量。
  useResumeIntro(introRef, windowInnerRef)
  // 每个整屏模块进入视口时再淡入。
  useSectionReveal()

  return (
    <div className="resume-page" id="top">
      <div className="resume-intro" ref={introRef}>
        <section className="resume-hero" data-koi-pond>
          <div className="resume-code" aria-hidden="true">
            {codeMarks.map((mark, index) => (
              <span key={`${mark}-${index}`}>{mark}</span>
            ))}
          </div>

          <div className="resume-hero-inner fade-in fade-in-1" data-water-dim-lines>
            <p className="resume-hello" data-water-avoid>HELLO</p>
            <h1 className="resume-title" data-water-avoid>
              我是 <span>{profile.name}</span>
            </h1>
            <p className="resume-role" data-water-avoid>{profile.role}</p>

            <div className="resume-socials" data-water-avoid>
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

        <div className="resume-window">
          <div className="resume-window-inner" ref={windowInnerRef}>
            <section id="about" className="resume-section resume-about">
              <div className="resume-section-grid">
                <SectionHeading>关于</SectionHeading>
                <div className="resume-section-body">
                  <p className="resume-summary" data-water-dim-lines>{profile.summary}</p>
                  <div className="resume-tags">
                    {allSkills.map((item) => <span className="resume-tag" key={item}>{item}</span>)}
                  </div>
                </div>
                <div className="resume-about-loop">
                  <CurvedLogoLoop
                    logos={PIECES}
                    slots={8}
                    speed={1.8}
                    pauseOnHover
                    label="技术栈 ASCII 徽标"
                  />
                </div>
              </div>
            </section>

            <section id="projects" className="resume-section">
              <div className="resume-section-grid">
                <SectionHeading>项目</SectionHeading>
                <div className="resume-section-body">
                  <div className="resume-projects" data-water-dim-lines>
                    {projects.map((project) => (
                      <article className="resume-project glass-card" key={project.title}>
                        <div className="resume-project-top">
                          <span className="resume-project-index">{project.index}</span>
                        </div>
                        <h3 className="resume-project-title">{project.title}</h3>
                        <p className="resume-project-desc">{project.description}</p>
                        <LogoLoop
                          className="resume-project-loop"
                          logos={project.tags}
                          width="50%"
                          speed={40}
                          logoHeight={24}
                          gap={12}
                          ariaLabel={`${project.title}技术栈`}
                          renderItem={(tag) => <span className="resume-tag">{tag}</span>}
                        />
                        <div className="resume-tags resume-project-tags-print" aria-hidden="true">
                          {project.tags.map((tag) => <span className="resume-tag" key={tag}>{tag}</span>)}
                        </div>
                        {project.href && (
                          <div className="resume-project-actions">
                            <a
                              className="btn btn--glass resume-project-github"
                              href={project.href}
                              target={project.href.startsWith('http') ? '_blank' : undefined}
                              rel={project.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                              aria-label={`在 GitHub 查看 ${project.title}`}
                            >
                              <Icon name="github" size={20} />
                            </a>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {experience.length > 0 && (
              <section id="experience" className="resume-section">
                <div className="resume-section-grid">
                  <SectionHeading>在校经历</SectionHeading>
                  <div className="resume-section-body">
                    <div className="resume-experience" data-water-dim-lines>
                      {experience.map((item) => (
                        <article className="resume-entry glass-card" key={`${item.period}-${item.role}`}>
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
                          {item.tags && (
                            <>
                              <LogoLoop
                                className="resume-experience-loop"
                                logos={item.tags}
                                width="50%"
                                speed={40}
                                logoHeight={24}
                                gap={12}
                                ariaLabel={`${item.role}技术栈`}
                                renderItem={(tag) => <span className="resume-tag">{tag}</span>}
                              />
                              <div className="resume-tags resume-experience-tags-print" aria-hidden="true">
                                {item.tags.map((tag) => <span className="resume-tag" key={tag}>{tag}</span>)}
                              </div>
                            </>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section id="education" className="resume-section">
              <div className="resume-section-grid">
                <SectionHeading>教育</SectionHeading>
                <div className="resume-section-body">
                  <div className="resume-experience resume-education" data-water-dim-lines>
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
          <ResumeLanyard />
        </div>

        <div className="resume-window-spacer" aria-hidden="true" />
      </div>
    </div>
  )
}
