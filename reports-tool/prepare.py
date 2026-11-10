#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性把写日报需要的全部信息端出来，替代 agent 反复探索。

**为什么需要它**：实测过一次日报任务用了 25 次模型调用，其中只有 6 次是必要动作
（抓取 / 读快照 / 写 insights / 渲染 / 自检 / 呈现），另外 19 次全是 agent 在
分头查「lint 要哪些字段」「render 要哪些字段」「[EN] 漏在哪」「格式对不对」。

关键认知：**每多一次调用，就要重付一次完整上下文**。25 次调用重付了 25 遍，
这才是 token 大头。把这 19 次探索压成 1 次，总量能降一半以上。

用法：
  # 给出当天全部信息（论文 + 仓库 + 待写清单 + 写作要求）
  python3 prepare.py --date 2026-11-04

  # 额外生成 insights 骨架，把 ID 空位都摆好（agent 只填中文内容）
  python3 prepare.py --date 2026-11-04 --template > insights/2026-11-04.json

--template 的价值：骨架里预置了每一个需要 plain 的 ID（含速览区），
agent 漏写就会立刻在 lint 里暴露，从根上消灭「渲染后才发现 14 个 [EN]」。
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
INSIGHTS = os.path.join(BASE, "insights")

# lint.py 硬性要求：精读榜的每条论文必须有这些字段
PAPER_FULL = ("plain", "why", "analogy", "readme")
REPO_FULL = ("plain", "why", "for_who")

WRITING_RULES = """\
写作要求（照做，lint.py 会逐条检查）：
- summary：40–80 字、**单行**，写当天最值得记住的结论，不照抄导语
- tldr：3–4 条，每条一个判断，别写成「今天有 N 篇论文」这种没信息量的话
- theme：2–4 段，把当天热榜归纳成几条趋势，要说出「为什么是今天」
- papers：精读榜每条给 plain/why/analogy/readme（后三项精读榜才需要）
- repos：精读榜每条给 plain/why/for_who
- **速览区条目也必须给 plain**，否则报告里会留 [EN] 英文标记
- concepts：3 个当天出现的术语，用大白话解释（term + means 两个字段）
- try：2–3 条可动手的建议
- 读者是 AI/计算机小白，用中文口语，多用比方，别堆术语
- 禁止：英文冒充中文、写「前 N 名」占位符、写「代表该领域正在关注的方向」这类填充句
- **连续在榜的仓库（streak_days ≥ 3）**：`why` 要写「今天的新变化」——今日新增多少 star、
  有无新版本/新 issue/新动态。参考 `prev_why` 但**不要复述它**。
  若确实没变化，就如实写「连续第 N 天在榜，今日新增 X star，热度未减」。
  **注意：这不是「可以少写」的许可**。读者看的是当天独立一份日报，
  「一直在榜、没啥好说」会让人直接失去兴趣；也不许为了显得有新意而编造。
"""


