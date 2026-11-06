# 每日 AI 与计算机简报

每天中午 12:00 自动生成一篇面向初学者的简报，覆盖：

1. **Hugging Face Daily Papers** —— 研究圈今天在关心什么（按社区点赞排序）
2. **GitHub Trending** —— 工程圈今天在用什么（按今日新增 star 排序）

每一条都给出 **说人话的解释 + 为什么值得看 + 原文链接**，末尾附「今天顺手学的 3 个概念」和「今天可以试一下」。

---

## 给接手的新会话（先读这一节）

**这一节是为「专职维护日报流程的新对话」写的。** 你看不到之前那 25 轮折腾的对话历史，
所以这里把必须知道的事压缩成三块：现状、流程、红线。

### 你要接手的是什么

```
WUYUWeb/
├── reports-tool/          ← 日报系统的全部代码与数据（本目录）
└── content/reports/       ← 交付物，站点构建从这里读
    ├── 2026-11-02.md
    ├── 2026-11-03.md
    ├── 2026-11-04.md
    └── README.md          ← 站点自己的规范，**禁止修改**
```

**定时任务**：每天 12:00（Asia/Shanghai）触发，工作目录 `…/WUYUWeb/reports-tool`。
任务是 **prompt 驱动**的：它给 agent 一套步骤，agent 照做。任务本身的 id 会变
（历史上换过 4 次，每次都因为直接改存储文件被运行时清空，见「红线」第 2 条）。

### 一条命令跑完整流程

```bash
cd /Users/Admin/Projects/WUYUWeb/reports-tool

1) ./run-daily.sh                      # 抓取（内置两道体检 + 并发锁）
2) ./.venv/bin/python prepare.py --date $(date +%F)          # 一次拿全信息
3) ./.venv/bin/python prepare.py --date $(date +%F) --template > insights/$(date +%F).json
   #   ↑ 然后往骨架里填中文内容（这是唯一需要「创作」的一步）
4) ./.venv/bin/python usage.py --date $(date +%F) --auto     # 记录本轮耗时与 token
5) ./.venv/bin/python render.py --date $(date +%F)           # 渲染到站点
6) ./.venv/bin/python verify.py --date $(date +%F)           # 一条命令验 20 项
7) present 报告，并在回复里用 3 句话概括今天
```

**目标是整条流程 ≤10 次模型调用。** 为什么强调这个：每多一次调用就要重付一次完整上下文。
实测过一次用了 **25 次调用、433 万 token**，其中 19 次是在查「lint 要什么字段」「格式对不对」，
这些本该由 `prepare.py` 和 `verify.py` 一次性给出。

### 两个脚本是你的主要工具

| 命令 | 作用 |
|---|---|
| `prepare.py --date X` | 一次输出 8 节：精读/速览论文全文摘要、精读/速览仓库、**必须给的 plain 清单**、insights 结构、写作要求、下一步 |
| `prepare.py --date X --template` | 生成 insights 骨架，**每个需要 plain 的 ID 都摆好（含速览区）** |
| `verify.py --date X` | 一条命令验 20 项，**一次性列出所有问题**，不用修一个跑一次 |

`--template` 是防 `[EN]` 的根本手段：骨架里没有的 ID 不存在，有的漏填立刻暴露。

### 三条红线（违反会出真事故）

**1. 不要用 `FORCE=1` 碰真实日期的数据。**
`FORCE=1` 会重抓并**覆盖当天完好快照**，而解读稿是照着旧快照写的，覆盖后榜单漂移、
体检立刻报「N 篇缺少解读」。2026-11-04 我就这么毁过一次当天数据，靠 git 才还原。
测流程请用临时日期（如 `2026-11-20`），跑完删干净。

**2. 不要直接编辑 `~/.dsh/storages/schedule.json`。**
那个文件由运行时管理，外部改动会被覆盖成空。想改定时任务只能用 `schedule_create` /
`schedule_delete`；`schedule_update` 跨会话不可用，所以改任务 = 先删后建（id 会变，正常）。

**3. 不要改站点资产。**
`content/reports/README.md`、`content/updates.md`、`src/` 下任何文件都不属于本工具。
`content/reports/` 里也不要 `git init`——一旦出现 `.git/`，父仓库就不再跟踪日报文件，
上线时平台拿不到内容。

### 提交与上线：自动 stage，人工推送

**职责划分是本节的要点**：机械活自动化，判断留给人。

`run-daily.sh` 在自检 0 ERROR 后**自动 `git add` 三个文件**（日报、快照、解读稿），
然后打印下一步命令。它**不会 commit，也不会 push** —— 因为站点规定
（`AGENTS.md:23`、`content/reports/README.md:107`）明确要求提交与推送需用户授权。

