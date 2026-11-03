#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""解读稿体检：拦住「占位符泄漏 / 英文冒充说人话 / 字段缺失」这三类缺陷。

用法：
  python3 lint.py                  # 体检今天
  python3 lint.py --date 2026-11-03
  python3 lint.py --all            # 体检 insights/ 下所有文件

退出码：0 = 通过；1 = 有 ERROR（不应发布）；2 = 只有 WARN。

为什么需要它：render.py 只负责排版，报告质量取决于 insights/*.json。
历史上出过的事故：
  - 论文的 plain 字段直接抄了英文 ai_summary，报告里却标着「说人话」
  - why 字段残留模板占位符，字面写着「前 N 名」「+3,xxx star」
"""

import argparse
import glob
import json
import os
import re
import sys
from datetime import datetime

PYYAML_MISSING_HINT = (
    "PyYAML 缺失——frontmatter 真实的 YAML 合法性无法校验。\n"
    "  这道验证是交付闸门的一部分（上一会话专门自测过「用真 PyYAML 解析」），\n"
    "  降级成文本级检查等于闸门静默失效，所以这里判 ERROR 而不是 WARN。\n"
    "  修法：用项目 venv 跑（./.venv/bin/python lint.py …）；\n"
    "        重建 venv：python3.11 -m venv .venv && ./.venv/bin/python -m pip install \"scrapling[all]\" pyyaml"
)

try:
    import yaml          # 有就用真解析器验 frontmatter；缺失时闸门判 ERROR（不静默降级）
except ImportError:      # pragma: no cover
    yaml = None

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
INSIGHTS = os.path.join(BASE, "insights")

# ------------------------------------------------------------------ 规则定义

# 模板占位符：字面出现的 N / xxx / X,XXX 等
PLACEHOLDER_PATTERNS = [
    (r"前\s*N\s*名", "残留模板占位符「前 N 名」"),
    (r"[+＋]\s*[xX]{2,}\s*star", "残留模板占位符「+xxx star」（应填真实星数）"),
    (r"[+＋]?\s*[xX]{2,}", "残留占位符「xxx」"),
    (r"[\d,]+[xX]{2,}", "残留占位符「3,xxx」这类半填数字"),
    (r"\bN\s*名\b", "残留占位符「N 名」"),
    (r"（\s*\+?\s*[\d,]*[xX]+", "括号内星数为占位符"),
    (r"待填|TODO|TBD|FIXME|placeholder", "残留待办标记"),
    (r"等等等+", "疑似省略糊弄"),
]

# 通用填充句：放在任何条目下都成立 = 没有信息量
GENERIC_FILLER = [
    "代表该领域正在关注的方向",
    "建议结合关键词了解其应用场景",
    "值得关注其技术路线与应用场景",
    "对该领域的开发者或研究者有一定参考价值",
    "表现突出的项目之一",
]

CJK = re.compile(r"[\u4e00-\u9fff]")
LATIN_WORD = re.compile(r"[A-Za-z]{3,}")

REQUIRED_PAPER = ("plain", "why")
REQUIRED_REPO = ("plain", "why", "for_who")


def cjk_ratio(s):
    """中文字符占「非空白字符」的比例。"""
    if not s:
        return 0.0
    body = re.sub(r"\s+", "", s)
    if not body:
        return 0.0
    return len(CJK.findall(body)) / len(body)


def looks_english(s):
    """判定一段话是不是「基本没翻」的英文。"""
    if not s:
        return False
    if cjk_ratio(s) >= 0.15:
        return False
    # 有较多英文单词且几乎没有中文 → 认定为未翻译
    return len(LATIN_WORD.findall(s)) >= 8


def check_text(label, text, errors, warns):
    if not text:
        return
    if isinstance(text, list):  # theme 允许写成段落数组
        for i, part in enumerate(text):
            check_text("%s[%d]" % (label, i), part, errors, warns)
        return
    if not isinstance(text, str):
        return
    for pat, why in PLACEHOLDER_PATTERNS:
        if re.search(pat, text):
            errors.append("%s：%s" % (label, why))
    for filler in GENERIC_FILLER:
        if filler in text:
            errors.append("%s：通用填充句「%s」（等于没说，必须换成这一条独有的判断）" % (label, filler))


def lint_one(day, check_report=True):
    ip = os.path.join(INSIGHTS, "%s.json" % day)
    errors, warns = [], []

    if not os.path.exists(ip):
        warns.append("insights/%s.json 不存在——报告会降级为英文摘要。今天还没写解读稿？" % day)
        if check_report:
            lint_report_file(day, errors, warns)
        return errors, warns, None

    with open(ip, encoding="utf-8") as f:
        ins = json.load(f)

    dp = os.path.join(DATA, "%s.json" % day)
    data = {}
    if os.path.exists(dp):
        with open(dp, encoding="utf-8") as f:
            data = json.load(f)
    else:
        warns.append("data/%s.json 不存在，无法核对数字。" % day)

    papers = {p["id"]: p for p in data.get("hf_papers", [])}
    repos = {r["full_name"]: r for r in data.get("gh_repos", [])}
    # 一行速览区也会用到 insights 里的 plain，所以额外条目只要在「全量榜」里就算合法
    papers_known = {p["id"] for p in data.get("hf_papers_all", [])} | set(papers)
    repos_known = {r["full_name"] for r in data.get("gh_repos_all", [])} | set(repos)

    # ---- 顶层字段
    for key in ("tldr", "theme", "concepts", "try"):
        if not ins.get(key):
            warns.append("顶层字段 %s 缺失或为空。" % key)

    for i, t in enumerate(ins.get("tldr") or []):
        check_text("tldr[%d]" % i, t, errors, warns)
        if cjk_ratio(t) < 0.3:
            errors.append("tldr[%d]：不像中文" % i)

    theme = ins.get("theme") or ""
    check_text("theme", theme, errors, warns)
    if isinstance(theme, str) and cjk_ratio(theme) < 0.3:
        errors.append("theme：不像中文")

    # ---- 论文
    p_ins = ins.get("papers") or {}
    for pid in papers:
        got = p_ins.get(pid)
        if not got:
            errors.append("papers[%s]（%s）缺少解读" % (pid, papers[pid]["title"][:40]))
            continue
        for field in REQUIRED_PAPER:
            if not got.get(field):
                errors.append("papers[%s].%s 缺失" % (pid, field))
        for field, val in got.items():
            if isinstance(val, str):
                check_text("papers[%s].%s" % (pid, field), val, errors, warns)
                if field == "plain" and looks_english(val):
                    errors.append("papers[%s].plain 是英文——「说人话」字段必须翻成中文" % pid)

    for pid in p_ins:
        if pid not in papers_known:
            warns.append("papers[%s] 既不在今日精读榜也不在全量榜里（多余条目）" % pid)

    # ---- 仓库
    r_ins = ins.get("repos") or {}
    for name in repos:
        got = r_ins.get(name)
        if not got:
            errors.append("repos[%s] 缺少解读" % name)
            continue
        for field in REQUIRED_REPO:
            if not got.get(field):
                errors.append("repos[%s].%s 缺失" % (name, field))
        for field, val in got.items():
            if isinstance(val, str):
                check_text("repos[%s].%s" % (name, field), val, errors, warns)
                if field == "plain" and looks_english(val):
                    errors.append("repos[%s].plain 是英文——「这是个啥」字段必须翻成中文" % name)

    # ---- 数字核对：why 里若出现 star 数字，必须与「今日」或「累计」之一对上
    for name, got in r_ins.items():
        if name not in repos:
            continue
        why = got.get("why") or ""
        real_today = str(repos[name].get("stars_today", "")).replace(",", "")
        real_total = str(repos[name].get("stars_total", "")).replace(",", "")
        ok = {v for v in (real_today, real_total) if v}
        if not ok:
            continue
        nums = re.findall(r"\+?([\d,]{2,})", why)
        cands = [n.replace(",", "") for n in nums]
        # 感觉像星数（>=1000）却既不是今日也不是累计 → 提示核对
        big = [c for c in cands if c.isdigit() and int(c) >= 1000]
        stray = [c for c in big if c not in ok]
        if stray:
            warns.append("repos[%s].why 里的数字 %s 既不是今日星数 %s 也不是累计 %s，请核对"
                         % (name, stray, real_today or "-", real_total or "-"))

    # ---- 重复填充句检测（同一天里多条目 why 雷同）
    whys = [(k, (v.get("why") or "").strip()) for k, v in list(p_ins.items()) + list(r_ins.items())]
    seen = {}
    for k, w in whys:
        if len(w) < 12:
            continue
        if w in seen:
            errors.append("why 重复：%s 与 %s 完全相同（说明是套模板）" % (k, seen[w]))
        else:
            seen[w] = k

    # 一并校验渲染出来的报告文件是否符合交付规格
    # （--insights-only 时跳过：渲染前那一遍不该去看一份马上要被覆盖的旧文件）
    if check_report:
        lint_report_file(day, errors, warns)

    return errors, warns, ins


# ------------------------------------------------ 报告文件格式体检（站点规格）
#
# 站点对交付文件有硬规格：frontmatter 字段/顺序、正文不许有一级标题、
# 不许裸 HTML、不许本地图片、UTF-8 无 BOM + LF。下面是逐条机器校验。
# 这些规则以前只写在文档里，靠人自觉；现在让脚本拦。

# 报告文件的真实位置：与 render.py 共用同一套解析逻辑，避免「渲染写到 A、校验查 B」。
# （位置由 render.py 的 resolve_out_dir() 单层直连决定：只认站点 content/reports/，不回退本地）
try:
    from render import REPORTS as REPORT_DIR, _OUT_WHERE as OUT_WHERE
except SystemExit:
    raise  # render 明确判定「输出目录不可用」时，别拿一个猜的目录去体检
except Exception:  # noqa: BLE001  # 单独跑 lint 时 render 出问题也不该崩掉体检
    REPORT_DIR = os.path.join(os.path.dirname(BASE), "content", "reports")
    OUT_WHERE = "site(未知)"

FM_FIELDS = ["title", "slug", "date", "category", "status", "summary"]

REQUIRED_SECTIONS = [
    "## 30 秒看完今天",
    "## 今天的主线",
    "## 一、Hugging Face Daily Papers",
    "## 二、GitHub Trending",
    "## 三、今天顺手学的 3 个概念",
    "## 四、今天可以试一下",
]

BARE_HTML = re.compile(
    r"</?(?:div|br|img|span|p|table|thead|tbody|tr|td|th|script|style|iframe|h[1-6]|ul|ol|li|a)\b[^>]*>",
    re.IGNORECASE)

MD_IMAGE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)")


def lint_report_file(day, errors, warns):
    """校验站点 content/reports/<day>.md 是否符合交付规格。"""
    path = os.path.join(REPORT_DIR, "%s.md" % day)
    if not os.path.exists(path):
        warns.append("%s 不存在——还没渲染？" % path)
        return

    # 文件名
    if not re.match(r"^\d{4}-\d{2}-\d{2}\.md$", os.path.basename(path)):
        errors.append("文件名不符合 YYYY-MM-DD.md：%s" % os.path.basename(path))

    raw = open(path, "rb").read()

    # 编码 / 换行
    if raw.startswith(b"\xef\xbb\xbf"):
        errors.append("文件带 BOM，规格要求 UTF-8 无 BOM")
    if b"\r\n" in raw:
        errors.append("文件含 CRLF，规格要求 LF 换行")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        errors.append("不是合法 UTF-8：%s" % e)
        return

    lines = text.split("\n")

    # 1) 第 1 行必须是 ---，前面不许有任何字符（包括空行）
    if lines[0].strip() != "---":
        errors.append("第 1 行必须是 ---，实际是 %r" % lines[0][:30])
        return

    # 2) 找 frontmatter 结束行
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        errors.append("frontmatter 没有结束的 --- 行")
        return

    fm_text = "\n".join(lines[1:end])
    body_lines = lines[end + 1:]

    # 3) 标准 YAML 能否解析
    fm = None
    if yaml is not None:
        try:
            fm = yaml.safe_load(fm_text)
        except Exception as e:  # noqa: BLE001
            errors.append("frontmatter 不是合法 YAML：%s" % str(e).replace("\n", " ")[:120])
            return
    else:
        # 不再降级：缺 PyYAML 说明没在 venv 里跑，这道闸门已经失效一半。
        # 判 ERROR 才能让 run-daily.sh 的退出码反映「这次没真正验过 YAML」。
        errors.append(PYYAML_MISSING_HINT)
        fm = {}
        for ln in fm_text.split("\n"):
            m = re.match(r'^([A-Za-z_]+):\s*"(.*)"$', ln)
            if m:
                fm[m.group(1)] = m.group(2)

    if not isinstance(fm, dict):
        errors.append("frontmatter 解析结果不是映射")
        return

    # 4) 字段集合与顺序
    got_fields = list(fm.keys())
    if got_fields != FM_FIELDS:
        errors.append("frontmatter 字段/顺序不合规：%s（要求 %s）" % (got_fields, FM_FIELDS))

    # 5) 三个日期一致
    title = str(fm.get("title") or "")
    slug = str(fm.get("slug") or "")
    date_v = str(fm.get("date") or "")
    if date_v != day:
        errors.append("frontmatter date=%r 与文件名 %s 不一致" % (date_v, day))
    if slug != "report-%s" % day:
        errors.append("slug=%r，要求 report-%s" % (slug, day))
    if day not in title:
        errors.append("title 里没有出现 %s" % day)
    if day.replace("-", "/") in title:
        errors.append("title 里的日期用了斜杠格式，应为 %s" % day)

    # 6) 固定字段
    if str(fm.get("category") or "") != "日报":
        errors.append("category 必须写 日报，实际 %r" % fm.get("category"))
    if str(fm.get("status") or "") != "published":
        errors.append("status 必须写 published（draft 会被站点静默过滤），实际 %r" % fm.get("status"))

    # 7) summary：单行、40–80 字
    summary = fm.get("summary")
    if not isinstance(summary, str) or not summary:
        errors.append("summary 缺失")
    else:
        if "\n" in summary:
            errors.append("summary 不是单行")
        if not (40 <= len(summary) <= 80):
            errors.append("summary 长度 %d 字，要求 40–80 字" % len(summary))

    # 7b) 原始文本层面：summary 必须真的写在一行里
    #     YAML 允许双引号内折行（解析出来仍是单行），续行甚至可以顶格写，
    #     所以只看解析结果、或只看缩进都会漏。判据是「这一行有没有以引号收尾」。
    fm_lines = fm_text.split("\n")
    for i, ln in enumerate(fm_lines):
        if re.match(r"^summary\s*:", ln):
            if not re.match(r'^summary\s*:\s*".*"\s*$', ln):
                errors.append("summary 在原始文件里折成了多行（规格要求单行）：%r" % ln[:40])
            break
    else:
        errors.append("frontmatter 里找不到 summary 字段")

    # 7c) 禁止块标量语法（| 或 >）
    for ln in fm_lines:
        if re.match(r"^[A-Za-z_]+\s*:\s*[|>]", ln):
            errors.append("frontmatter 用了多行字符串语法（| 或 >），规格禁止：%r" % ln[:30])

    # 8) frontmatter 结束后必须空一行
    if body_lines and body_lines[0].strip() != "":
        errors.append("frontmatter 的 --- 之后没有空行")

    body = "\n".join(body_lines)

    # 9) 正文不许有一级标题
    for i, ln in enumerate(body_lines, 1):
        if re.match(r"^#\s", ln):
            errors.append("正文第 %d 行出现一级标题：%r（标题信息只保留在 frontmatter）" % (i, ln[:40]))

    # 10) 必备分节
    for sec in REQUIRED_SECTIONS:
        if sec not in body:
            errors.append("缺少必备分节：%s" % sec)

    # 11) 裸 HTML
    hit = BARE_HTML.search(body)
    if hit:
        errors.append("正文出现裸 HTML 标签：%r（会被站点丢弃）" % hit.group(0)[:40])

    # 12) 本地图片引用
    for m in MD_IMAGE.finditer(body):
        target = m.group(1)
        if not re.match(r"^(https?://|mailto:)", target):
            errors.append("出现了本地图片引用 %r，规格禁止（要给读者看图请给原文链接）" % target[:60])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    ap.add_argument("--all", action="store_true", help="体检 insights/ 下所有文件")
    ap.add_argument("--insights-only", action="store_true",
                    help="只体检解读稿，不校验站点 content/reports/ 里的文件（渲染前那一遍用）")
    args = ap.parse_args()

    days = sorted(os.path.splitext(os.path.basename(p))[0]
                  for p in glob.glob(os.path.join(INSIGHTS, "*.json"))) if args.all else [args.date]

    total_e = total_w = 0
    for day in days:
        errors, warns, _ = lint_one(day, check_report=not args.insights_only)
        print("=== %s ===" % day)
        if not errors and not warns:
            print("  ✅ 通过")
        for e in errors:
            print("  ❌ ERROR %s" % e)
        for w in warns:
            print("  ⚠️  WARN  %s" % w)
        total_e += len(errors)
        total_w += len(warns)
        print()

    print("合计：%d 个 ERROR，%d 个 WARN" % (total_e, total_w))
    if total_e:
        return 1
    return 2 if total_w else 0


if __name__ == "__main__":
    raise SystemExit(main())