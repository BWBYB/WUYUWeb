#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 data/YYYY-MM-DD.json 渲染成小白友好的 Markdown 日报。

用法：
  python3 render.py                     # 渲染今天
  python3 render.py --date 2026-11-02

产出：站点仓库的 content/reports/YYYY-MM-DD.md（不回退到本地）
"""

import argparse
import json
import os
import re
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")

# 输出位置：直接写进站点仓库（站点用 vite 插件扫这个目录，见其 content/reports/README.md）。
# 定位不写死绝对路径：本工具目录（reports-tool/）的上一级就是站点根。
# 可用环境变量 REPORT_OUT_DIR 覆盖（仅调试用）。
#
# 单层直连：目录不存在或不可写就**报错退出**，绝不回退到本地 reports/。
# 历史教训：早先的三层回退会静默把产物写进本地，表面上「跑通了」，
# 实际站点里根本没有新日报，且定时任务不会提权，问题要到线上才暴露。
SITE_REPORTS = os.path.join(os.path.dirname(BASE), "content", "reports")


def resolve_out_dir():
    override = os.environ.get("REPORT_OUT_DIR")
    target = override or SITE_REPORTS
    where = "env" if override else "site"
    if not os.path.isdir(target):
        raise SystemExit(
            "[render] 输出目录不存在：%s\n"
            "日报必须写进站点的 content/reports/，本工具不会回退到本地。\n"
            "请检查站点仓库路径与 reports-tool 的层级关系。" % target
        )
    try:
        probe = os.path.join(target, ".write_probe")
        with open(probe, "w") as f:
            f.write("x")
        os.remove(probe)
    except OSError as exc:
        raise SystemExit(
            "[render] 输出目录不可写：%s（%s）\n"
            "日报必须写进站点的 content/reports/，本工具不会回退到本地。\n"
            "请放开工作区写权限后重跑；定时任务不会自动提权。" % (target, exc)
        )
    return target, where


REPORTS, _OUT_WHERE = resolve_out_dir()

# 手工撰写的「小白解读」放在 insights/YYYY-MM-DD.json，缺失时自动降级为英文摘要摘录
INSIGHTS = os.path.join(BASE, "insights")

WEEK_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

_CJK = re.compile(r"[\u4e00-\u9fff]")
_LATIN_WORD = re.compile(r"[A-Za-z]{3,}")


def is_translated(s):
    """判断一段解读是否真的翻成了中文。

    历史事故：insights 里把英文 ai_summary 直接填进 plain 字段，报告却标着
    「说人话」，读起来是英文。这里做防御——没翻就老实标成「原文摘要」。
    """
    if not s:
        return False
    body = re.sub(r"\s+", "", s)
    if not body:
        return False
    cjk = len(_CJK.findall(body)) / len(body)
    if cjk >= 0.15:
        return True
    # 中文字很少但英文单词很多 → 判定为未翻译
    return len(_LATIN_WORD.findall(s)) < 8


def load_insights(day):
    p = os.path.join(INSIGHTS, "%s.json" % day)
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return {}


def fmt_k(n):
    try:
        n = int(str(n).replace(",", ""))
    except (TypeError, ValueError):
        return str(n)
    if n >= 10000:
        return "%.1f万" % (n / 10000)
    if n >= 1000:
        return "{:,}".format(n)
    return str(n)


def yaml_dq(s):
    """把一段文本变成 YAML 双引号字符串里绝对安全的内容。

    规则（站点规格）：
      - 必须单行 → 折叠所有空白
      - 双引号内不许出现裸的 ASCII " → 成对换成中文引号「」，落单的用 」
      - 反斜杠在双引号 YAML 里是转义符 → 先转义成 \\
    """
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    s = s.replace("\\", "\\\\")
    out, open_q = [], True
    for ch in s:
        if ch == '"':
            out.append("「" if open_q else "」")
            open_q = not open_q
        else:
            out.append(ch)
    if not open_q:            # 引号落单，补一个右引号
        out.append("」")
    return "".join(out)


def cost_line(cost):
    """把 cost 字段渲染成报告末尾的一行开销说明。

    数据由 usage.py 写入 data/<day>.json：
      {"seconds": 690.5, "input_tokens": 4332648, "output_tokens": 12628, "calls": 25, "turn": 11}
    缺字段就少显示对应的那一段，不编造数字。
    """
    parts = []
    secs = cost.get("seconds")
    if secs is not None:
        mins = secs / 60.0
        if mins >= 1:
            parts.append("耗时 %.1f 分钟" % mins)
        else:
            parts.append("耗时 %.0f 秒" % secs)
    cin = cost.get("input_tokens")
    cout = cost.get("output_tokens")
    if cin is not None or cout is not None:
        bits = []
        if cin is not None:
            bits.append("输入 %s" % format(int(cin), ","))
        if cout is not None:
            bits.append("输出 %s" % format(int(cout), ","))
        tok = "token " + " / ".join(bits)
        if cin is not None and cout is not None:
            tok += "，合计 %s" % format(int(cin) + int(cout), ",")
        parts.append(tok)
    if cost.get("calls") is not None:
        parts.append("%s 次模型调用" % format(int(cost["calls"]), ","))
    if not parts:
        return ""
    return "_本次生成开销：%s。_" % " ｜ ".join(parts)


def frontmatter(day, dt, summary):
    """按规格生成 frontmatter：字段顺序固定，不加未列出的字段。"""
    title = "AI 与计算机日报 · %s（%s）" % (day, WEEK_CN[dt.weekday()])
    fields = [
        ("title", title),
        ("slug", "report-%s" % day),
        ("date", day),
        ("category", "日报"),
        ("status", "published"),
        ("summary", summary),
    ]
    out = ["---"]
    for k, v in fields:
        out.append('%s: "%s"' % (k, yaml_dq(v)))
    out.append("---")
    return out


def render(day):
    with open(os.path.join(DATA, "%s.json" % day), encoding="utf-8") as f:
        d = json.load(f)
    ins = load_insights(day)

    dt = datetime.strptime(day, "%Y-%m-%d")
    lines = []
    A = lines.append

    paper_ins = ins.get("papers", {})
    repo_ins = ins.get("repos", {})

    # ---------------------------------------------------------------- header
    # frontmatter 必须是文件最开头，前面连空行都不能有；正文不再出现 # 一级标题
    # （站点会把 title 渲染成页面大标题，正文重复会变成两个标题）
    summary = ins.get("summary") or ""
    lines.extend(frontmatter(day, dt, summary))
    A("")
    A("> 面向刚入门的读者：每一条都给你 **一句话结论 + 为什么值得看 + 原文链接**。")
    A("> 数据来自 Hugging Face Daily Papers（按社区点赞排序）与 GitHub Trending（按今日新增 star 排序）。")
    A("")

    # ------------------------------------------------------------------ TLDR
    if ins.get("tldr"):
        A("## 30 秒看完今天")
        A("")
        for i, t in enumerate(ins["tldr"], 1):
            A("%d. %s" % (i, t))
        A("")

    if ins.get("theme"):
        A("## 今天的主线")
        A("")
        for para in ins["theme"] if isinstance(ins["theme"], list) else [ins["theme"]]:
            A(para)
            A("")

    # ---------------------------------------------------------------- papers
    A("## 一、Hugging Face Daily Papers")
    A("")
    if not d.get("hf_papers"):
        A("_今天没抓到论文数据（%s）。_" % d.get("hf_error", "unknown"))
        A("")
    for i, p in enumerate(d.get("hf_papers", []), 1):
        got = paper_ins.get(p["id"], {})
        A("### %d. %s" % (i, p["title"]))
        A("")
        meta = []
        if p.get("org"):
            meta.append(p["org"])
        meta.append("▲ %d 赞" % p["upvotes"])
        if p.get("submitted_on"):
            meta.append("提交日 %s" % p["submitted_on"])
        A("`%s`" % p["id"] + " · " + " · ".join(meta))
        A("")
        plain = got.get("plain")
        if plain and is_translated(plain):
            A("**说人话：** %s" % plain)
            A("")
        elif plain:
            # 防御：解释没翻成中文时，不许挂着「说人话」的招牌
            A("**原文摘要（本条解读稿未翻成中文）：** %s" % plain)
            A("")
        if got.get("why"):
            A("**为什么值得看：** %s" % got["why"])
            A("")
        if got.get("analogy"):
            A("**打个比方：** %s" % got["analogy"])
            A("")
        if got.get("readme"):
            A("**给小白的一句话提醒：** %s" % got["readme"])
            A("")
        if not plain:
            A("**论文自述摘要：** %s" % (p.get("ai_summary") or p["summary"][:300]))
            A("")
        links = ["[HF 论文页](https://hf-mirror.com/papers/%s)" % p["id"],
                 "[arXiv 原文](%s)" % p["arxiv"]]
        if p.get("github"):
            links.append("[代码](%s)" % p["github"])
        if p.get("project_page"):
            links.append("[项目主页](%s)" % p["project_page"])
        A("🔗 " + " · ".join(links))
        A("")

    # 快速带过的论文：有手写解读就用手写的，否则退回 AI 摘要
    rest = d.get("hf_papers_all", [])[len(d.get("hf_papers", [])):]
    if rest:
        A("### 其余今日论文（一行速览）")
        A("")
        for p in rest[:10]:
            got = paper_ins.get(p["id"], {})
            raw = got.get("plain")
            if raw and is_translated(raw):
                brief = raw.split("。")[0]
                mark = ""
            else:
                brief = (p.get("ai_summary") or p["summary"] or "")[:90]
                mark = "[EN] "  # 老实标明这条没翻
            A("- **%s** — %s%s [↗](https://hf-mirror.com/papers/%s)"
              % (p["title"], mark, brief.rstrip("。"), p["id"]))
        A("")

    # ----------------------------------------------------------------- repos
    A("## 二、GitHub Trending")
    A("")
    if not d.get("gh_repos"):
        A("_今天没抓到 GitHub Trending 数据（%s）。_" % d.get("gh_error", "unknown"))
        A("")
    def _stars(r):
        try:
            return int(str(r.get("stars_today", 0)).replace(",", ""))
        except (TypeError, ValueError):
            return 0

    # 按「今日新增 star」排序，比 GitHub 页面顺序更符合「今天大家在用什么」的直觉
    top_repos = sorted(d.get("gh_repos", []), key=_stars, reverse=True)
    for i, r in enumerate(top_repos, 1):
        got = repo_ins.get(r["full_name"], {})
        A("### %d. %s" % (i, r["full_name"]))
        A("")
        meta = []
        if r.get("language"):
            meta.append(r["language"])
        meta.append("今日 +%s star" % fmt_k(r["stars_today"]))
        if r.get("stars_total"):
            meta.append("共 %s" % fmt_k(r["stars_total"]))
        A(" · ".join(meta))
        A("")
        plain = got.get("plain")
        desc = r.get("description") or ""
        if plain and is_translated(plain):
            A("**这是个啥：** %s" % plain)
            A("")
        elif plain or desc:
            # 防御：没翻成中文时，老实标明是项目原文自述
            body = plain or desc
            label = "项目原文自述（本条未翻成中文）"
            A("**%s：** %s" % (label, body))
            A("")
        if got.get("why"):
            A("**为什么今天火：** %s" % got["why"])
            A("")
        if got.get("for_who"):
            A("**适合谁：** %s" % got["for_who"])
            A("")
        A("🔗 [%s](%s)" % (r["full_name"], r["url"]))
        A("")

    rest_repo = [r for r in d.get("gh_repos_all", [])
                 if r["full_name"] not in {x["full_name"] for x in top_repos}]
    if rest_repo:
        A("### 其余 Trending 项目（一行速览）")
        A("")
        for r in rest_repo:
            raw = repo_ins.get(r["full_name"], {}).get("plain")
            if raw and is_translated(raw):
                brief, mark = raw[:100], ""
            else:
                brief = (r.get("description") or "")[:100]
                mark = "[EN] "  # 老实标明这条没翻
            A("- **%s**（%s，+%s）— %s%s [↗](%s)" %
              (r["full_name"], r.get("language") or "未知语言", fmt_k(r["stars_today"]),
               mark, brief, r["url"]))
        A("")

    # ---------------------------------------------------------------- footer
    if ins.get("concepts"):
        A("## 三、今天顺手学的 3 个概念")
        A("")
        for c in ins["concepts"]:
            A("**%s**：%s" % (c["term"], c["means"]))
            A("")
    if ins.get("try"):
        A("## 四、今天可以试一下")
        A("")
        for t in ins["try"]:
            A("- %s" % t)
        A("")

    # 末尾数据来源说明。这里刻意不再放一行裸的 ---（水平线），
    # 免得某些朴素的前置元数据切分实现把它误当成 frontmatter 的结束标记。
    A("_生成于 %s ｜ 论文数据走 hf-mirror.com 镜像（本机 huggingface.co 直连不通）｜ 存放于 `content/reports/`_"
      % d.get("fetched_at", ""))
    A("")

    # 本次生成的开销（耗时 + token）。数据来自 data/<day>.json 的 cost 字段，
    # 由 usage.py 写入——token 用量只有跑任务的 agent 自己拿得到，脚本侧抓不到。
    cost = d.get("cost") or {}
    if isinstance(cost, dict) and cost.get("seconds") is not None:
        A(cost_line(cost))
        A("")

    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    args = ap.parse_args()
    os.makedirs(REPORTS, exist_ok=True)
    md = render(args.date)
    out = os.path.join(REPORTS, "%s.md" % args.date)
    # 规格：UTF-8、LF、无 BOM。newline="\n" 强制 LF（不随平台变化），
    # encoding 不带 -sig 就等于不写 BOM。
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(md)
    print("wrote", out, len(md), "chars")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
