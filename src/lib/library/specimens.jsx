import { useState } from 'react'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Breadcrumb from '../../components/ui/Breadcrumb'
import Button from '../../components/ui/Button'
import Checkbox from '../../components/ui/Checkbox'
import Divider from '../../components/ui/Divider'
import Empty from '../../components/ui/Empty'
import Field from '../../components/ui/Field'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import Progress from '../../components/ui/Progress'
import Result from '../../components/ui/Result'
import Segmented from '../../components/ui/Segmented'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'
import Slider from '../../components/ui/Slider'
import Spin from '../../components/ui/Spin'
import Switch from '../../components/ui/Switch'
import Tabs from '../../components/ui/Tabs'
import Tag from '../../components/ui/Tag'
import LabSection from '../../components/lab/LabSection'
import { ThemeSwitcher } from '../../components/ui/apple-liquid-glass-switcher'
import { useThemeSwitcherTheme } from '../../components/ui/theme-switcher-context'

const ICON_NAMES = [
  ['home', 'home'],
  ['pencil', 'pencil'],
  ['compass', 'compass'],
  ['disc', 'disc'],
  ['mail', 'mail'],
  ['github', 'github'],
  ['info', 'info'],
  ['resume', 'resume'],
  ['more', 'more'],
  ['arrowUp', 'arrowUp'],
  ['settings', 'settings'],
  ['grid', 'grid'],
  ['search', 'search'],
  ['close', 'close'],
  ['check', 'check'],
  ['alert', 'alert'],
  ['chevronLeft', 'chevronLeft'],
  ['chevronRight', 'chevronRight'],
  ['chevronDown', 'chevronDown'],
]

function NavSpecimen({ labeled = false }) {
  return (
    <div
      className={`lib-nav-specimen${labeled ? ' is-labeled' : ''}`}
      aria-hidden="true"
    >
      <span className="lib-nav-specimen__item is-active">
        <Icon name="home" size={labeled ? 18 : 14} />
        {labeled ? <span>首页</span> : null}
      </span>
      <span className="lib-nav-specimen__item">
        <Icon name="pencil" size={labeled ? 18 : 14} />
        {labeled ? <span>文章</span> : null}
      </span>
      <span className="lib-nav-specimen__item">
        <Icon name="info" size={labeled ? 18 : 14} />
        {labeled ? <span>关于</span> : null}
      </span>
      <span className="lib-nav-specimen__item">
        <Icon name="more" size={labeled ? 18 : 14} />
        {labeled ? <span>更多</span> : null}
      </span>
      <span className="lib-nav-specimen__item">
        <Icon name="settings" size={labeled ? 18 : 14} />
        {labeled ? <span>设置</span> : null}
      </span>
    </div>
  )
}

function RailSpecimen({ progress = false }) {
  const steps = progress ? 15 : 6
  const active = progress ? 8 : 3

  return (
    <div className={`lib-rail-specimen${progress ? ' is-progress' : ''}`} aria-hidden="true">
      {Array.from({ length: steps }, (_, index) => (
        <span
          key={index}
          className={[
            'lib-rail-specimen__tick',
            index < active ? 'is-passed' : '',
            index === active ? 'is-current' : '',
          ].filter(Boolean).join(' ')}
        />
      ))}
    </div>
  )
}

function IslandSpecimen({ expanded = false }) {
  return (
    <div className={`lib-island-specimen${expanded ? ' is-expanded' : ''}`} aria-hidden="true">
      <div className="lib-island-specimen__bar">
        <span className="lib-island-specimen__count">02 / 04</span>
        <span className="lib-island-specimen__title">和我的项目的关系</span>
        <span className="lib-island-specimen__dots">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className={index === 1 ? 'is-active' : ''} />
          ))}
        </span>
      </div>
      {expanded ? (
        <div className="lib-island-specimen__panel">
          <span>核心观点</span>
          <span className="is-active">让我印象最深的部分</span>
          <span>和我的项目的关系</span>
          <span>一些疑问</span>
        </div>
      ) : null}
    </div>
  )
}

function ThemeSpecimen() {
  return (
    <div className="lib-theme-specimen" aria-hidden="true">
      <span><Icon name="home" size={14} /></span>
      <span className="is-active"><Icon name="pencil" size={14} /></span>
      <span><Icon name="info" size={14} /></span>
    </div>
  )
}