```bash
# 每天日报跑完后，你只需要：
cd /Users/Admin/Projects/WUYUWeb
git commit -m "content(reports): 2026-11-06 日报"
git push          # ← 上线动作，永远人工确认
```

**为什么 push 必须人工**：2026-11-05 那次 SSE 超时产出了残报告（45 个 lint ERROR、
10 处 `[EN]`、summary 为空）。如果当时全自动 push，坏日报直接上线。
`commit` 提供可回滚的检查点，`push` 是不可逆的上线动作——把它留给人。

### 失败告警（无人值守的前提）

只要本次没出合格成品，`run-daily.sh` 会在日志与 stdout 打出：

```
########## DAILY-DIGEST-FAILED ##########
日期     : 2026-11-05
原因     : fetch=0 render=0 lint_content=2 lint_final=1
产出     : .../2026-11-05.md 存在但未通过自检
重要     : 若产出「存在但未通过」，它已经在站点目录里，构建会读到它。
########## DAILY-DIGEST-FAILED ##########
```

**为什么需要它**：无人值守时最危险的不是失败，是**失败了没人知道**。11-05 那次
残报告一直躺在站点目录里，直到人去看才发现。定时任务的会话记录里搜
`DAILY-DIGEST-FAILED` 就能定位。

### 连续在榜仓库的写法（streak_days）

`prepare.py` 会自动给每个精读仓库算出 `streak_days`（连续在榜天数，回溯最多 30 天）
和 `prev_why`（昨天写的解读）。实测 11-05 ∩ 11-06 有 6/10 个仓库重叠，
`Scrapling` / `mattpocock/skills` / `agent-desktop` 连续 5 天在榜——
同一个仓库连着上榜时，「为什么今天火」的真实理由往往没变。

规则：`streak_days ≥ 3` 时，`why` 要写**今天的新变化**（今日新增多少 star、
有无新版本/新 issue），参考 `prev_why` 但**不要复述**。确实无变化就如实写
「连续第 N 天在榜，今日新增 X star，热度未减」。

**这不是「可以少写」的许可**：读者看的是当天独立一份日报，「一直在榜、没啥好说」
会让人直接失去兴趣；也不许为了显得有新意而编造。

### 已知的架构限制（别想着「优化掉」）

- **定时任务跑在当前会话的延续里**（`deliveryMode` 未生效，实际投递到会话）。
  所以每天日报会继承这个会话的历史——这是 token 大头，且**无法通过改脚本消除**。
  唯一办法是「换一个干净的会话专门跑日报」（也就是你现在接手的这个）。
- **subagent 不能用来跑日报**：能创建（干净起点约 19,351 token）、但**不能中断**
  （`interrupt_agent` / `send_message` 都只认 teammate）、**不能删除**、且有数量上限。
  每天新建会耗尽配额并导致日报中断，所以**不要用**。
- 优惠：真正能降成本的是**压调用次数**（已做），不是换运行载体。

### 第一次上手建议

```bash
# 1. 先确认环境健康（不该有报错）
./.venv/bin/python lint.py --all
./.venv/bin/python verify.py --all

# 2. 看看最近的产出
ls ../content/reports/

# 3. 确认定时任务还活着
#    （本会话里 schedule_list 能看到本会话创建的任务）
```

---

## 目录结构

本工具位于站点仓库内：`WUYUWeb/reports-tool/`。

```
WUYUWeb/reports-tool/            ← 本目录（工具与数据）
├── fetch.py              抓取脚本（HF 走 curl 通道；GitHub 走 Scrapling + 正则兜底）
├── lint.py               交付自检：解读稿质量 + 报告文件格式（frontmatter / 正文规格）
├── render.py             报告渲染（按站点规格产出 YAML frontmatter + Markdown 正文）
├── prepare.py            **一次给出写日报需要的全部信息 + 可生成 insights 骨架**
├── verify.py             **一条命令验完全部交付规格（20 项）**
├── usage.py              记录本次生成的耗时与 token（写进快照，报告末尾展示）
├── run-daily.sh          一键：抓取 → 体检解读稿 → 渲染 → 交付前自检（自动优先用 .venv）
├── .venv/                Python 3.11 venv，装 Scrapling + PyYAML（本地资产，不入库）
├── adaptive_fingerprints.db  Scrapling 的 adaptive 元素指纹库（改版免疫力的来源）
├── data/YYYY-MM-DD.json  当日原始数据快照（论文摘要、星数、语言、用了哪条抓取通道…）
├── insights/YYYY-MM-DD.json  当日小白解读稿（报告质量的唯一来源）
└── logs/run.log          运行日志

WUYUWeb/content/reports/YYYY-MM-DD.md   ← 最终日报的唯一产出位置（站点构建从这里读取）
```

**产出只写站点目录，本地不留副本。** 渲染器按「本目录的上一级 + `content/reports`」定位，
目录不存在或不可写就**报错退出**，不回退到本地——静默回退会让定时任务看起来跑通、
实际站点里却没有当天日报。目录规范见 `content/reports/README.md`（属站点资产，勿改）。

