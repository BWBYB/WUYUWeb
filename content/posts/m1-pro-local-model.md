---
title: M1 Pro 跑本地模型，意外地好用
slug: m1-pro-local-model
legacyId: 3
date: 2026-09-28
updated: 2026-09-28
summary: 一直想试试在本地跑大语言模型，趁着周末折腾了一下 Ollama，没想到 M1 Pro 的表现还不错。
category: 技术
tags:
  - 技术
  - 本地模型
  - M1 Pro
cover:
status: published
---
一直想试试在本地跑大语言模型，趁着周末折腾了一下。

## 环境

MacBook Pro M1 Pro, 16GB 内存。说实话，这个配置跑大模型有点勉强，但小模型应该没问题。

## 安装过程

用了 Ollama，一行命令就装好了：

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

然后拉了一个 7B 参数的模型：

```bash
ollama run llama3
```

## 体验

速度比我预想的快。大概每秒能生成 20 多个 token，虽然比不上云端，但完全够用了。

试了几个任务：
- 帮我改简历：能用，但需要多给一些上下文
- 写代码注释： surprisingly good
- 聊天：有时候会跑题，但大部分时候还行

## 感受

本地跑模型有一种特别的踏实感。不用担心 API 额度，不用担心网络，不用担心隐私。

M1 Pro 的 MPS 加速确实有用，比纯 CPU 快了不少。

下一步想试试微调一个小模型，专门用来处理我的学习笔记。