function DrawersSpecimen() {
  return (
    <div className="lib-drawers-specimen" aria-hidden="true">
      <span><b>01</b>基础组件<i>⌄</i></span>
      <span><b>02</b>LOGO 徽标<i>⌄</i></span>
      <span><b>03</b>字体样张<i>⌄</i></span>
    </div>
  )
}

export function ButtonPreview() {
  return (
    <div className="lib-preview lib-preview--buttons" aria-hidden="true">
      <span className="btn btn--primary btn--sm">主要</span>
      <span className="btn btn--secondary btn--sm">次要</span>
      <span className="btn btn--text btn--sm">文字</span>
    </div>
  )
}

export function ButtonDemo() {
  const [count, setCount] = useState(0)

  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-row">
        <Button variant="primary" onClick={() => setCount((value) => value + 1)}>主要按钮</Button>
        <Button onClick={() => setCount((value) => value + 1)}>次要按钮</Button>
        <Button variant="text" onClick={() => setCount((value) => value + 1)}>文字按钮</Button>
      </div>
      <div className="lib-demo-row">
        <Button size="sm" variant="primary">小号</Button>
        <Button disabled>禁用</Button>
        <span className="lib-demo-readout" role="status">点击次数 {count}</span>
      </div>
    </div>
  )
}

export function FieldPreview() {
  return (
    <div className="lib-preview lib-preview--field" aria-hidden="true">
      <span className="field__label">邮箱</span>
      <span className="lib-preview-input">you@example.com</span>
      <span className="field__hint">用于接收站内回复</span>
    </div>
  )
}

export function FieldDemo() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const validate = () => {
    if (!email.trim()) setError('邮箱不能为空')
    else if (!email.includes('@')) setError('请检查邮箱格式')
    else setError('')
  }

  return (
    <div className="lib-demo-stack lib-demo-form">
      <Field label="邮箱" hint="失焦时会校验格式">
        <input
          className="control"
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(event) => {
            setEmail(event.target.value)
            if (error) setError('')
          }}
          onBlur={validate}
        />
      </Field>
      <Field label="校验状态" error={error || undefined} hint="错误信息会替换提示行">
        <input className="control" value={error ? '格式不正确' : '等待输入'} readOnly aria-readonly="true" />
      </Field>
    </div>
  )
}

export function SwitchPreview() {
  return (
    <div className="lib-preview lib-preview--switch" aria-hidden="true">
      <span className="switch switch--on"><span className="switch__thumb" /></span>
      <span className="switch"><span className="switch__thumb" /></span>
      <span className="switch"><span className="switch__thumb" /></span>
    </div>
  )
}

export function SwitchDemo() {
  const [autoSave, setAutoSave] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)

  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-row">
        <Switch checked={autoSave} onChange={setAutoSave} label="自动保存" />
        <span className="lib-demo-label">自动保存</span>
      </div>
      <div className="lib-demo-row">
        <Switch checked={reduceMotion} onChange={setReduceMotion} label="减少动效" />
        <span className="lib-demo-label">减少动效</span>
      </div>
      <div className="lib-demo-row">
        <Switch checked disabled label="禁用示例" />
        <span className="lib-demo-label">禁用示例</span>
      </div>
    </div>
  )
}

export function IconPreview() {
  return (
    <div className="lib-preview lib-preview--icons" aria-hidden="true">
      <Icon name="home" />
      <Icon name="pencil" />
      <Icon name="compass" />
      <Icon name="settings" />
    </div>
  )
}