### 版本跟踪范围

日报与工具**随站点仓库一起提交**（`content/reports/*.md` 不再 untracked，用户已于 2026-11-03 确认纳入）。

| 纳入 | 不纳入（`.gitignore`） |
|---|---|
| `fetch.py` `lint.py` `render.py` `run-daily.sh` | `reports-tool/.venv/`（400MB+，`pyvenv.cfg` 与 shebang 写死本机绝对路径，换机器必须重建） |
| `data/` `insights/` 快照与解读稿 | `reports-tool/__pycache__/`、`**/__pycache__/` |
| `adaptive_fingerprints.db`（改了能复现的算力，丢了要冷启动） | `logs/`（`.log` 规则已覆盖，日志属运行痕迹） |

**入库后仍要守住的一条**：`content/reports/README.md` 第六节明确禁止在**那个目录**（`content/reports/`）里 `git init`。
它一旦出现 `.git/`，父仓库就不再跟踪里面的文件，上线时平台拿不到日报。
现在 `content/reports/` 没有 `.git/`，也没有嵌套仓库。

> 提交与推送按站点 `AGENTS.md:22` 走「用户明确授权」——本次迁移的提交已获授权，后续照旧。

## 日常使用

```bash
# 抓今天并生成报告（产出落在 ../content/reports/）
./run-daily.sh

# 指定日期
./run-daily.sh 2026-11-02

# 强制重抓（默认冻结当天快照，见下）
FORCE=1 ./run-daily.sh

# 只体检 / 只重渲染
./.venv/bin/python lint.py --date 2026-11-03          # 内容 + 报告格式，都查
./.venv/bin/python lint.py --date 2026-11-03 --insights-only   # 只查解读稿（渲染前那一遍用）
./.venv/bin/python lint.py --all                     # 查所有天的解读稿 + 报告文件
./.venv/bin/python render.py
```

### 推荐的三步流程（省 token 的关键）

**这是本目录最重要的一条工程约定。** 实测过一次日报用了 **25 次模型调用**，
其中只有 **6 次是必要动作**（抓取 / 读快照 / 写 insights / 渲染 / 自检 / 呈现），
另外 19 次全是 agent 在分头查「lint 要哪些字段」「render 要哪些字段」「[EN] 漏在哪」
「格式对不对」。

**关键认知：每多一次调用，就要重付一次完整上下文。** 25 次调用重付了 25 遍，
这才是 token 大头（实测 433 万 token，其中 80% 是重复的会话上下文）。

所以把探索全部前置到脚本，agent 只做三步：

```bash
# 1. 一次拿到全部信息（论文 + 仓库 + 待写清单 + 写作要求），替代原来 5–6 次探索
./.venv/bin/python prepare.py --date 2026-11-04

# 2. 生成骨架，把每个 ID 空位都摆好；agent 只填中文内容，不会漏 ID
./.venv/bin/python prepare.py --date 2026-11-04 --template > insights/2026-11-04.json

# ...填空...

# 3. 一条命令验完 20 项规格，一次列清所有问题（不用修一个再跑一次）
./.venv/bin/python verify.py --date 2026-11-04
```

**为什么 `--template` 是关键**：骨架里预置了每一个需要 `plain` 的 ID，**包括速览区的**。
漏写会立刻在 `verify.py` 里暴露，从根上消灭「渲染后才发现 14 个 `[EN]`」这个坑
（2026-11-04 第一次跑日报就因为漏了速览区，报告里留了 14 处 `[EN]`）。

**`verify.py` 一次性列出全部问题**，而不是让你修一个、再跑一次、再发现下一个——
后者每次都要重付一遍上下文。

> 定时任务的 prompt 已按这套三步流程重写。看到 prompt 里出现「先读 lint.py 看规则」
> 这类指令就是退化了，应该改成调用 `prepare.py`。

定时任务：每天 12:00（Asia/Shanghai），工作目录指向本目录（当前 id `schedule-8c333764`；
历史上换过两次 id，因为运行时管理存储，用 `schedule_create` 重建而非手改文件）。

## 报告末尾的开销行（耗时 + token）

每篇日报结尾会多一行：

```
_本次生成开销：耗时 11.5 分钟 ｜ token 输入 4,332,648 / 输出 12,628，合计 4,345,276 ｜ 25 次模型调用。_
```

### 为什么必须有 `usage.py` 这个独立脚本

**token 用量只有跑这次任务的 agent 自己知道。** `fetch.py` 是纯标准库、不做任何 LLM 调用，
它抓得到论文和星数，但抓不到「模型花了多少 token」。所以这件事没法塞进 `run-daily.sh`。

