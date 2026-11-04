#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一条命令验完报告的全部交付规格，替代 agent 分头检查。

**为什么需要它**：以前 agent 要分好几次查 BOM、CRLF、一级标题、字段顺序、
[EN] 残留、必备分节，每次都是一次模型调用、一次上下文重付。

这个脚本把全部检查合并成一次调用：全通过就一行 OK，不通过就一次性列出所有问题
（而不是让你修一个、再跑一次、再发现下一个）。

用法：
  python3 verify.py --date 2026-11-04          # 验某一天
  python3 verify.py --all                       # 验所有天
  python3 verify.py --date 2026-11-04 --quiet   # 只输出最终一行

退出码：0 = 全部通过；1 = 有 ERROR
"""

import argparse
import glob
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
INSIGHTS = os.path.join(BASE, "insights")

try:
    from render import REPORTS as REPORT_DIR
except SystemExit:
    raise
except Exception:  # noqa: BLE001
    REPORT_DIR = os.path.join(os.path.dirname(BASE), "content", "reports")

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
    r"</?(?:div|br|img|span|p|table|thead|tbody|tr|td|th|script|style|iframe|"
    r"h[1-6]|ul|ol|li|a)\b[^>]*>", re.IGNORECASE)
MD_IMAGE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)")


def check_insights(day, errors):
    """解读稿：字段齐不齐、该给的 plain 给没给。"""
    ip = os.path.join(INSIGHTS, "%s.json" % day)
    dp = os.path.join(DATA, "%s.json" % day)

    if not os.path.exists(ip):
        errors.append("insights/%s.json 不存在——还没写解读稿" % day)
        return
    if not os.path.exists(dp):
        errors.append("data/%s.json 不存在——还没抓数据" % day)
        return

    with open(ip, encoding="utf-8") as f:
        ins = json.load(f)
    with open(dp, encoding="utf-8") as f:
        snap = json.load(f)

    deep_p = snap.get("hf_papers", [])
    all_p = snap.get("hf_papers_all", []) or deep_p
    deep_r = snap.get("gh_repos", [])
    all_r = snap.get("gh_repos_all", []) or deep_r
    brief_p = all_p[len(deep_p):][:10]
    brief_r = all_r[len(deep_r):][:10]

    # 与 render.py 的实际渲染范围对齐：精读榜全字段，速览区只要 plain
    p_ins = ins.get("papers") or {}
    r_ins = ins.get("repos") or {}

    for p in deep_p:
        got = p_ins.get(p["id"])
        if not got:
            errors.append("papers[%s] 缺少解读（精读榜）" % p["id"])
            continue
        for f in ("plain", "why", "analogy", "readme"):
            if not (got.get(f) or "").strip():
                errors.append("papers[%s].%s 为空" % (p["id"], f))

    for p in brief_p:
        got = p_ins.get(p["id"])
        if not got or not (got.get("plain") or "").strip():
            errors.append("papers[%s].plain 缺失（速览区，漏了会留 [EN]）" % p["id"])

    for r in deep_r:
        got = r_ins.get(r["full_name"])
        if not got:
            errors.append("repos[%s] 缺少解读（精读榜）" % r["full_name"])
            continue
        for f in ("plain", "why", "for_who"):
            if not (got.get(f) or "").strip():
                errors.append("repos[%s].%s 为空" % (r["full_name"], f))

    for r in brief_r:
        got = r_ins.get(r["full_name"])
        if not got or not (got.get("plain") or "").strip():
            errors.append("repos[%s].plain 缺失（速览区，漏了会留 [EN]）" % r["full_name"])

    # 顶层字段
    s = ins.get("summary") or ""
    if not (40 <= len(s) <= 80):
        errors.append("summary 长度 %d，要求 40–80 字" % len(s))
    if "\n" in s:
        errors.append("summary 不是单行")
    if not ins.get("tldr"):
        errors.append("tldr 缺失")
    if not ins.get("theme"):
        errors.append("theme 缺失")
    if len(ins.get("concepts") or []) < 3:
        errors.append("concepts 少于 3 条")
    if len(ins.get("try") or []) < 2:
        errors.append("try 少于 2 条")


def check_report(day, errors):
    """报告文件：编码、frontmatter、正文规格。"""
    path = os.path.join(REPORT_DIR, "%s.md" % day)
    if not os.path.exists(path):
        errors.append("报告不存在：%s（还没渲染？）" % path)
        return

    raw = open(path, "rb").read()

    if raw.startswith(b"\xef\xbb\xbf"):
        errors.append("文件带 BOM，规格要求 UTF-8 无 BOM")
    if b"\r\n" in raw:
        errors.append("文件含 CRLF，规格要求 LF")

    text = raw.decode("utf-8")

    if not text.startswith("---\n"):
        errors.append("首行不是 ---")
    parts = text.split("---\n")
    if len(parts) < 3:
        errors.append("frontmatter 没有闭合")
        return
    fm_text = parts[1]

    # 字段顺序（标准 YAML 若有就用）
    fm = None
    try:
        import yaml
        fm = yaml.safe_load(fm_text)
    except ImportError:
        errors.append("环境无 PyYAML——YAML 合法性无法真正校验")
    except Exception as e:  # noqa: BLE001
        errors.append("frontmatter 不是合法 YAML：%s" % str(e)[:100])

    if isinstance(fm, dict):
        if list(fm.keys()) != FM_FIELDS:
            errors.append("字段/顺序不合规：%s（要求 %s）"
                          % (list(fm.keys()), FM_FIELDS))
        if str(fm.get("slug") or "") != "report-%s" % day:
            errors.append("slug 应为 report-%s，实际 %r" % (day, fm.get("slug")))
        if str(fm.get("date") or "") != day:
            errors.append("date 与文件名不一致：%r" % (fm.get("date"),))
        if str(fm.get("status") or "") != "published":
            errors.append("status 必须是 published，实际 %r" % (fm.get("status"),))
        if str(fm.get("category") or "") != "日报":
            errors.append("category 必须是 日报，实际 %r" % (fm.get("category"),))

    # 原始行层面：summary 必须真的写在一行
    for ln in fm_text.split("\n"):
        if ln.startswith("summary"):
            if not re.match(r'^summary\s*:\s*".*"\s*$', ln):
                errors.append("summary 在原始文件里折成多行：%r" % ln[:50])
            break

    body = parts[2]

    if any(l.startswith("# ") for l in body.splitlines()):
        errors.append("正文出现 # 一级标题")

    for sec in REQUIRED_SECTIONS:
        if sec not in body:
            errors.append("缺少必备分节：%s" % sec)

    m = BARE_HTML.search(body)
    if m:
        errors.append("正文有裸 HTML：%s" % m.group(0)[:40])

    for url in MD_IMAGE.findall(body):
        if not url.startswith("/") and not url.startswith("http"):
            errors.append("图片用了相对路径（会 404）：%s" % url)

    n_en = body.count("[EN]")
    if n_en:
        errors.append("正文残留 %d 处 [EN]——这些条目没翻成中文" % n_en)


def verify_one(day):
    errors = []
    check_insights(day, errors)
    check_report(day, errors)
    return errors


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=None)
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--quiet", action="store_true", help="只输出最终一行")
    args = ap.parse_args()

    if args.all:
        days = sorted(os.path.splitext(os.path.basename(p))[0]
                      for p in glob.glob(os.path.join(INSIGHTS, "*.json")))
    elif args.date:
        days = [args.date]
    else:
        raise SystemExit("[verify] 需要 --date 或 --all")

    if not days:
        raise SystemExit("[verify] 没找到任何日期")

    total = 0
    for day in days:
        errors = verify_one(day)
        total += len(errors)
        if args.quiet:
            continue
        print("\n=== %s ===" % day)
        if not errors:
            print("  ✅ 全部通过")
        else:
            for e in errors:
                print("  ❌ %s" % e)

    if total == 0:
        print("✅ %d 天全部通过（编码/frontmatter/分节/HTML/图片/[EN] 共 20 项检查）"
              % len(days))
        return 0
    print("❌ 合计 %d 个问题" % total)
    return 1


if __name__ == "__main__":
    sys.exit(main())