export function IconDemo() {
  return (
    <div className="lib-icon-grid">
      {ICON_NAMES.map(([name]) => (
        <div className="lib-icon-cell" key={name}>
          <Icon name={name} size={24} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  )
}

export function LinkPreview() {
  return (
    <div className="lib-preview lib-preview--links" aria-hidden="true">
      <span className="link-inline">正文链接</span>
      <span className="link-action">操作链接 →</span>
    </div>
  )
}

export function LinkDemo() {
  return (
    <div className="lib-demo-stack">
      <div className="glass-card lib-demo-plate">
        <p className="lib-demo-paragraph">
          正文里的 <a className="link-inline" href="#library-detail-notes">站内链接</a>
          用赭石色下划线，悬停时线宽升到 2px。
        </p>
        <p className="lib-demo-paragraph">
          <a className="link-action" href="#library-detail-preview">操作链接</a>
          平时不加下划线，悬停才变成赭石色。
        </p>
      </div>
    </div>
  )
}

export function TypographyPreview() {
  return (
    <div className="lib-preview lib-preview--type" aria-hidden="true">
      <span className="lib-type-specimen__display">Aa 字</span>
      <span className="lib-type-specimen__stack">
        <span className="lib-type-specimen__heading">标题 Serif</span>
        <span className="lib-type-specimen__body">正文 Serif 16</span>
        <span className="lib-type-specimen__meta">META · SERIF 12</span>
      </span>
    </div>
  )
}

export function TypographyDemo() {
  return (
    <div className="lib-demo-stack lib-demo-type">
      <div className="lib-demo-type__row">
        <span className="lib-demo-type__label">DISPLAY · 36</span>
        <span className="lib-demo-type__display">页面大标题</span>
      </div>
      <div className="lib-demo-type__row">
        <span className="lib-demo-type__label">HEADING · 20</span>
        <span className="lib-demo-type__heading">章节标题 Heading</span>
      </div>
      <div className="lib-demo-type__row">
        <span className="lib-demo-type__label">BODY · 16</span>
        <p className="lib-demo-type__body">
          正文段落使用思源宋，行高 1.7，
          <a className="link-inline" href="#library-detail-notes">站内链接</a>
          跟随同一节奏。
        </p>
      </div>
      <div className="lib-demo-type__row">
        <span className="lib-demo-type__label">MICRO · 12</span>
        <span className="lib-demo-type__micro">METADATA · 2026</span>
      </div>
    </div>
  )
}

export function NavigationPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <NavSpecimen />
    </div>
  )
}

export function NavigationDemo() {
  return (
    <div className="lib-demo-stack">
      <NavSpecimen labeled />
    </div>
  )
}

export function ChapterRailPreview() {
  return (
    <div className="lib-preview lib-preview--rails" aria-hidden="true">
      <RailSpecimen />
      <RailSpecimen progress />
    </div>
  )
}

export function ChapterRailDemo() {
  return (
    <div className="lib-demo-stack">
      <div className="lib-rail-samples">
        <div className="lib-rail-sample">
          <span>章节模式</span>
          <RailSpecimen />
        </div>
        <div className="lib-rail-sample">
          <span>进度模式 · 15 条</span>
          <RailSpecimen progress />
        </div>
      </div>
    </div>
  )
}

export function TocIslandPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <IslandSpecimen />
    </div>
  )
}

export function TocIslandDemo() {
  return (
    <div className="lib-demo-stack">
      <IslandSpecimen />
      <IslandSpecimen expanded />
    </div>
  )
}

export function BreadcrumbPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <Breadcrumb
        items={[
          { label: '组件库', icon: 'grid' },
          { label: '通用' },
          { label: '按钮' },
        ]}
      />
    </div>
  )
}

export function BreadcrumbDemo() {
  return (
    <div className="lib-demo-stack">
      <Breadcrumb
        className="breadcrumb--capsule"
        items={[
          { label: '组件库', to: '/components', icon: 'grid' },
          { label: '导航' },
          { label: '面包屑' },
        ]}
      />
    </div>
  )
}

export function CardPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <span className="lib-card-specimen glass-card">
        <span className="lib-card-specimen__eyebrow">GLASS CARD</span>
        <span className="lib-card-specimen__title">内容卡片</span>
        <span className="lib-card-specimen__line" />
        <span className="lib-card-specimen__line is-short" />
      </span>
    </div>
  )
}

export function CardDemo() {
  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-cards">
        <article className="glass-card lib-demo-card">
          <span className="lib-demo-card__eyebrow">STATIC</span>
          <h3>静态卡片</h3>
          <p>面板内容常驻，悬停不位移。</p>
        </article>
        <article className="glass-card card--interactive lib-demo-card">
          <span className="lib-demo-card__eyebrow">INTERACTIVE</span>
          <h3>可交互卡片</h3>
          <p>整卡可点时，悬停抬升。</p>
        </article>
      </div>
    </div>
  )
}

export function TagPreview() {
  return (
    <div className="lib-preview lib-preview--tags" aria-hidden="true">
      <Tag>稳定</Tag>
      <Tag tone="accent">核心</Tag>
      <Tag>Lab</Tag>
    </div>
  )
}

export function TagDemo() {
  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-row">
        <Tag>默认</Tag>
        <Tag tone="accent">强调</Tag>
        <Tag>玻璃</Tag>
        <Tag>v2.4</Tag>
      </div>
    </div>
  )
}