`usage.py` 从 DSH 会话日志（`~/.dsh/sessions/*/session*.jsonl.zstd`）取两个东西：

| 事件 | 取什么 |
|---|---|
| `assistant/message.data.usage` | 每次模型调用的 `inputTokens` / `outputTokens` |
| `turn/start` 与 `turn/end` 的 `time` | 这一轮的墙钟耗时 |

```bash
# 自动：取会话日志里「最后一轮」（定时任务一个 prompt = 一轮，正好对应本次日报）
./.venv/bin/python usage.py --date 2026-11-04 --auto

# 显式：多轮任务或需要精确数字时手工给（此时最可靠）
./.venv/bin/python usage.py --date 2026-11-04 \
    --seconds 690 --input-tokens 4332648 --output-tokens 12628 --calls 25
```

写进 `data/<day>.json` 的 `cost` 字段，`render.py` 渲染成报告末尾那一行。

### 三条设计约束

1. **必须在渲染之前跑。** `render.py` 直接读快照里的 `cost`，跑完之后再写就没用了。
2. **不能放进 `run-daily.sh`。** 那个脚本自己在跑，此刻本轮还没结束——取到的会是**上一轮**的数字。
3. **拿不到就不写，绝不编造。** 历史快照（2026-11-02/03）没有 `cost` 字段，重渲染时不显示这一行，
   而不是补一个猜的数值。开销行缺失是**可接受降级**，编造数字不是。

> `inputTokens` 是**每次调用累加**，其中包含大量重复的前缀（同一轮里的历史上下文反复计费），
> 所以数值看起来比正文长很多——这不是 bug，是真实的计费口径。想知道「这篇报告值多少钱」，
> 看的就是这个累计量。

## 三条铁律（都是踩过的坑）

### 0. 同一时刻只允许一个 run-daily.sh

`run-daily.sh` 用原子 `mkdir` 建锁（`.run-daily.lock/`），第二个实例会被拒绝并**以退出码 0 明示「什么都没做」**。

原因：定时任务 12:00 触发时人若又手动跑一次，两个进程会同时写 `data/<day>.json`、
同一天报告和 `logs/run.log`。快照冻结逻辑只看「文件是否存在且完整」，并发下可能都判定
「不存在」而互相覆盖——解读稿依据的数据与最终落盘的数据错位，**是静默的数据损坏**。

三个实现细节：

1. **用 `mkdir` 不用 `flock`**：`mkdir` 是原子的（同目录同名字只能建一次），且 Git Bash 里没有 `flock`。
2. **锁里写 pid，并检测持有者是否活着**。否则一次 `SIGKILL` 或断电会让定时任务**永久阻塞**——
   `SIGKILL` 捕获不到 `trap`，锁目录会永远留在那儿。检测到 pid 已死就自动清理后继续。
3. **`trap EXIT/INT/TERM/HUP` 释放锁**，正常结束与 `SIGTERM` 都能清干净。

已测五种场景：正常释放 / 并发被拒 / 僵尸锁自愈 / `SIGTERM` 清理 / `SIGKILL` 泄漏后下次运行自愈。

### 1. 当天数据快照必须冻结

`fetch.py` 默认**不覆盖已存在且完好的当天快照**，只有 `--force` / `FORCE=1` 才重抓。

原因：解读稿是照着某一份快照写的。实测过一次事故——中午 12:19 抓完数据、写完解读，
下午 13:39 又抓了一次，榜单变了（新出现 3 篇论文挤进前 6，仓库星数也涨了），
解读稿立刻与数据对不上：体检报「3 篇缺少解读」，星数核对全部 WARN。**重跑一次就毁掉一致性。**

> 2026-11-04 又复现了一次，责任在我：给并发锁做测试时用了 `FORCE=1` 跑真实日期，
> 把当天完好快照覆盖成 14:35 新抓的数据，3 篇论文换人，体检立刻报 3 ERROR。
> 已从 git 还原（`fetch_at` 回到 12:09:30）。
> **测试锁或任何流程时，不要用 `FORCE=1` 碰真实日期的数据**——用临时日期，或干脆不抓。

### 2. 解读稿要过体检才能发布

`lint.py` 拦三类缺陷：

| 缺陷 | 例子 | 级别 |
|---|---|---|
| 英文冒充「说人话」 | `plain` 直接填英文 `ai_summary` | ERROR |
| 模板占位符泄漏 | 字面写着「前 N 名」「+3,xxx star」 | ERROR |
| 通用填充句 | 「代表该领域正在关注的方向」（放谁身上都成立 = 没说） | ERROR |
| 字段缺失 | 前 6 名论文缺 `why` | ERROR |
| 数字对不上 | `why` 里的星数既非今日也非累计 | WARN |
| `why` 雷同 | 两个条目的 `why` 一字不差（套模板） | ERROR |

