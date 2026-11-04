#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把本次日报的实际耗时与 token 用量记进 data/YYYY-MM-DD.json。

**为什么要单独这个脚本**：token 用量只有跑这次任务的 agent 自己知道，`fetch.py`
（纯标准库、不做 LLM 调用）无从得知。所以流程是：

    agent 跑完这次任务 → 调本脚本把数字写进快照 → render.py 读出来放进报告末尾

数据源是 DSH 的会话日志（zstd 压缩的 jsonl），两处关键事件：
  - `assistant/message.data.usage.{inputTokens,outputTokens}` —— 每次模型调用的用量
  - `turn/start` / `turn/end.time` —— 一轮的墙钟区间

用法（二选一）：
  # A. 自动从当前会话日志取「最后一轮」
  python3 usage.py --date 2026-11-04 --auto

  # B. 显式给数字（agent 自己统计好时最可靠）
  python3 usage.py --date 2026-11-04 --seconds 690 --input-tokens 4332648 --output-tokens 12628

为什么默认取「最后一轮」：定时任务一个 prompt 就是一轮，正好对应本次日报。
但若同一轮里干了别的活，数字会偏大——那种情况用方式 B 手工给。
"""

import argparse
import glob
import json
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")


def _session_log_path():
    """定位当前会话的 jsonl.zstd。可用 DSH_SESSION_ID 精确匹配。"""
    sid = os.environ.get("DSH_SESSION_ID")
    home = os.environ.get("DSH_HOME") or os.path.expanduser("~/.dsh")
    if sid:
        hits = glob.glob(os.path.join(home, "sessions", "*", sid, "session*.zstd"))
        if hits:
            return max(hits, key=os.path.getmtime)
    # 兜底：取最近更新的会话日志（只在单会话运行时可靠）
    hits = glob.glob(os.path.join(home, "sessions", "*", "*", "session*.zstd"))
    if not hits:
        raise SystemExit("[usage] 找不到会话日志（DSH_SESSION_ID 未设置且无兜底命中）")
    return max(hits, key=os.path.getmtime)


def _read_events(path):
    if not path.endswith(".zstd"):
        with open(path, encoding="utf-8") as f:
            for ln in f:
                ln = ln.strip()
                if ln:
                    yield json.loads(ln)
        return
    import shutil
    if not shutil.which("zstd"):
        raise SystemExit("[usage] 需要 zstd 命令来解压会话日志")
    p = subprocess.run(["zstd", "-dc", path], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if p.returncode != 0:
        raise SystemExit("[usage] zstd 解压失败：%s" % path)
    for ln in p.stdout.decode("utf-8", "replace").splitlines():
        ln = ln.strip()
        if ln:
            try:
                yield json.loads(ln)
            except json.JSONDecodeError:
                continue


def collect(path, turn=None):
    """返回 {turn, seconds, input_tokens, output_tokens, calls}。

    turn=None 时取日志里最后一轮完整的 turn。
    """
    starts, ends = {}, {}
    usage = {}
    for ev in _read_events(path):
        t = ev.get("type")
        data = ev.get("data") or {}
        if t == "turn/start":
            starts[data.get("turn")] = ev.get("time")
        elif t == "turn/end":
            ends[data.get("turn")] = ev.get("time")
        elif t == "assistant/message":
            u = data.get("usage") or {}
            tn = data.get("turn")
            if tn is None or not (u.get("inputTokens") or u.get("outputTokens")):
                continue
            acc = usage.setdefault(tn, {"in": 0, "out": 0, "calls": 0})
            acc["in"] += u.get("inputTokens") or 0
            acc["out"] += u.get("outputTokens") or 0
            acc["calls"] += 1

    done = sorted(k for k in ends if k in starts)
    if not done:
        raise SystemExit("[usage] 日志里没有完整的一轮（turn/start 与 turn/end 都没配齐）")
    target = turn if turn is not None else done[-1]
    if target not in ends:
        raise SystemExit("[usage] 第 %s 轮还没结束，拿不到完整耗时" % target)

    acc = usage.get(target, {"in": 0, "out": 0, "calls": 0})
    return {
        "turn": target,
        "seconds": round((ends[target] - starts[target]) / 1000.0, 1),
        "input_tokens": acc["in"],
        "output_tokens": acc["out"],
        "calls": acc["calls"],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="YYYY-MM-DD，写入哪天的快照")
    ap.add_argument("--auto", action="store_true", help="从会话日志自动取最后一轮")
    ap.add_argument("--turn", type=int, default=None, help="指定第几轮（配合 --auto）")
    ap.add_argument("--session-log", default=None, help="显式指定会话日志路径")
    ap.add_argument("--seconds", type=float, default=None, help="墙钟秒数")
    ap.add_argument("--input-tokens", type=int, default=None)
    ap.add_argument("--output-tokens", type=int, default=None)
    ap.add_argument("--calls", type=int, default=None, help="模型调用次数")
    args = ap.parse_args()

    out = os.path.join(DATA, "%s.json" % args.date)
    if not os.path.exists(out):
        raise SystemExit("[usage] 快照不存在：%s（先跑 fetch.py）" % out)

    explicit = [args.seconds, args.input_tokens, args.output_tokens]
    if args.auto and any(v is not None for v in explicit):
        raise SystemExit("[usage] --auto 与显式数字不要混用")
    if not args.auto and not (args.seconds and args.input_tokens is not None):
        raise SystemExit("[usage] 要么给 --auto，要么给 --seconds 与 --input-tokens")

    if args.auto:
        path = args.session_log or _session_log_path()
        info = collect(path, args.turn)
        print("[usage] 取自会话日志：%s" % path)
    else:
        info = {
            "turn": args.turn,
            "seconds": float(args.seconds),
            "input_tokens": args.input_tokens or 0,
            "output_tokens": args.output_tokens or 0,
            "calls": args.calls,
        }

    with open(out, encoding="utf-8") as f:
        snap = json.load(f)
    snap["cost"] = info
    with open(out, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False, indent=2)

    mins = info["seconds"] / 60.0
    print("[usage] 第 %s 轮 ｜ 耗时 %.1fs（%.1f 分钟）｜ 输入 %s ｜ 输出 %s ｜ 调用 %s 次"
          % (info.get("turn") or "-", info["seconds"], mins,
             format(info["input_tokens"], ","), format(info["output_tokens"], ","),
             info.get("calls") if info.get("calls") is not None else "-"))
    print("[usage] 已写入 %s" % out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