function SegmentedSpecimen() {
  return (
    <div
      className="segmented lib-segmented-specimen"
      style={{ '--segmented-index': 0, '--segmented-count': 3 }}
      aria-hidden="true"
    >
      <span className="segmented__indicator" />
      <span className="segmented__option is-active">全部</span>
      <span className="segmented__option">通用</span>
      <span className="segmented__option">导航</span>
    </div>
  )
}

export function SegmentedPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <SegmentedSpecimen />
    </div>
  )
}

export function SegmentedDemo() {
  const [value, setValue] = useState('all')
  const [filterValue, setFilterValue] = useState('all')
  const options = [
    { id: 'all', title: '全部', count: 36 },
    { id: 'general', title: '通用', count: 4 },
    { id: 'navigation', title: '导航', count: 6 },
  ]
  const filterOptions = [
    { id: 'all', title: '全部', count: 9 },
    { id: 'new', title: '新增', count: 8 },
    { id: 'improved', title: '优化', count: 7 },
    { id: 'fixed', title: '修复', count: 1 },
  ]
  const active = options.find((option) => option.id === value)
  const activeFilter = filterOptions.find((option) => option.id === filterValue)

  return (
    <div className="lib-demo-stack lib-demo-segmented">
      <Segmented
        label="分段示例"
        options={options}
        value={value}
        onChange={setValue}
      />
      <span className="lib-demo-readout" role="status">当前：{active.title}</span>
      <Segmented
        className="segmented--compact"
        label="紧凑分段示例"
        options={filterOptions}
        value={filterValue}
        onChange={setFilterValue}
      />
      <span className="lib-demo-readout" role="status">当前：{activeFilter.title}</span>
    </div>
  )
}

export function EmptyPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <div className="empty lib-empty-specimen">
        <span className="empty__mark">∅</span>
        <p className="empty__text">暂无内容</p>
      </div>
    </div>
  )
}

export function EmptyDemo() {
  return (
    <div className="lib-demo-stack lib-demo-empty-wrap">
      <Empty className="empty--panel lib-demo-empty" text="没有匹配的组件">
        <span className="btn btn--text btn--sm">清除筛选</span>
      </Empty>
    </div>
  )
}

export function BadgePreview() {
  return (
    <div className="lib-preview lib-preview--badges" aria-hidden="true">
      <Badge>稳定</Badge>
      <Badge tone="accent">核心</Badge>
      <Badge tone="muted">Lab 专用</Badge>
    </div>
  )
}

export function BadgeDemo() {
  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-row">
        <Badge>稳定</Badge>
        <Badge tone="accent">核心</Badge>
        <Badge tone="muted">Lab 专用</Badge>
      </div>
      <span className="lib-demo-readout">6px 圆点 · 微字 12 · 不承载点击</span>
    </div>
  )
}

const SAMPLE_IMAGE = '/content-images/library-sample.svg'

export function ImagePreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <span className="lib-media-specimen">
        <img
          className="lib-media-specimen__wide"
          src={SAMPLE_IMAGE}
          alt=""
          width="1600"
          height="900"
        />
        <img
          className="lib-media-specimen__thumb"
          src={SAMPLE_IMAGE}
          alt=""
          width="1600"
          height="1600"
        />
      </span>
    </div>
  )
}

export function ImageDemo() {
  return (
    <div className="lib-demo-stack lib-demo-media">
      <div className="lib-media-grid">
        <figure className="lib-media-cell is-wide">
          <img src={SAMPLE_IMAGE} alt="纸面与赭石的抽象样本" width="1600" height="900" />
          <figcaption>宽图 · 16:9</figcaption>
        </figure>
        <figure className="lib-media-cell is-card">
          <img src={SAMPLE_IMAGE} alt="" width="1600" height="1200" />
          <figcaption>卡片 · 4:3</figcaption>
        </figure>
        <figure className="lib-media-cell is-square">
          <img src={SAMPLE_IMAGE} alt="" width="1600" height="1600" />
          <figcaption>方图 · 1:1</figcaption>
        </figure>
      </div>
    </div>
  )
}

export function ThemeSwitcherPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <ThemeSpecimen />
    </div>
  )
}

export function ThemeSwitcherDemo() {
  const { theme, resolvedTheme, setTheme, settings } = useThemeSwitcherTheme()

  return (
    <div className="lib-demo-theme">
      <div className="theme-provider" data-theme={resolvedTheme}>
        <ThemeSwitcher inline value={theme} onValueChange={setTheme} settings={settings} />
      </div>
    </div>
  )
}

export function LabSectionPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <DrawersSpecimen />
    </div>
  )
}

