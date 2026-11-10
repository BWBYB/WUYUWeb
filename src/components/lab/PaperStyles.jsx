import './PaperStyles.css'

const VARIANTS = [
  {
    key: 'cream',
    tag: 'A',
    name: '奶油纤维纸',
    desc: '细纤维、轻微不匀与暖白切边，最接近现在的纸色',
    traits: ['细纤维', '切边', '暖白'],
  },
  {
    key: 'grid',
    tag: 'B',
    name: '工程方格纸',
    desc: '方格、装订孔与铜色页边线，像一页工程笔记',
    traits: ['方格', '打孔', '页边线'],
  },
  {
    key: 'kraft',
    tag: 'C',
    name: '牛皮纸',
    desc: '粗纤维、压暗边角与一截胶带，像贴在桌上的资料',
    traits: ['粗纤维', '胶带', '棕调'],
  },
  {
    key: 'deckle',
    tag: 'D',
    name: '羊皮纸毛边',
    desc: '斑驳、做旧压痕与不规则的毛边，旧档案气质',
    traits: ['斑驳', '毛边', '做旧'],
  },
  {
    key: 'news',
    tag: 'E',
    name: '新闻纸',
    desc: '印刷网点、装订孔与铜色页边线，单栏排布，冷灰克制',
    traits: ['网点', '打孔', '页边线'],
  },
]

export default function PaperStyles() {
  return (
    <div className="paper-styles">
      <p className="paper-styles__note">
        同一内容 · 五种纸面 · 悬停抬起看材质；纸面固定浅色，不随主题反色
      </p>
      <div className="paper-styles__wall">
        {VARIANTS.map((variant) => (
          <figure className="paper-styles__item" key={variant.key}>
            <div className={`paper-style paper-style--${variant.key}`}>
              <div className="paper-style__sheet">
                <span className="paper-style__grain" aria-hidden="true" />
                <div className="paper-style__content">
                  <span className="paper-style__eyebrow">ABOUT / 关于</span>
                  <h4 className="paper-style__title">关于</h4>
                  <span className="paper-style__rule" aria-hidden="true" />
                  <p className="paper-style__lead">
                    华侨大学计算机科学与技术专业本科生，目标岗位是前端开发与全栈开发。
                  </p>
                  <div className="paper-style__tags">
                    <span>React</span>
                    <span>Vue3</span>
                    <span>Spring Boot</span>
                  </div>
                  <div className="paper-style__foot">
                    <span>WUYU · RESUME</span>
                    <span>P.02</span>
                  </div>
                </div>
              </div>
            </div>
            <figcaption className="paper-styles__meta">
              <span className="paper-styles__tag">{variant.tag}</span>
              <div className="paper-styles__meta-body">
                <strong>{variant.name}</strong>
                <span className="paper-styles__desc">{variant.desc}</span>
                <span className="paper-styles__traits">
                  {variant.traits.map((trait) => (
                    <i key={trait}>{trait}</i>
                  ))}
                </span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