`run-daily.sh` 会跑**两遍**体检，两遍分工不同：

1. **渲染前**（`--insights-only`）：只看解读稿。此时站点里那份马上要被覆盖，
   验它没意义，所以跳过——否则旧文件的毛病会污染退出码，出现「报告已修好却仍报失败」的假警报。
2. **渲染后**：完整体检，**校验刚生成的那份报告文件本身**，这一步才是发布门槛。

> 这里的坑：早先只在渲染前跑一遍，结果校验的其实是**上一次**的产物；新的一天还会因为
> 文件不存在而只报一条 WARN，然后照样生成一份没人验过的报告交出去。
> **闸门必须卡在交付物生成之后。**

这个体检做过自测：把出过事故的解读稿版本喂进去报 11 个 ERROR，把坏格式的报告喂进去报 19 项。
**没抓过东西的闸门等于没有闸门。**

### 3. 没翻就老实标出来

`render.py` 用中文占比 + 英文词数判断一段解读是否真的翻了。没翻的话：
- 精读区不挂「说人话」招牌，改标「原文摘要（本条解读稿未翻成中文）」
- 速览区给该条加 `[EN]` 前缀

宁可难看，不许假装。目标是报告里**一条 `[EN]` 都不剩**。

### 4. 残缺结果不许覆盖完好快照

`fetch.py` 在写盘前有护栏：如果本次抓取不完整（缺 `hf_papers` 或缺 `gh_repos`），
而磁盘上已有完好快照，就**拒绝覆盖**、保留旧快照、退出码 1。

这是实测出来的漏洞：`FORCE=1` 重抓时 HF 侧全灭（429 + 308），
生成了一份 `hf_papers: []` 的空结果，把当天完好的快照覆盖掉了，报告随之降级成一行报错。
护栏已复现测试：模拟同样的失败，快照被保住。

## 网络说明（重要）

### HF 为什么必须走 curl

本机 **直连 `huggingface.co` 不稳定**（会 429 / TCP 超时），而 `hf-mirror.com` 会
**按客户端特征分流**——同一个 URL：

| 客户端 | 结果 |
|---|---|
| curl | `200` + 正常 JSON |
| python `urllib` | `308 Permanent Redirect` → Location 指向 `huggingface.co`（本机不通） |

而且 **Python 3.9 的 urllib 不认 HTTP 308**（308 支持到 3.11 才进标准库），会直接抛 `HTTPError`。

所以 `fetch.py` 的 `get()` 现在是：**先 curl（`-sSL --compressed`），再 urllib 兜底**，
并为 urllib 路径补了一个 `_Follow308` handler。纯标准库版本在这台机器上抓不到 HF 数据——
这不是洁癖，是实测结论。

`fetch_hf_papers()` 仍会依次尝试 `huggingface.co` → `hf-mirror.com`，带 cache-buster 参数
（镜像不加会返回前一天的缓存）。

报告里的论文链接用镜像地址 `https://hf-mirror.com/papers/<id>`，arXiv 链接用官方 `arxiv.org`（可直连）。

GitHub Trending 与 `api.github.com` 均可直连。

## GitHub 抓取：两条通道（2026-11-03 更换）

原先 GitHub Trending 靠**手写正则**解析 HTML——页面一改版就静默失效（不报错，只是少数据，
最坏的那种坏法）。现已换成 Scrapling，正则降级为兜底：

```
fetch_github_trending()
  ├─ 通道 A  scrapling —— 主力
  │    传输：curl 通道（实测稳定 200）
  │    解析：Scrapling Selector，adaptive=True
  │          首次 css(ROW_SELECTOR, auto_save=True) 存元素指纹
  │          改版后选择器失效 → css(ROW_SELECTOR, adaptive=True) 按相似度重定位
  └─ 通道 B  regex —— 兜底
       手写正则。Scrapling 不可用（如系统 python 3.9）或解析不足 5 条时自动启用
```

两条通道输出结构完全一致，切换时下游（渲染/体检）无感知。快照里会记录用了哪条：
`data/<日期>.json → sources.gh.engine`，正常应显示 `scrapling(curl)`。

### 为什么传输和解析要分开

实测：**Scrapling 自带的 fetcher（curl_cffi 指纹伪装）在这台机器上抓 GitHub 会超时**
（连续 3 次 45s 超时），而普通 curl 稳定 200。所以分工——传输用验证过的 curl 通道，
Scrapling 只做它真正擅长的事（解析 + 重定位）。

### venv 是必需的

Scrapling 要求 **Python ≥3.10**，而 `command -v python3` 命中的是 Apple 命令行工具的 3.9，装不了：

```bash
/opt/homebrew/bin/python3.11 -m venv .venv
./.venv/bin/python -m pip install "scrapling[all]" pyyaml
```