export function LabSectionDemo() {
  return (
    <div className="lib-demo-lab">
      <LabSection
        id="library-demo-drawer-a"
        index="01"
        title="基础组件"
        description="字体、按钮与表单"
        count="6 张卡"
      >
        <div className="lib-demo-tiles" aria-hidden="true">
          <span><Icon name="home" size={18} /></span>
          <span><Icon name="pencil" size={18} /></span>
          <span><Icon name="grid" size={18} /></span>
          <span><Icon name="compass" size={18} /></span>
        </div>
      </LabSection>
      <LabSection
        id="library-demo-drawer-b"
        index="02"
        title="互动组件"
        description="可以直接体验的交互"
        count="29 个"
      >
        <div className="lib-demo-tiles" aria-hidden="true">
          <span><Icon name="disc" size={18} /></span>
          <span><Icon name="mail" size={18} /></span>
          <span><Icon name="github" size={18} /></span>
          <span><Icon name="search" size={18} /></span>
        </div>
      </LabSection>
    </div>
  )
}

export function DividerPreview() {
  return (
    <div className="lib-preview lib-preview--divider" aria-hidden="true">
      <Divider>章节</Divider>
    </div>
  )
}

export function DividerDemo() {
  return (
    <div className="lib-demo-stack lib-demo-divider">
      <Divider />
      <Divider variant="dashed">虚线分组</Divider>
      <Divider>下一节 · 递归</Divider>
    </div>
  )
}

function GridSpecimen({ compact = false }) {
  const rows = compact
    ? [[12], [6, 6], [4, 4, 4]]
    : [[12], [6, 6], [4, 4, 4], [3, 3, 3, 3]]

  return (
    <div className={`lib-grid-specimen${compact ? ' is-compact' : ''}`} aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <span className="lib-grid-specimen__row" key={rowIndex}>
          {row.map((span, index) => (
            <i key={index} style={{ gridColumn: `span ${span}` }}>{span}</i>
          ))}
        </span>
      ))}
    </div>
  )
}

export function GridPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <GridSpecimen compact />
    </div>
  )
}

export function GridDemo() {
  return (
    <div className="lib-demo-stack lib-demo-grid">
      <GridSpecimen />
    </div>
  )
}

function SpaceSpecimen({ compact = false }) {
  const gaps = compact ? [1, 2, 3] : [1, 2, 3, 4]

  return (
    <div className="lib-space-specimen" aria-hidden="true">
      {gaps.map((gap) => (
        <span className="lib-space-specimen__row" key={gap} style={{ gap: `var(--space-${gap})` }}>
          <span className="lib-space-specimen__label">gap-{gap}</span>
          <i /><i /><i />
        </span>
      ))}
    </div>
  )
}

export function SpacePreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <SpaceSpecimen compact />
    </div>
  )
}

export function SpaceDemo() {
  return (
    <div className="lib-demo-stack lib-demo-space">
      <SpaceSpecimen />
    </div>
  )
}

function TimelineSpecimen({ compact = false }) {
  const items = compact
    ? [
      ['2026.11', '补齐布局与反馈组件'],
      ['2026.10', '章节轨接入全站'],
    ]
    : [
      ['2026.11', '补齐布局与反馈组件', '分割线、标签页、对话框等 18 个。'],
      ['2026.10', '章节轨接入全站', '无章节页面切成 15 条进度轨。'],
      ['2026.09', '纸面简历与工牌', '四块面板共用吸附内容窗口。'],
      ['2026.08', '组件库总览', '分类筛选与详情模板上线。'],
    ]

  return (
    <ol className={`lib-timeline-specimen${compact ? ' is-compact' : ''}`} aria-hidden="true">
      {items.map(([date, title, desc]) => (
        <li key={title}>
          <span className="lib-timeline-specimen__date">{date}</span>
          <span className="lib-timeline-specimen__title">{title}</span>
          {desc ? <span className="lib-timeline-specimen__desc">{desc}</span> : null}
        </li>
      ))}
    </ol>
  )
}

export function TimelinePreview() {
  return (
    <div className="lib-preview lib-preview--timeline" aria-hidden="true">
      <TimelineSpecimen compact />
    </div>
  )
}

export function TimelineDemo() {
  return (
    <div className="lib-demo-stack lib-demo-timeline">
      <TimelineSpecimen />
    </div>
  )
}

