#!/bin/bash
# 每日 AI/计算机简报：抓数据 → 体检解读稿 → 渲染报告
# 用法：./run-daily.sh              抓今天并渲染
#       ./run-daily.sh 2026-11-02   指定日期
#
# 退出码：0 = 全部正常（体检通过或仅 WARN）
#        1 = 抓取/渲染失败，或解读稿体检有 ERROR（报告会生成，但不应直接发布）
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1

# 优先用项目 venv：Scrapling 要求 Python ≥3.10，而 `python3` 命中的是 Apple CLT 的 3.9。
# venv 不存在时退回系统 python3：抓取降级为正则解析，但 lint.py 会因缺 PyYAML 判 ERROR，
# 于是本脚本以退出码 1 结束——能出稿，但不假装验过。不要为此放宽闸门。
PY="$(command -v python3)"
if [ -x "$DIR/.venv/bin/python" ]; then
  PY="$DIR/.venv/bin/python"
fi

DAY="${1:-$(date +%Y-%m-%d)}"
# FORCE=1 ./run-daily.sh  可强制重抓（默认冻结当天快照，避免解读稿与数据错位）
FORCE_ARG=""
[ "${FORCE:-0}" = "1" ] && FORCE_ARG="--force"

# 产出只进站点 content/reports/，本地不再留 reports/ 副本。
# 目录定位统一由 render.py 负责（reports-tool 的上一级 + content/reports），
# 不可用会直接报错退出——这里先问它一次，好让下面的日志指向真实路径。
OUT_DIR="$("$PY" -c 'import render; print(render.REPORTS)' 2>&1)"
if [ -z "${OUT_DIR:-}" ] || [ ! -d "$OUT_DIR" ]; then
  echo "!! 站点输出目录不可用：${OUT_DIR:-<空>}" >&2
  echo "!! 日报必须写进 WUYUWeb/content/reports/，本工具不会回退到本地。已中止。" >&2
  exit 1
fi
mkdir -p data insights logs
echo "输出目录：$OUT_DIR" >&2

log() { echo "$@" | tee -a "logs/run.log"; }

log "=== [$(date '+%F %T')] 开始抓取 $DAY (python: $PY) ==="
"$PY" fetch.py --date "$DAY" $FORCE_ARG 2>&1 | tee -a "logs/run.log"
rc_fetch=${PIPESTATUS[0]}

# 第一遍体检（渲染前）：只看解读稿。此时站点里那份马上要被覆盖，
# 验它没有意义，所以加 --insights-only，免得旧文件的毛病污染退出码。
log "=== 体检解读稿（只看解读稿）==="
"$PY" lint.py --date "$DAY" --insights-only 2>&1 | tee -a "logs/run.log"
rc_lint_content=${PIPESTATUS[0]}
if [ "$rc_lint_content" -eq 1 ]; then
  log "!! 解读稿体检未通过（ERROR）——报告仍会生成，但请先修 insights/$DAY.json 再发布。"
fi

log "=== 渲染报告 ==="
"$PY" render.py --date "$DAY" 2>&1 | tee -a "logs/run.log"
rc_render=${PIPESTATUS[0]}

# 第二遍体检（渲染后）：这一步才校验「刚生成的那份报告文件」本身，是发布门槛。
# 曾经的坑：只跑渲染前那一遍，校验的其实是上一次的产物；新的一天还会因为文件
# 不存在而只报 WARN，然后照样生成一份没人验过的报告交出去。
log "=== 交付前自检（格式 + 内容）==="
"$PY" lint.py --date "$DAY" 2>&1 | tee -a "logs/run.log"
rc_lint_final=${PIPESTATUS[0]}
if [ "$rc_lint_final" -eq 1 ]; then
  log "!! 交付前自检未通过——$OUT_DIR/$DAY.md 已生成但**不要发布**，先修到 0 ERROR。"
fi

# 只有体检 0 ERROR 且有产出时才报 OK：否则上面那句「不要发布」后面
# 紧跟一句 OK，容易被误读成「都好了」。
if [ -f "$OUT_DIR/$DAY.md" ] && [ "$rc_lint_final" -eq 0 ]; then
  log "OK: $OUT_DIR/$DAY.md"
elif [ ! -f "$OUT_DIR/$DAY.md" ]; then
  log "!! 没找到产出 $OUT_DIR/$DAY.md —— 渲染没有落进站点目录，排查后才可交付。"
else
  log "!! $OUT_DIR/$DAY.md 已落盘，但自检未过——修好 insights 后重跑，勿发布。"
fi
exit $(( rc_fetch != 0 || rc_render != 0 || rc_lint_content == 1 || rc_lint_final == 1 ))