> **本机为什么装了 3.11 还要单独开 venv？** 这不是「不肯升级」，两件事得分开看：
>
> 1. `/usr/bin/python3`（3.9.6）是 **macOS Command Line Tools 的系统组件**，root 所有，
>    挂在 Xcode 工具链上。替换或升级它会波及系统工具，Apple 也不建议动。
> 2. Homebrew 已装 `python@3.11`，但 **没有提供 `python3` 这个软链**
>    （`/opt/homebrew/bin/python3` 不存在），所以 `python3` 仍落到 `/usr/bin` 的 3.9。
>    **升级 Homebrew 的 Python 不会让 `python3` 自动变新**，除非手动加软链或改 PATH。
>
> 而且即便将来本机 Python 升到更高版本，本项目**仍应留在 venv 里**：venv 解决的不只是
> 版本，还有**项目间包隔离**（`include-system-site-packages = false`，见 `pyvenv.cfg`）。
> 全局装包会让不同项目互相踩踏。
>
> 结论：**不要改全局 `python3` 软链**。流水线一律显式调用 `./.venv/bin/python`。

`run-daily.sh` 会自动优先使用 `.venv/bin/python`。若 venv 不在，退回系统 python3：
抓取降级为正则解析，而 `lint.py` 会因缺 PyYAML 判 **ERROR**（闸门不会静默失效），
整条流水线以退出码 1 结束——这是刻意的：**能出稿，但不能假装验过了**。

不需要跑 `scrapling install --force` 装浏览器——只用它的解析器，不用浏览器抓取。

### adaptive 指纹库放哪

`adaptive_fingerprints.db`（本目录，即 `reports-tool/adaptive_fingerprints.db`）。Scrapling 默认把它塞在
`site-packages/scrapling/` 里面，**venv 一重建学到的东西就全丢**，所以显式指定到工具目录内。
这个库是跨进程持久化的——今天存指纹，明天新进程照样认得出错位的元素。

### 已知限制

- 行的**子字段**（描述/语言/星数）仍是固定选择器 + 整行文本正则双重兜底，没有逐字段做 adaptive。
  行容器改名这类最常见改版已能扛住（见自测记录）。
- 若 GitHub 换成完全不同的页面结构（不只是改 class），adaptive 也可能失手；
  此时 `note` 字段会提示，且通道 B 仍是最后一道防线。

## 交付格式契约（站点规格）

`content/reports/*.md` 不是给人随便看的笔记，而是**交给站点消费的交付物**。格式由 `render.py` 统一产出，
`lint.py` 逐条机器校验。以后所有报告——包括中午定时任务产出的——都是这个格式，
因为渲染器是唯一的产出路径，而校验卡在渲染之后。

### 文件长相

```markdown
---
title: "AI 与计算机日报 · 2026-11-03（周二）"
slug: "report-2026-11-03"
date: "2026-11-03"
category: "日报"
status: "published"
summary: "今天 6 篇论文里 3 篇围绕 harness，Wave Forcing 把流式视频生成吞吐做到单卡 7.07 倍。"
---

> 面向刚入门的读者：每一条都给你 **一句话结论 + 为什么值得看 + 原文链接**。

## 30 秒看完今天
...
```

硬规则：

| 项 | 要求 |
|---|---|
| 文件名 | `YYYY-MM-DD.md`，一天一个；同一天重跑**直接覆盖**，不生成 `-2` / `-final` 副本 |
| 首行 | 必须是 `---`，**前面不许有任何字符**（连空行都不行） |
| frontmatter | 6 个字段，**顺序固定**：title、slug、date、category、status、summary；不许加 tags/cover/updated 等 |
| 闭合 | 单独一行 `---`，紧跟**一个空行**再进正文 |
| 正文标题 | **不许出现 `# ` 一级标题**——站点把 title 渲染成页面大标题，重复会变两个标题 |
| 正文分节 | `## 30 秒看完今天` / `## 今天的主线` / `## 一、Hugging Face Daily Papers` / `## 二、GitHub Trending` / `## 三、今天顺手学的 3 个概念` / `## 四、今天可以试一下` |
| summary | 一句话，40–80 字，**单行**，写当天最值得记住的结论（不是照抄导语） |
| 编码 | UTF-8、LF、**无 BOM**（`render.py` 用 `newline="\n"` 强制，不随平台变） |
| 禁用 | 裸 HTML（`<div>` `<br>` `<img>`…会被丢）、本地图片引用、`|` / `>` 多行块标量 |
| 链接 | 只用 Markdown 语法；允许 `https://`、`mailto:`；外链由站点自动加 `target="_blank"` |

> **summary 必填：站点规范与工具现在一致。** `content/reports/README.md` 第二节已明确
> summary 必须 40–80 字、单行；`lint.py` 对缺失、超长、原始文件折行一律判 ERROR。
> 早期站点允许省略并回退到截断正文，本项目自 2026-11-03 起改为强制，站点规范随后同步，
> 不再存在「工具比站点更严」的差异。
> 边界行为已实测：39 字 / 81 字 / 缺失 / 原始文件折成两行（即使解析后总长合规）全部拦截，
> 40 字与 80 字放行。