function StatisticSpecimen({ compact = false }) {
  const items = compact
    ? [
      ['组件', '36', '个', null],
      ['分类', '7', '类', null],
    ]
    : [
      ['组件', '36', '个', '↑ 18'],
      ['分类', '7', '类', '本周 +2'],
      ['在线时长', '12.4', 'h', '↑ 8%'],
    ]

  return (
    <div className="lib-stats-specimen" aria-hidden="true">
      {items.map(([label, value, suffix, trend]) => (
        <span className="lib-stat-specimen" key={label}>
          <span className="lib-stat-specimen__label">{label}</span>
          <span className="lib-stat-specimen__value">{value}<i>{suffix}</i></span>
          {trend ? <span className="lib-stat-specimen__trend">{trend}</span> : null}
        </span>
      ))}
    </div>
  )
}

export function StatisticPreview() {
  return (
    <div className="lib-preview lib-preview--stats" aria-hidden="true">
      <StatisticSpecimen compact />
    </div>
  )
}

export function StatisticDemo() {
  return (
    <div className="lib-demo-stack lib-demo-stats">
      <StatisticSpecimen />
    </div>
  )
}

function TableSpecimen({ compact = false }) {
  const rows = compact
    ? [
      { name: '按钮', status: 'stable' },
      { name: '标签页', status: 'stable' },
    ]
    : [
      { name: '按钮', category: '通用', status: 'stable', count: '2' },
      { name: '标签页', category: '导航', status: 'stable', count: '3' },
      { name: '滑块', category: '数据录入', status: 'stable', count: '1' },
      { name: '时间线', category: '数据展示', status: 'stable', count: '2' },
      { name: '对话框', category: '反馈', status: 'core', count: '1' },
    ]

  return (
    <div className={`lib-table-specimen${compact ? ' is-compact' : ''}`} aria-hidden="true">
      <table>
        <thead>
          <tr>
            <th scope="col">组件</th>
            {compact ? null : <th scope="col">分类</th>}
            <th scope="col">状态</th>
            {compact ? null : <th scope="col" className="is-num">变体</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              {compact ? null : <td>{row.category}</td>}
              <td>
                <Badge tone={row.status === 'core' ? 'accent' : 'neutral'}>
                  {row.status === 'core' ? '核心' : '稳定'}
                </Badge>
              </td>
              {compact ? null : <td className="is-num">{row.count}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TablePreview() {
  return (
    <div className="lib-preview lib-preview--table" aria-hidden="true">
      <TableSpecimen compact />
    </div>
  )
}

export function TableDemo() {
  return (
    <div className="lib-demo-stack lib-demo-table">
      <TableSpecimen />
    </div>
  )
}

function ListSpecimen({ compact = false }) {
  const items = compact
    ? [
      { title: '分割线', meta: 'Sep 11' },
      { title: '标签页', meta: 'Sep 09' },
    ]
    : [
      { index: '01', title: '补齐布局组件', desc: '分隔线、栅格、间距', meta: '11 月 11 日' },
      { index: '02', title: '导航与录入', desc: '标签页、分页、滑块、复选框、选择器', meta: '11 月 09 日' },
      { index: '03', title: '数据展示', desc: '时间线、统计数值、表格、列表', meta: '11 月 07 日' },
      { index: '04', title: '反馈组件', desc: '警告、进度、骨架屏、加载中、结果页、对话框', meta: '11 月 05 日' },
    ]

  return (
    <div className={`lib-list-specimen${compact ? ' is-compact' : ''}`} aria-hidden="true">
      {items.map((item) => (
        <span className="lib-list-specimen__row" key={item.title}>
          {item.index ? <span className="lib-list-specimen__index">{item.index}</span> : null}
          <span className="lib-list-specimen__main">
            <span className="lib-list-specimen__title">{item.title}</span>
            {item.desc ? <span className="lib-list-specimen__desc">{item.desc}</span> : null}
          </span>
          <span className="lib-list-specimen__meta">{item.meta}</span>
        </span>
      ))}
    </div>
  )
}

export function ListPreview() {
  return (
    <div className="lib-preview lib-preview--list" aria-hidden="true">
      <ListSpecimen compact />
    </div>
  )
}

export function ListDemo() {
  return (
    <div className="lib-demo-stack lib-demo-list">
      <ListSpecimen />
    </div>
  )
}

export function TabsPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <div className="tabs lib-tabs-specimen">
        <span className="tabs__tab is-active">概览<span className="tabs__count">12</span></span>
        <span className="tabs__tab">接口</span>
        <span className="tabs__tab">示例</span>
      </div>
    </div>
  )
}

export function TabsDemo() {
  const [tab, setTab] = useState('overview')
  const items = [
    { id: 'overview', label: '概览', count: 12 },
    { id: 'api', label: '接口' },
    { id: 'demo', label: '示例', count: 3 },
  ]

  return (
    <div className="lib-demo-stack lib-demo-tabs">
      <Tabs label="标签页示例" items={items} value={tab} onChange={setTab} />
      <div className="lib-tabs-panel" role="tabpanel">
        {tab === 'overview' ? (
          <div className="lib-demo-row">
            <Badge>稳定</Badge>
            <Badge tone="accent">核心</Badge>
            <Tag>导航</Tag>
          </div>
        ) : null}
        {tab === 'api' ? (
          <div className="lib-demo-row">
            <Tag>items</Tag>
            <Tag>value</Tag>
            <Tag>onChange</Tag>
          </div>
        ) : null}
        {tab === 'demo' ? (
          <div className="lib-demo-tiles">
            <span><Icon name="grid" size={18} /></span>
            <span><Icon name="compass" size={18} /></span>
            <span><Icon name="pencil" size={18} /></span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function PaginationPreview() {
  return (
    <div className="lib-preview" aria-hidden="true">
      <div className="pagination lib-pagination-specimen">
        <span className="pagination__button"><Icon name="chevronLeft" size={16} /></span>
        <span className="pagination__button">1</span>
        <span className="pagination__button is-active">2</span>
        <span className="pagination__button">3</span>
        <span className="pagination__ellipsis">…</span>
        <span className="pagination__button">9</span>
      </div>
    </div>
  )
}

export function PaginationDemo() {
  const [page, setPage] = useState(3)

  return (
    <div className="lib-demo-stack lib-demo-pagination">
      <Pagination page={page} totalPages={12} onChange={setPage} />
      <span className="lib-demo-readout" role="status">第 {page} / 12 页</span>
    </div>
  )
}

export function SliderPreview() {
  return (
    <div className="lib-preview lib-preview--slider" aria-hidden="true">
      <div className="slider">
        <div className="slider__head">
          <span className="slider__label">正文宽度</span>
          <span className="slider__value">65 ch</span>
        </div>
        <div className="lib-slider-track" style={{ '--slider-progress': '62%' }}>
          <span className="lib-slider-track__thumb" />
        </div>
      </div>
    </div>
  )
}

export function SliderDemo() {
  const [width, setWidth] = useState(65)

  return (
    <div className="lib-demo-stack lib-demo-slider">
      <Slider
        label="正文宽度"
        value={width}
        min={45}
        max={85}
        onChange={setWidth}
        formatValue={(current) => `${current} ch`}
      />
      <span className="lib-demo-readout" role="status">当前 {width} ch</span>
    </div>
  )
}

export function CheckboxPreview() {
  return (
    <div className="lib-preview lib-preview--checkbox" aria-hidden="true">
      <span className="checkbox">
        <span className="checkbox__box is-checked"><Icon name="check" size={12} /></span>
        <span className="checkbox__label">自动保存</span>
      </span>
      <span className="checkbox">
        <span className="checkbox__box" />
        <span className="checkbox__label">同步主题</span>
      </span>
    </div>
  )
}

export function CheckboxDemo() {
  const [autoSave, setAutoSave] = useState(true)
  const [syncTheme, setSyncTheme] = useState(false)

  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-row">
        <Checkbox checked={autoSave} onChange={setAutoSave} label="自动保存" />
      </div>
      <div className="lib-demo-row">
        <Checkbox checked={syncTheme} onChange={setSyncTheme} label="同步主题" />
      </div>
      <div className="lib-demo-row">
        <Checkbox checked disabled label="禁用示例" />
      </div>
      <span className="lib-demo-readout" role="status">
        已选 {Number(autoSave) + Number(syncTheme)} 项
      </span>
    </div>
  )
}

export function SelectPreview() {
  return (
    <div className="lib-preview lib-preview--select" aria-hidden="true">
      <span className="field__label">默认字号</span>
      <span className="lib-preview-input lib-select-static">
        <span>16 px · 正文</span>
        <Icon name="chevronDown" size={16} />
      </span>
    </div>
  )
}

export function SelectDemo() {
  const [size, setSize] = useState('16')

  return (
    <div className="lib-demo-stack lib-demo-select">
      <Select
        label="默认字号"
        value={size}
        onChange={setSize}
        hint="只影响正文，不改变标题阶梯。"
        options={[
          { value: '14', label: '14 px · 紧凑' },
          { value: '16', label: '16 px · 正文' },
          { value: '18', label: '18 px · 导语' },
        ]}
      />
      <span className="lib-demo-readout" role="status">当前 {size} px</span>
    </div>
  )
}

export function AlertPreview() {
  return (
    <div className="lib-preview lib-preview--alert" aria-hidden="true">
      <Alert tone="accent" title="已保存">改动会同步到本地草稿。</Alert>
    </div>
  )
}

export function AlertDemo() {
  const [visible, setVisible] = useState(true)

  return (
    <div className="lib-demo-stack lib-demo-alerts">
      {visible ? (
        <Alert tone="accent" title="已保存" onClose={() => setVisible(false)}>
          改动会同步到本地草稿。
        </Alert>
      ) : (
        <Button variant="text" size="sm" onClick={() => setVisible(true)}>重新显示提示</Button>
      )}
      <Alert tone="info" title="新版本可用">刷新后载入新的组件说明。</Alert>
      <Alert tone="danger" title="网络请求失败">草稿仍在本地，稍后可重试。</Alert>
    </div>
  )
}

export function ProgressPreview() {
  return (
    <div className="lib-preview lib-preview--progress" aria-hidden="true">
      <Progress value={64} label="本月更新" />
    </div>
  )
}

export function ProgressDemo() {
  return (
    <div className="lib-demo-stack lib-demo-progress">
      <Progress value={72} label="组件补齐" />
      <Progress value={46} label="文档同步" tone="muted" />
      <Progress value={12} label="遗留风险" tone="danger" />
    </div>
  )
}

export function SkeletonPreview() {
  return (
    <div className="lib-preview lib-preview--skeleton" aria-hidden="true">
      <Skeleton lines={3} />
    </div>
  )
}

export function SkeletonDemo() {
  return (
    <div className="lib-demo-stack lib-demo-skeleton">
      <div className="lib-demo-skeleton__row">
        <Skeleton variant="card" />
        <Skeleton lines={4} />
      </div>
      <span className="lib-demo-readout">占位块不读屏，容器用 aria-busy 标记加载</span>
    </div>
  )
}

export function SpinPreview() {
  return (
    <div className="lib-preview lib-preview--spin" aria-hidden="true">
      <Spin size={30} />
    </div>
  )
}

export function SpinDemo() {
  return (
    <div className="lib-demo-stack">
      <div className="lib-demo-row">
        <Spin size={18} />
        <span className="lib-demo-label">18</span>
        <Spin size={24} />
        <span className="lib-demo-label">24</span>
        <Spin size={32} />
        <span className="lib-demo-label">32</span>
      </div>
      <div className="lib-demo-row">
        <Spin label="正在载入" />
        <span className="lib-demo-label">带读屏文案</span>
      </div>
    </div>
  )
}

export function ResultPreview() {
  return (
    <div className="lib-preview lib-preview--result" aria-hidden="true">
      <Result status="success" title="已保存" description="改动会同步到本地草稿。" />
    </div>
  )
}

export function ResultDemo() {
  return (
    <div className="lib-demo-stack lib-demo-result">
      <Result status="success" title="发布完成" description="36 个组件已写入说明页。">
        <span className="btn btn--secondary btn--sm">查看记录</span>
        <span className="btn btn--text btn--sm">返回组件库</span>
      </Result>
    </div>
  )
}

export function ModalPreview() {
  return (
    <div className="lib-preview lib-preview--modal" aria-hidden="true">
      <div className="lib-modal-specimen">
        <span className="lib-modal-specimen__bar">
          <span>发布更新</span>
          <Icon name="close" size={14} />
        </span>
        <span className="lib-modal-specimen__line" />
        <span className="lib-modal-specimen__line is-short" />
        <span className="lib-modal-specimen__foot">
          <i /><i />
        </span>
      </div>
    </div>
  )
}

export function ModalDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lib-demo-stack lib-demo-modal">
      <Button variant="primary" onClick={() => setOpen(true)}>打开对话框</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="发布更新"
        footer={(
          <>
            <Button variant="text" onClick={() => setOpen(false)}>取消</Button>
            <Button variant="primary" onClick={() => setOpen(false)}>确认发布</Button>
          </>
        )}
      >
        <p>发布后，更新记录与组件说明会同步到线上。</p>
      </Modal>
    </div>
  )
}
