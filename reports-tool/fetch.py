#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""每日 AI / 计算机情报抓取器（纯标准库，无第三方依赖）

数据源：
  1. Hugging Face Daily Papers —— 走 hf-mirror.com 镜像（huggingface.co 在本机直连不通）
  2. GitHub Trending (daily)

用法：
  python3 fetch.py                 # 抓今天，写 data/YYYY-MM-DD.json
  python3 fetch.py --date 2026-11-02
  python3 fetch.py --top-papers 6 --top-repos 8

产出：
  data/YYYY-MM-DD.json   结构化原始数据（相对本目录，供写报告用）
"""

import argparse
import html
import json
import os
import re
import ssl
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, "data")
# adaptive 指纹库：放项目内，别放 site-packages（见 fetch_github_trending_scrapling 的注释）
ADAPTIVE_DB = os.path.join(BASE, "adaptive_fingerprints.db")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


class _Follow308(urllib.request.HTTPRedirectHandler):
    """Python 3.9 的 urllib 不认 HTTP 308，这里补上（308 保留原方法）。

    实测：hf-mirror.com 对 urllib 客户端会回 308，对 curl 回 200。
    光跟随 308 还不够——跳转目标是本机不通的 huggingface.co，所以真正的
    主力是下面的 curl 通道，这个 handler 只是让 urllib 兜底路径不至于直接崩。
    """

    def http_error_308(self, req, fp, code, msg, headers):  # noqa: N802
        return self.http_error_307(req, fp, code, msg, headers)


_OPENER = urllib.request.build_opener(_Follow308())


def _get_urllib(url, timeout):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with _OPENER.open(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def _get_curl(url, timeout):
    """用 curl 取，取得和浏览器/curl 一致的客户端特征。

    这不是洁癖：hf-mirror 对 HTTP/1.1 的 urllib 请求回 308，对 curl 回 200，
    同样的 URL、同样的参数。纯标准库路径在这台机器上抓不到 HF 数据。
    """
    if not shutil.which("curl"):
        raise RuntimeError("curl 不可用")
    cmd = ["curl", "-sSL", "--max-time", str(timeout), "--compressed",
           "-H", "User-Agent: " + UA,
           "-H", "Accept: */*",
           "-H", "Accept-Language: en-US,en;q=0.9",
           url]
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0:
        raise RuntimeError("curl exit %d: %s" % (p.returncode, p.stderr.decode("utf-8", "replace")[:200]))
    text = p.stdout.decode("utf-8", "replace")
    if not text.strip():
        raise RuntimeError("curl 返回空内容")
    return text


def get(url, timeout=40, retries=3, prefer_curl=True):
    """取 URL。先 curl（实测唯一能稳定拿到 HF 镜像数据的通道），再 urllib 兜底。"""
    last = None
    for i in range(retries):
        for fetch in ((_get_curl, _get_urllib) if prefer_curl else (_get_urllib, _get_curl)):
            try:
                return fetch(url, timeout)
            except Exception as e:  # noqa: BLE001
                last = "%s: %s" % (fetch.__name__, e)
        time.sleep(1.5 * (i + 1))
    raise RuntimeError("GET failed: %s (%s)" % (url, last))


# ---------------------------------------------------------------- HF papers

def fetch_hf_papers(limit=40):
    """HF Daily Papers。优先直连，失败回落 hf-mirror，并带 cache-buster 防镜像旧缓存。"""
    bust = int(time.time())
    urls = [
        "https://huggingface.co/api/daily_papers?limit=%d&_=%d" % (limit, bust),
        "https://hf-mirror.com/api/daily_papers?limit=%d&_=%d" % (limit, bust),
    ]
    raw, used, errors = None, None, []
    for u in urls:
        try:
            raw = get(u, timeout=25, retries=2)
            used = u.split("/api/")[0]
            break
        except Exception as e:  # noqa: BLE001
            errors.append("%s -> %s" % (u.split("/api/")[0], e))
    if raw is None:
        raise RuntimeError("HF daily_papers 全部失败: " + " | ".join(errors))

    entries = json.loads(raw)
    out = []
    for e in entries:
        p = e.get("paper") or {}
        pid = p.get("id")
        if not pid:
            continue
        authors = [a.get("name") for a in (p.get("authors") or []) if a.get("name")]
        out.append({
            "id": pid,
            "title": (p.get("title") or "").strip(),
            "summary": re.sub(r"\s+", " ", (p.get("summary") or "")).strip(),
            "ai_summary": re.sub(r"\s+", " ", (p.get("ai_summary") or "")).strip(),
            "keywords": p.get("ai_keywords") or [],
            # 直连 HF 时 top-level 没有 upvotes，只在 paper 对象里；镜像两者都有
            "upvotes": e.get("upvotes") or p.get("upvotes") or 0,
            "comments": e.get("numComments") or p.get("numComments") or 0,
            "published_at": (p.get("publishedAt") or "")[:10],
            "submitted_on": (p.get("submittedOnDailyAt") or "")[:10],
            "org": (p.get("organization") or {}).get("fullname") or "",
            "first_author": authors[0] if authors else "",
            "n_authors": len(authors),
            "github": p.get("githubRepo") or "",
            "project_page": p.get("projectPage") or "",
            "url": "https://huggingface.co/papers/%s" % pid,
            "arxiv": "https://arxiv.org/abs/%s" % pid,
            "thumbnail": p.get("thumbnail") or "",
        })
    return out, used


def fetch_hf_papers_with_fallback(limit=40, want_day=None):
    """镜像偶尔返回前一天缓存；若最新提交日 != want_day，则额外提示。"""
    papers, src = fetch_hf_papers(limit=limit)
    days = sorted({p["submitted_on"] for p in papers if p["submitted_on"]}, reverse=True)
    note = None
    if want_day and days and days[0] != want_day:
        note = "数据源最新提交日为 %s（期望 %s），可能是镜像缓存延迟。" % (days[0], want_day)
    return papers, src, days, note


# ------------------------------------------------------------ GitHub trending
#
# 两条解析通道：
#   scrapling —— 主力。用 Scrapling 的 adaptive parsing：首次 auto_save=True 存下
#                元素指纹，GitHub 改版导致选择器失效时用 adaptive=True 按相似度重定位。
#                （需要 venv：.venv/bin/python，Scrapling 要求 Python ≥3.10）
#   regex     —— 兜底。手写正则，2026-11-03 之前的主力，仍保留以防 Scrapling 不可用。
# 两条通道的产出结构完全一致，切换时下游无感知。

TRENDING_URL = "https://github.com/trending?since=%s"

ROW_SELECTOR = "article.Box-row"      # 行的选择器（adaptive 的作用对象）
FLAG = "--no-scrapling"


def _s(v):
    """把选择器结果规整成干净的字符串。"""
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):
        v = " ".join(_s(x) for x in v)
    return re.sub(r"\s+", " ", html.unescape(str(v))).strip()


def _stars_num(v):
    return _s(v).replace(",", "").replace("+", "").strip()


def _text(s):
    """去掉 HTML 标签再规整（正则通道用）。"""
    return _s(re.sub(r"<[^>]+>", "", s))


def _pack(owner, name, desc, lang, total, today, forks, idx):
    return {
        "rank": idx,
        "full_name": "%s/%s" % (owner, name),
        "owner": owner,
        "name": name,
        "description": desc,
        "language": lang,
        "stars_total": total,
        "stars_today": today,
        "forks": forks,
        "url": "https://github.com/%s/%s" % (owner, name),
    }


def _row_to_repo(row, idx):
    """从一个行元素抽字段。每个字段都先试选择器，再退回整行文本正则。"""
    href = _s(row.css("h2 a::attr(href)").get())
    if not href:
        href = _s(row.css("h2 a::attr(href)").getall())
    m = re.match(r"^/([^/]+)/([^/]+?)/?$", href)
    if not m:
        # 退一步：从任意仓库链接里找 owner/name
        m2 = re.search(r'href="/([^/"]+)/([^/"]+)"', str(row))
        if not m2:
            return None
        owner, name = m2.group(1), m2.group(2)
    else:
        owner, name = m.group(1), m.group(2)

    # 描述：优先 col-9 那个 p，其次任意 p
    desc = _s(row.css("p.col-9::text").getall()) or _s(row.css("p::text").getall())
    # 语言
    lang = _s(row.css('[itemprop="programmingLanguage"]::text').get())
    # 累计 star / fork
    total = _stars_num(row.css('a[href$="/stargazers"]::text').get()) or \
            _stars_num(row.css('a[href$="/stargazers"]::text').getall())
    forks = _stars_num(row.css('a[href$="/forks"]::text').get()) or \
            _stars_num(row.css('a[href$="/forks"]::text').getall())
    # 今日新增：整行文本里找「N stars today」
    try:
        row_text = _s(row.xpath(".//text()").getall())
    except Exception:  # noqa: BLE001
        row_text = _s(str(row))
    tm = re.search(r"([\d,]+)\s+stars\s+(?:today|this week|this month)", row_text)
    today = tm.group(1).replace(",", "") if tm else ""
    if not desc:
        desc = ""
    return _pack(owner, name, desc, lang, total, today, forks, idx)


def _trending_html(since):
    """取 trending 页面 HTML。传输层用 curl 通道，Scrapling 自带 fetcher 仅作后备。

    实测：Scrapling 的 Fetcher（curl_cffi 指纹伪装）在这台机器上抓 GitHub 会超时，
    而普通 curl 稳定 200。所以分工——传输用验证过的通道，Scrapling 只负责解析。
    """
    url = TRENDING_URL % since
    try:
        return get(url, timeout=40), "curl"
    except Exception as e:  # noqa: BLE001
        print("[gh] curl 通道失败（%s），改用 Scrapling fetcher" % e, file=sys.stderr)
        from scrapling.fetchers import Fetcher
        return str(Fetcher.get(url, timeout=45)), "scrapling"


def fetch_github_trending_scrapling(since="daily", page_html=None):
    """用 Scrapling 解析（含 adaptive 重定位）。返回 (repos, engine, note)。

    page_html 参数仅供测试注入：改版模拟测试要把「变异后的页面」喂进来，不能再走网络。
    """
    from scrapling.parser import Selector  # 延迟导入：没装/低版本 python 时走正则兜底

    url = TRENDING_URL % since
    if page_html is None:
        page_html, transport = _trending_html(since)
    else:
        transport = "injected"

    # adaptive 的「记忆」是一份 SQLite 指纹库。Scrapling 默认把它放在
    # site-packages/scrapling/ 里面——venv 一重建就全丢，所以显式放到项目内。
    # 跨进程持久化是这套机制能生效的前提：明天是新进程，靠它认得出改版后的元素。
    sel_kwargs = {}
    try:
        sel_kwargs = {
            "url": url,
            "adaptive": True,
            "storage_args": {"storage_file": ADAPTIVE_DB},
        }
        page = Selector(page_html, **sel_kwargs)
    except Exception:  # noqa: BLE001
        sel_kwargs = {}
        page = Selector(page_html, adaptive=True, url=url)

    # Scrapling 官方用法：先 auto_save 存元素指纹；改版导致选择器失效时用 adaptive 按相似度重定位
    note = ""
    try:
        rows = page.css(ROW_SELECTOR, auto_save=True)
    except TypeError:
        # 个别版本不接受 url/adaptive 组合，降级为普通解析
        page = Selector(page_html)
        rows = page.css(ROW_SELECTOR)
        note = "Scrapling 自适应不可用（版本差异），已降级为普通解析"
    if not rows:
        try:
            rows = page.css(ROW_SELECTOR, adaptive=True)
        except TypeError:
            rows = []
        note = "选择器已失效，adaptive 重定位成功——GitHub 可能改版了，建议复查字段"

    if not rows:
        raise RuntimeError("adaptive 也没能定位到 trending 行（选择器=%s）" % ROW_SELECTOR)

    repos = []
    for i, row in enumerate(rows, 1):
        r = _row_to_repo(row, i)
        if r:
            repos.append(r)
    return repos, "scrapling(%s)" % transport, note


def fetch_github_trending_regex(since="daily", page_html=None):
    """兜底通道：手写正则解析 HTML（不依赖 Scrapling）。page_html 参数仅供测试注入。"""
    page = page_html if page_html is not None else get(TRENDING_URL % since, timeout=40)
    chunks = re.split(r'<article class="Box-row">', page)[1:]
    repos = []
    for idx, c in enumerate(chunks):
        m = re.search(r'<h2 class="h3 lh-condensed">\s*<a[^>]*href="/([^"/]+)/([^"]+)"', c)
        if not m:
            continue
        owner, name = m.group(1), m.group(2)

        dm = re.search(r'<p class="col-9 color-fg-muted my-1[^"]*">(.*?)</p>', c, re.S)
        desc = _text(dm.group(1)) if dm else ""

        lm = re.search(r'itemprop="programmingLanguage">([^<]+)<', c)
        lang = html.unescape(lm.group(1)).strip() if lm else ""

        sm = re.search(r'href="/%s/%s/stargazers"[^>]*>(.*?)</a>' % (re.escape(owner), re.escape(name)), c, re.S)
        total = _text(sm.group(1)).replace(",", "") if sm else ""

        tm = re.search(r'([\d,]+)\s+stars\s+(?:today|this week|this month)', _text(c))
        today = tm.group(1).replace(",", "") if tm else ""

        fm = re.search(r'href="/%s/%s/forks"[^>]*>(.*?)</a>' % (re.escape(owner), re.escape(name)), c, re.S)
        forks = _text(fm.group(1)).replace(",", "") if fm else ""

        repos.append(_pack(owner, name, desc, lang, total, today, forks, idx + 1))
    return repos


def fetch_github_trending(since="daily", engine="auto"):
    """返回 (repos, engine_used, note)。engine: auto | scrapling | regex"""
    if engine in ("auto", "scrapling") and FLAG not in sys.argv:
        try:
            repos, used, note = fetch_github_trending_scrapling(since)
            if len(repos) >= 5:
                return repos, used, note
            print("[gh] scrapling 只拿到 %d 条（<5），回退正则" % len(repos), file=sys.stderr)
        except Exception as e:  # noqa: BLE001
            print("[gh] scrapling 不可用/失败：%s；回退正则" % e, file=sys.stderr)
            if engine == "scrapling":
                raise
    repos = fetch_github_trending_regex(since)
    return repos, "regex", ""


# ------------------------------------------------------------------- driver

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=None, help="YYYY-MM-DD，默认今天")
    ap.add_argument("--top-papers", type=int, default=6)
    ap.add_argument("--top-repos", type=int, default=8)
    ap.add_argument("--force", action="store_true",
                    help="已存在当天快照时强制重新抓取（默认冻结当天快照）")
    args = ap.parse_args()

    today = args.date or datetime.now().strftime("%Y-%m-%d")
    os.makedirs(DATA_DIR, exist_ok=True)
    out = os.path.join(DATA_DIR, "%s.json" % today)

    def _complete(obj):
        return bool(obj.get("hf_papers")) and bool(obj.get("gh_repos"))

    try:
        with open(out, encoding="utf-8") as f:
            prev = json.load(f)
    except Exception:  # noqa: BLE001
        prev = None

    # ---- 当天快照冻结 -----------------------------------------------------
    # 解读稿（insights/*.json）是照着某一份快照写的。如果下午重抓一次，
    # 榜单会变（今天实测：中午后又有 3 篇论文挤进前 6），解读稿就会与数据对不上，
    # lint 会报「缺少解读」。所以默认不覆盖已存在且完好的快照。
    if prev is not None and _complete(prev) and not args.force:
        print("[freeze] %s 已有完好快照（抓取于 %s），跳过重抓。如需刷新请加 --force。"
              % (today, prev.get("fetched_at", "?")))
        print("wrote", out, "(unchanged)")
        return 0

    result = {"date": today, "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "sources": {}}

    try:
        papers, src, days, note = fetch_hf_papers_with_fallback(limit=50, want_day=today)
        result["sources"]["hf"] = {"endpoint": src, "days_seen": days, "note": note}
        pool = [p for p in papers if p["submitted_on"] in (days[:1] or [None])] or papers
        pool.sort(key=lambda p: (p["upvotes"], p["comments"]), reverse=True)
        result["hf_papers"] = pool[: args.top_papers]
        result["hf_papers_all"] = pool
        print("[hf] %d papers (source=%s, days=%s) %s" % (len(pool), src, days[:2], note or ""))
    except Exception as e:  # noqa: BLE001
        result["hf_papers"] = []
        result["hf_error"] = str(e)
        print("[hf] FAILED: %s" % e, file=sys.stderr)

    try:
        repos, gh_engine, gh_note = fetch_github_trending("daily")
        result["sources"]["gh"] = {"engine": gh_engine, "note": gh_note}

        def _stars(r):
            try:
                return int(str(r.get("stars_today", 0)).replace(",", ""))
            except (TypeError, ValueError):
                return 0

        # 先按「今日新增 star」排序再截断，否则会漏掉真正的今日第一
        repos.sort(key=_stars, reverse=True)
        result["gh_repos"] = repos[: args.top_repos]
        result["gh_repos_all"] = repos
        print("[gh] %d repos (engine=%s) %s" % (len(repos), gh_engine, gh_note))
    except Exception as e:  # noqa: BLE001
        result["gh_repos"] = []
        result["gh_error"] = str(e)
        print("[gh] FAILED: %s" % e, file=sys.stderr)

    # ---- 数据安全闸门：绝不用「残缺结果」覆盖「完好快照」 --------------------
    # 实测事故：FORCE=1 重抓时 HF 侧全部失败（429 / 308），result 里 hf_papers=[]，
    # 结果把当天完好的快照覆盖成空，报告随之降级。这类覆盖必须被拦住。
    if not _complete(result) and prev is not None and _complete(prev):
        print("[guard] 本次抓取不完整（hf_papers=%d, gh_repos=%d），"
              "拒绝覆盖已有完好快照（抓取于 %s）。"
              % (len(result.get("hf_papers") or []), len(result.get("gh_repos") or []),
                 prev.get("fetched_at", "?")), file=sys.stderr)
        print("[guard] 缺失原因：hf=%s | gh=%s"
              % (result.get("hf_error", "ok")[:120], result.get("gh_error", "ok")[:120]),
              file=sys.stderr)
        print("wrote", out, "(kept previous snapshot)")
        return 1

    with open(out, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print("wrote", out)
    return 0 if _complete(result) else 1


if __name__ == "__main__":
    sys.exit(main())