### 三个容易踩的坑（写在这里，省得下次再踩）

1. **`status` 必须是 `published`。** 写成 `draft` 会被站点**静默过滤**——不报错，也看不到。
   这是最危险的一种失败：没有任何反馈信号。
2. **日期加引号。** 裸写的 `date: 2026-11-03` 会被 YAML 解析成 **date 对象**而不是字符串；
   加双引号后无论如何都是字符串。站点规范示例与 `render.py` 现在都统一加引号。
3. **正文末尾不再放裸 `---`。** 水平线本身合法，但某些朴素的前置元数据切分实现会把它
   误当成 frontmatter 的结束标记。数据来源说明照旧保留，内容没减。

### YAML 安全

- 值一律用双引号包住；**引号内部不许出现裸的 ASCII `"`** → `render.py` 的 `yaml_dq()`
  会成对换成中文引号 `「」`，落单的补 `」`；反斜杠先转义成 `\\`。
- 禁止多行字符串语法（`|` 或 `>`）。
- 冒号、井号、问号放在引号内是安全的。

## 自测记录

代码改了要用两个方向验证（正常集 + 异常集），本目录已做过的：

| 测试 | 方法 | 结果 |
|---|---|---|
| 体检能抓出事故版本 | 把英文冒充中文 + 占位符 + 缺字段的旧版本喂给 `lint.py` | 报 11 个 ERROR ✅ |
| 体检不误杀正常版本 | 修正后的解读稿 | 0 ERROR 0 WARN ✅ |
| 快照护栏 | 猴补丁模拟 HF 全灭 + `--force` | 拒绝覆盖，退出码 1，快照完好 ✅ |
| 快照冻结 | 连跑两次 `./run-daily.sh` | 第二次跳过重抓 ✅ |
| 数字一致性 | `lint.py` 核对 `why` 里的星数 vs 快照 | 校正后 0 WARN ✅ |
| **解析通道等价性** | 同一页面，Scrapling vs 正则，逐字段比对 | 15/15 仓库一致，**0 个字段差异** ✅ |
| **改版免疫力（换解析器的理由）** | 把 `class="Box-row"` 改成 `class="FeedCard"` 再解析 | 正则 **0 条**，Scrapling **15 条**全找回 ✅ |
| 改两层也扛住 | 连标题的 `class="h3 lh-condensed"` 一起改掉 | Scrapling 仍 **15 条** ✅ |
| **跨进程持久化** | 进程 A 存指纹 → 全新进程 B 解析变异页面 | B 成功重定位 15 条 ✅ |
| 兜底通道 | 用系统 python 3.9（无 scrapling）跑 | 自动降级 `engine=regex`，15 条 ✅ |
| 端到端 | 临时日期跑 `run-daily.sh` | `engine=scrapling(curl)`，快照正确记录 ✅ |
| **格式自检能抓错（19 项）** | 逐条注入：首行前空行 / status=draft / 少字段 / 多字段 / summary 折行·过短·块标量 / date 不一致 / slug 写错 / title 用斜杠日期 / 正文插 H1 / 裸 HTML / 本地图片 / frontmatter 后无空行 / 删必备分节 / 非法 YAML / CRLF / BOM | **19 项全部拦住** ✅ |
| 格式自检不误杀 | 两天成品报告 | 0 ERROR 0 WARN ✅ |
| **交付闸门（真阳性）** | 把 `render.py` 的 status 改成 `draft` 再跑流水线 | 交付前自检报 ERROR，退出码 1，提示「不要发布」 ✅ |
| **交付闸门（防假警报）** | 手工把报告文件改成 `draft` 再跑流水线 | 渲染修好它，退出码 **0**（不误报） ✅ |
| 标准 YAML 可解析 | 用真 PyYAML（不是肉眼）解析 frontmatter | 6 字段解析成功 ✅ |
| **缺 PyYAML 不再静默降级** | 用系统 python3（无 pyyaml）跑 `lint.py --all` | 每天各报 1 个 **ERROR**，退出码 1 ✅（此前只报 WARN 且退出码 0） |
| 该闸门不误杀正常路径 | venv 内跑 `--all` 与 `run-daily.sh 2026-11-03` | 0 ERROR 0 WARN，退出码 0 ✅ |
| **开销行自动取数** | `usage.py --date 2026-11-04 --auto` 对着真实会话日志跑 | 取到第 11 轮：690.5s / in 4,332,648 / out 12,628 / 25 次调用 ✅ |
| 开销行渲染各分支 | 喂 `cost_line()` 五种输入（全字段/秒级/仅耗时/无耗时/空） | 各分支输出正确，空对象返回空串 ✅ |
| 历史日报不留假数字 | 重渲染 2026-11-02（快照无 `cost`） | 不显示开销行，文件与之前逐字节一致 ✅ |
| **并发锁：正常路径** | `./run-daily.sh 2026-11-04` | 退出码 0，锁目录自动消失 ✅ |
| **并发锁：拒绝并发** | 手动 `.run-daily.lock/` 后启动第二个实例 | 拒绝并明示「什么都没做」，退出码 0 ✅ |
| **并发锁：僵尸自愈** | 锁里写不存在的 pid 99999999 后运行 | 检测后清理并继续，出稿成功 ✅ |
| **并发锁：SIGTERM** | 运行中点杀 | `trap` 触发，锁清理干净 ✅ |
| **并发锁：SIGKILL** | `kill -9`（trap 无法捕获） | 锁泄漏，但**下次运行检测 pid 已死后自愈** ✅ |
| subagent 隔离性 | 派 fresh `subagent` 跑简单任务 | `delegationDepth=1`、`isSeeded=false`；首调用 input 仅 19,351（对比长会话 15.9 万）✅ |
| **subagent 不可中断** | 让它跑 300s 循环，中途试 `interrupt_agent` 与 `send_message` | 两者都报 `active teammate not found`，**循环跑满 300 tick** ✅（能启动、不能停） |