def load_snapshot(day):
    path = os.path.join(DATA, "%s.json" % day)
    if not os.path.exists(path):
        raise SystemExit(
            "[prepare] 快照不存在：%s\n先跑 ./run-daily.sh <日期> 抓取数据。" % path
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def paper_row(p, deep):
    """把一篇论文压成 agent 需要的最小字段集。"""
    row = {
        "id": p.get("id"),
        "title": p.get("title"),
        "upvotes": p.get("upvotes"),
        "org": p.get("org") or "",
        "first_author": p.get("first_author") or "",
        "submitted_on": p.get("submitted_on"),
        "arxiv": p.get("arxiv") or "",
    }
    # 精读榜要写类比和提醒，摘要要给全；速览区只要一句话，给 300 字够了
    body = p.get("summary") or ""
    row["summary"] = body if deep else body[:300]
    if not deep:
        row["ai_summary"] = p.get("ai_summary") or ""
    return row


def streak_info(day, name):
    """算这个仓库到 day 为止「连续在榜多少天」，并取回昨天写的 why。

    为什么需要它：实测 2026-11-05 ∩ 11-06 有 6/10 个仓库重叠，
    且 Scrapling / mattpocock/skills / agent-desktop 连续 5 天在榜。
    同一个仓库连着上榜时，「为什么今天火」的真正理由往往没变，
    照原样重写会产出措辞不同但信息同质的内容 —— 既费 token 又对读者无增益。

    但要小心：**不能因此少写**。读者看的是当天独立一份日报，
    「一直在榜，今天没啥变化」会让人直接失去兴趣。正确做法是给增量信息
    （今日新增多少、有无新版本/新 issue），而不是偷懒或编造。

    返回 (streak_days, prev_why)。streak_days 从 1 开始；prev_why 可能为空。
    """
    streak, prev_why, cur = 0, None, day
    # 最多往回看 30 天，够用且不会在数据异常时死循环
    for _ in range(31):
        path = os.path.join(DATA, "%s.json" % cur)
        if not os.path.exists(path):
            break
        with open(path, encoding="utf-8") as f:
            snap = json.load(f)
        names = {r.get("full_name") for r in (snap.get("gh_repos") or [])}
        if name not in names:
            break
        streak += 1
        if prev_why is None and cur != day:
            ip = os.path.join(INSIGHTS, "%s.json" % cur)
            if os.path.exists(ip):
                try:
                    with open(ip, encoding="utf-8") as f:
                        prev_why = ((json.load(f).get("repos") or {}).get(name) or {}).get("why")
                except (OSError, ValueError):
                    prev_why = None
        # 日期减一天
        cur = (datetime.strptime(cur, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
    return streak, (prev_why or "")[:120]


def repo_row(r, deep):
    row = {
        "full_name": r.get("full_name"),
        "language": r.get("language") or "",
        "stars_today": r.get("stars_today"),
        "stars_total": r.get("stars_total"),
        "url": r.get("url") or "",
    }
    row["description"] = (r.get("description") or "").strip()
    if not deep:
        row["description"] = row["description"][:220]
    return row


def repo_row_with_streak(r, day):
    """精读仓库行：加上连续在榜天数与昨日解读，供 agent 判断该写增量还是重写。"""
    row = repo_row(r, True)
    s, prev = streak_info(day, r.get("full_name"))
    row["streak_days"] = s
    if s >= 2:
        if prev:
            row["prev_why"] = prev
        row["提示"] = ("连续 %d 天在榜，请写「今天的新变化」而不是复述昨天；"
                       "确实无变化就如实说「连续第 %d 天，今日新增 %s star，热度未减」"
                       % (s, s, r.get("stars_today")))
    return row


def build_brief(day, snap):
    deep_papers = snap.get("hf_papers", [])
    all_papers = snap.get("hf_papers_all", []) or deep_papers
    deep_repos = snap.get("gh_repos", [])
    all_repos = snap.get("gh_repos_all", []) or deep_repos

    # 速览区实际只会渲染前 10 条（见 render.py），这里对齐这个上限
    brief_papers = all_papers[len(deep_papers):][:10]
    brief_repos = all_repos[len(deep_repos):][:10]

    return {
        "日期": day,
        "抓取时间": snap.get("fetched_at"),
        "数据源": snap.get("sources"),
        "精读论文": [paper_row(p, True) for p in deep_papers],
        "速览论文": [paper_row(p, False) for p in brief_papers],
        "精读仓库": [repo_row_with_streak(r, day) for r in deep_repos],
        "速览仓库": [repo_row(r, False) for r in brief_repos],
        "必须给出的 plain": {
            "论文": [p.get("id") for p in deep_papers + brief_papers],
            "仓库": [r.get("full_name") for r in deep_repos + brief_repos],
            "说明": "上面每一个 ID 都要在 insights 里出现 plain，否则报告会留 [EN]",
        },
        "insights 结构": {
            "summary": "字符串，40–80 字，单行",
            "tldr": ["字符串 ×3"],
            "theme": ["段落 ×2–4"],
            "papers": {"<论文id>": {"plain": "说人话", "why": "为什么值得看",
                                    "analogy": "打个比方", "readme": "小白提醒"}},
            "repos": {"<仓库全名>": {"plain": "这是个啥", "why": "为什么今天火",
                                     "for_who": "适合谁"}},
            "concepts": [{"term": "术语", "means": "大白话解释"}],
            "try": ["可动手的建议 ×2–3"],
        },
        "写作要求": WRITING_RULES.strip().splitlines(),
    }


def build_template(day, snap):
    """生成 insights 骨架：ID 空位全部摆好，agent 只填空。"""
    deep_papers = snap.get("hf_papers", [])
    all_papers = snap.get("hf_papers_all", []) or deep_papers
    deep_repos = snap.get("gh_repos", [])
    all_repos = snap.get("gh_repos_all", []) or deep_repos
    brief_papers = all_papers[len(deep_papers):][:10]
    brief_repos = all_repos[len(deep_repos):][:10]

    papers = {}
    for p in deep_papers:
        papers[p["id"]] = {"plain": "", "why": "", "analogy": "", "readme": ""}
    for p in brief_papers:
        papers[p["id"]] = {"plain": ""}

    repos = {}
    for r in deep_repos:
        repos[r["full_name"]] = {"plain": "", "why": "", "for_who": ""}
    for r in brief_repos:
        repos[r["full_name"]] = {"plain": ""}

    # 用「皇上」式的占位符故意留空，让 lint 报错而不是静默通过
    return {
        "summary": "",
        "tldr": ["", "", ""],
        "theme": ["", ""],
        "papers": papers,
        "repos": repos,
        "concepts": [{"term": "", "means": ""} for _ in range(3)],
        "try": ["", ""],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--template", action="store_true",
                    help="输出 insights 骨架（ID 空位已摆好），而非信息简报")
    ap.add_argument("--json", action="store_true",
                    help="以紧凑 JSON 输出（默认是给人/agent 读的可读格式）")
    args = ap.parse_args()

    snap = load_snapshot(args.date)

    if args.template:
        out = build_template(args.date, snap)
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0

    brief = build_brief(args.date, snap)

    if args.json:
        print(json.dumps(brief, ensure_ascii=False, indent=2))
        return 0

    # ---- 可读输出：目标是让 agent 一次读完就够，不用再去翻别的文件 ----
    W = 96
    print("=" * W)
    print("日报写作简报 ｜ 日期 %s ｜ 抓取于 %s" % (brief["日期"], brief["抓取时间"]))
    print("=" * W)

    src = brief["数据源"] or {}
    hf = (src.get("hf") or {})
    gh = (src.get("gh") or {})
    print("\n[数据源] HF: %s ｜ GitHub: %s" % (
        hf.get("endpoint", "-"), gh.get("engine", "-")))
    if hf.get("note"):
        print("         注意：%s" % hf["note"])

    print("\n" + "=" * W)
    print("一、精读论文（%d 篇，需 plain/why/analogy/readme）" % len(brief["精读论文"]))
    print("=" * W)
    for i, p in enumerate(brief["精读论文"], 1):
        print("\n%d. [%s] ▲%s 赞 ｜ %s ｜ %s" % (
            i, p["id"], p["upvotes"], p["org"] or "-", p["first_author"] or "-"))
        print("   标题: %s" % p["title"])
        # 摘要截断到 520 字：够写 plain/why/analogy，又不至于把一次调用的
        # 输出撑到需要分两段读（2026-11-08 就是被 head -120 + sed 切成两次重跑）。
        body = p["summary"]
        print("   摘要: %s%s" % (body[:520], "…（全文见 data 快照）" if len(body) > 520 else ""))

    print("\n" + "=" * W)
    print("二、速览论文（%d 篇，只需 plain）" % len(brief["速览论文"]))
    print("=" * W)
    for p in brief["速览论文"]:
        print("\n  [%s] ▲%s ｜ %s" % (p["id"], p["upvotes"], p["title"]))
        print("   摘要: %s%s" % (p["summary"][:260],
                                 "..." if len(p["summary"]) > 260 else ""))

    print("\n" + "=" * W)
    print("三、精读仓库（%d 个，需 plain/why/for_who）" % len(brief["精读仓库"]))
    print("=" * W)
    for i, r in enumerate(brief["精读仓库"], 1):
        streak = r.get("streak_days") or 1
        tag = "" if streak <= 1 else "  ★连续 %d 天" % streak
        print("\n%d. %s ｜ %s ｜ +%s 今日 / %s 累计%s" % (
            i, r["full_name"], r["language"], r["stars_today"], r["stars_total"], tag))
        print("   描述: %s" % (r["description"] or "（空）"))
        if r.get("prev_why"):
            print("   昨日 why（不要复述，写今天的新变化）: %s…" % r["prev_why"][:88])
        if r.get("提示"):
            print("   ⚠️  %s" % r["提示"])

    print("\n" + "=" * W)
    print("四、速览仓库（%d 个，只需 plain）" % len(brief["速览仓库"]))
    print("=" * W)
    for r in brief["速览仓库"]:
        print("  %-40s +%s ｜ %s" % (r["full_name"], r["stars_today"],
                                     (r["description"] or "（空）")[:70]))

    print("\n" + "=" * W)
    print("五、必须给出的 plain（漏一个就留一个 [EN]）")
    print("=" * W)
    print("  论文 ID（%d 个）：" % len(brief["必须给出的 plain"]["论文"]))
    print("    %s" % " ".join(brief["必须给出的 plain"]["论文"]))
    # 仓库名在第三、四节已逐个列出，这里压成一行，省 15 行冗余
    print("  仓库名（%d 个）：" % len(brief["必须给出的 plain"]["仓库"]))
    print("    %s" % "、".join(brief["必须给出的 plain"]["仓库"]))

    print("\n" + "=" * W)
    print("六、insights 结构")
    print("=" * W)
    # 结构本身由 --template 直接生成，不必在这里展开 37 行 JSON ——
    # 那会挤占一次调用的可读输出，逼得下游分两段重读（2026-11-08 实测就是如此）。
    print("  用 --template 生成骨架即可，字段结构会自带。概览：")
    print("    summary  : 字符串 40–80 字单行")
    print("    tldr     : 字符串 ×3–4")
    print("    theme    : 段落 ×2–4")
    print("    papers   : {论文id: {plain, why, analogy, readme}}（精读榜四项，速览区只要 plain）")
    print("    repos    : {仓库全名: {plain, why, for_who}}（精读榜三项，速览区只要 plain）")
    print("    concepts : [{term, means}] ×3")
    print("    try      : 字符串 ×2–3")

    print("\n" + "=" * W)
    print("七、写作要求")
    print("=" * W)
    for line in brief["写作要求"]:
        print("  " + line)

    print("\n" + "=" * W)
    print("八、下一步")
    print("=" * W)
    tpl = os.path.join(INSIGHTS, "%s.json" % args.date)
    print("  python3 prepare.py --date %s --template > %s" % (args.date, tpl))
    print("  → 填完中文内容后：python3 verify.py --date %s（一条命令验全部格式）" % args.date)
    print("=" * W)
    return 0


if __name__ == "__main__":
    sys.exit(main())
