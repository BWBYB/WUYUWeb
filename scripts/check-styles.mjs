#!/usr/bin/env node
// 样式守门：扫描 src 下的 CSS，只拦「新增」的违规，存量走 baseline。
//
// 规则：
//   1. font-size 必须是 var(--fs-*)，裸 px 只有图标/装饰例外（记在 baseline）
//   2. 中文标题不许负字距（letter-spacing 为负），存量例外记在 baseline
//   3. 裸 hex 颜色只允许出现在 token 源文件 src/index.css
//
// 用法：
//   node scripts/check-styles.mjs           只检查，超出 baseline 就退出 1
//   node scripts/check-styles.mjs --update  重写 baseline（改完必须人review）

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const BASELINE_PATH = path.join(ROOT, 'scripts/style-baseline.json')
const SKIP_DIRS = [
  'src/components/lab/',
  'src/pages/Lab.css',
  'src/components/ThreeHero.css',
]
const COLOR_TOKEN_SOURCE = 'src/index.css'

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(ROOT, full).split(path.sep).join('/')
    if (entry.isDirectory()) walk(full, out)
    else if (entry.isFile() && entry.name.endsWith('.css')) out.push(rel)
  }
  return out
}

function skipped(file) {
  return SKIP_DIRS.some(prefix => file === prefix || file.startsWith(prefix))
}

// 把 CSS 压成「一行一个 token」，便于用栈跟踪当前选择器。
// @media 会作为一层压栈，但声明只归到栈顶的普通规则。
function parseRules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const lines = clean.replace(/\{/g, '{\n').replace(/\}/g, '\n}\n').split('\n')
  const rules = []
  const stack = []
  let pending = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.endsWith('{')) {
      stack.push(line.slice(0, -1).trim())
      continue
    }
    if (line === '}') {
      stack.pop()
      continue
    }
    // 单行规则：.a { font-size: 12px; }
    if (line.includes('{') && line.includes('}')) {
      const open = line.indexOf('{')
      const close = line.lastIndexOf('}')
      const selector = line.slice(0, open).trim()
      const body = line.slice(open + 1, close)
      rules.push({ selector, body })
      continue
    }
    // 普通声明行，归到最近的普通选择器
    const selector = [...stack].reverse().find(item => !item.startsWith('@')) || ''
    if (selector) {
      if (!pending || pending.selector !== selector) {
        pending = { selector, body: '' }
        rules.push(pending)
      }
      pending.body += `${line}\n`
    }
  }
  return rules
}

function scan() {
  const stats = { fontSize: {}, negativeTracking: {}, hex: {} }
  const samples = { fontSize: {}, negativeTracking: {}, hex: {} }
  const files = walk(path.join(ROOT, 'src')).filter(file => !skipped(file))

  for (const file of files) {
    const rules = parseRules(fs.readFileSync(path.join(ROOT, file), 'utf8'))

    for (const { selector, body } of rules) {
      const sizes = body.match(/font-size:\s*[\d.]+px/g) || []
      if (sizes.length) {
        stats.fontSize[file] = (stats.fontSize[file] || 0) + sizes.length
        samples.fontSize[file] = samples.fontSize[file] || []
        for (const hit of sizes) samples.fontSize[file].push(`${selector || '(root)'} → ${hit}`)
      }

      const tracking = body.match(/letter-spacing:\s*-\s*[\d.]+(?:px|em|rem)/g) || []
      if (tracking.length) {
        stats.negativeTracking[file] = (stats.negativeTracking[file] || 0) + tracking.length
        samples.negativeTracking[file] = samples.negativeTracking[file] || []
        for (const hit of tracking) samples.negativeTracking[file].push(`${selector || '(root)'} → ${hit}`)
      }

      if (file !== COLOR_TOKEN_SOURCE) {
        const colors = body.match(/#[0-9a-fA-F]{3,8}\b/g) || []
        if (colors.length) {
          stats.hex[file] = (stats.hex[file] || 0) + colors.length
          samples.hex[file] = samples.hex[file] || []
          for (const hit of colors) samples.hex[file].push(`${selector || '(root)'} → ${hit}`)
        }
      }
    }
  }

  return { stats, samples, files }
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return { fontSize: {}, negativeTracking: {}, hex: {} }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
}

function compare(label, actual, baseline, samples) {
  const problems = []
  for (const [file, count] of Object.entries(actual)) {
    const allowed = baseline[file] || 0
    if (count > allowed) {
      problems.push({ file, count, allowed, samples: samples[file]?.slice(-(count - allowed)) || [] })
    }
  }
  return problems
}

const { stats, samples, files } = scan()
const updating = process.argv.includes('--update')

if (updating) {
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true })
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), ...stats }, null, 2)}\n`,
  )
  console.log('baseline updated:', path.relative(ROOT, BASELINE_PATH))
  process.exit(0)
}

const baseline = loadBaseline()
const groups = [
  ['裸 font-size', compare('fontSize', stats.fontSize, baseline.fontSize || {}, samples.fontSize)],
  ['负字距', compare('negativeTracking', stats.negativeTracking, baseline.negativeTracking || {}, samples.negativeTracking)],
  ['裸 hex 颜色', compare('hex', stats.hex, baseline.hex || {}, samples.hex)],
]

let failed = false
for (const [label, problems] of groups) {
  if (!problems.length) continue
  failed = true
  console.error(`\n✗ ${label}：${problems.length} 个文件超出 baseline`)
  for (const item of problems) {
    console.error(`  ${item.file}  ${item.count} > ${item.allowed}`)
    for (const sample of item.samples) console.error(`    + ${sample}`)
  }
}

if (failed) {
  console.error('\n新增样式必须用 token。确认是合理例外后，运行：')
  console.error('  node scripts/check-styles.mjs --update')
  console.error('并把 baseline 的 diff 一起提交。')
  process.exit(1)
}

console.log(`✓ 样式检查通过（扫描 ${files.length} 个 CSS 文件）`)