### 迁移到站点仓库后的验证（2026-11-03）

| 测试 | 方法 | 结果 |
|---|---|---|
| 工作区写权限 | 不显式提权，直接 `touch content/reports/.probe` | 通过 ✅（旧工作区此处 `Operation not permitted`） |
| 输出目录定位 | `python -c 'import render; print(render.REPORTS)'` | 解析到 `WUYUWeb/content/reports`，`_OUT_WHERE=site` ✅ |
| **不回退（目录缺失）** | `REPORT_OUT_DIR=/nonexistent/xyz render.py` | 报错退出，退出码 1，**不写本地** ✅ |
| **不回退（目录不可写）** | `REPORT_OUT_DIR=/var/root/nope render.py` | 报错退出，退出码 1，**不写本地** ✅ |
| 重渲染字节一致 | 用同一快照重渲 11-03，与已验收样本 `diff` | 仅页脚目录名 1 行不同（预期改动）✅ |
| 历史报告回归 | `lint.py --all`（两天，文件在站点目录） | 0 ERROR 0 WARN ✅ |
| 端到端（含抓取） | `FORCE=1 ./run-daily.sh <临时日>` | 抓到 41 论文 / 13 仓库，落到站点目录 ✅ |
| 端到端（正常路径） | `./run-daily.sh 2026-11-03`（快照已存在） | 冻结快照、渲染、自检通过、**退出码 0** ✅ |
| 闸门真阳性（迁移后） | 临时日缺解读稿 | 5 个 ERROR，`run-daily.sh` **退出码 1**，且不再打印 `OK:` ✅ |
| 测试产物清理 | 删掉临时日的 data / 报告 | 只余 11-02、11-03 两天 ✅ |

> 迁移时删掉临时日的 `data/YYYY-MM-DD.json` 是**必须**的：留着它会被快照冻结逻辑判定为「完好快照」，
> 第二天中午的定时任务会跳过真实抓取，直接拿测试数据写日报。测试后务必清理。

> 格式自检的注入测试里曾漏掉一项：**summary 被折成两行**。原因是 YAML 允许双引号内折行，
> 解析出来仍是单行，只看解析结果看不见；续行甚至可以顶格写，只判断缩进也会漏。
> 改成检查「这一行有没有以引号收尾」后才抓住。

## 报告是怎么「小白友好」的

`render.py` 只负责排版，**真正的解读在 `insights/*.json`**：

| 字段 | 作用 |
|---|---|
| `summary` | 一句话结论，40–80 字、单行，**进 frontmatter**（必填，不填自检直接 ERROR） |
| `tldr` | 30 秒看完今天（3 条） |
| `theme` | 把当天热榜归纳成 3 条趋势主线 |
| `papers[id].plain/why/analogy/readme` | 说人话 / 为什么值得看 / 打个比方 / 小白提醒 |
| `repos[name].plain/why/for_who` | 这是个啥 / 为什么今天火 / 适合谁 |
| `concepts` | 3 个当天出现的术语，大白话解释 |
| `try` | 今天可以动手试的 2–3 件事 |

速览区（前 6 名之外）**也要求给 `plain`**，否则会显示英文摘要 + `[EN]` 标记。

如果整份 `insights` 缺失，`render.py` 会自动降级：用 HF 官方 AI 摘要和仓库 description 填空，
报告仍能生成，但精读区会全部标成「原文摘要」，且自检会报「summary 缺失」。
