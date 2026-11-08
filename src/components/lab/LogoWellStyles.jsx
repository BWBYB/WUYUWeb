import AsciiLogo from './AsciiLogo'
import { PIECES } from './logoPieces'
import './LogoWellStyles.css'

const SAMPLE_IDS = ['react', 'java', 'three', 'mysql']
const SAMPLES = SAMPLE_IDS.map((id) => PIECES.find((piece) => piece.id === id))

const VARIANTS = [
  {
    key: 'specimen',
    tag: 'A',
    name: '字符标本卡',
    desc: '虚线边、四角 + 号，悬停浮出检视网格',
  },
  {
    key: 'tape',
    tag: 'A+',
    name: '打孔纸带',
    desc: '两侧齿孔，给曲线循环的移动卡片用',
  },
  {
    key: 'terminal',
    tag: 'B',
    name: '终端窗框',
    desc: '深色机壳与标题条，屏幕仍是浅色纸',
  },
  {
    key: 'blueprint',
    tag: 'C',
    name: '蓝图坐标纸',
    desc: '常显坐标网格与四角裁切标记',
  },
  {
    key: 'halo',
    tag: 'D',
    name: '裸字符光斑',
    desc: '无边框，只有纸色径向光斑承托',
  },
]

function Tile({ variant, piece, index }) {
  const tileClass = `logo-wells__tile logo-wells__tile--${variant}`
  const indexLabel = String(index + 1).padStart(2, '0')

  if (variant === 'terminal') {
    return (
      <div className={tileClass}>
        <div className="logo-wells__bar" aria-hidden="true">
          <span className="logo-wells__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="logo-wells__bar-title">ASCII.LOGO</span>
        </div>
        <div className="logo-wells__screen">
          <AsciiLogo piece={piece} />
        </div>
      </div>
    )
  }

  return (
    <div className={tileClass} data-index={indexLabel} data-coord={`A${index + 1}`}>
      {variant === 'specimen' && (
        <span className="logo-wells__plus" aria-hidden="true">
          <i>+</i>
          <i>+</i>
          <i>+</i>
          <i>+</i>
        </span>
      )}
      {variant === 'blueprint' && (
        <span className="logo-wells__crops" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
      {variant === 'tape' && <span className="logo-wells__pin" aria-hidden="true" />}
      <AsciiLogo piece={piece} />
      {(variant === 'specimen' || variant === 'blueprint') && (
        <span className="logo-wells__foot" aria-hidden="true">
          {variant === 'specimen' ? (piece.source === 'ascii.rest' ? 'REST' : 'WUYU') : '1:1'}
        </span>
      )}
    </div>
  )
}

export default function LogoWellStyles() {
  return (
    <div className="logo-wells">
      <p className="logo-wells__note">
        同一组样本 · React / Java / Three.js / MySQL · 纸面固定浅色 · 悬停看细节
      </p>
      {VARIANTS.map((variant) => (
        <div className="logo-wells__row" key={variant.key}>
          <div className="logo-wells__meta">
            <span className="logo-wells__tag">{variant.tag}</span>
            <div>
              <h4 className="logo-wells__name">{variant.name}</h4>
              <p className="logo-wells__desc">{variant.desc}</p>
            </div>
          </div>
          <div className="logo-wells__items">
            {SAMPLES.map((piece, index) => (
              <figure className="logo-wells__item" key={`${variant.key}-${piece.id}`}>
                <Tile variant={variant.key} piece={piece} index={index} />
                <figcaption className="logo-wells__label">{piece.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
