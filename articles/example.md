---
title: "用 AI 搭建微信公众号自动写作流水线"
author: "Kayn"
digest: "从选题、写稿、排版到上传草稿，一次性把公众号发布流程串起来。"
coverImage: "../assets/cover.png"
contentSourceUrl: ""
openComment: false
fansOnlyComment: false
---

## 为什么值得自动化

很多公众号内容并不是“不会写”，而是流程太碎：找资料、定角度、排版、处理图片、登录后台、保存草稿。只要中间任何一步要重复，人就会本能地拖延。

把这个流程拆开看，其实最适合自动化的是三部分：

1. 先用 AI 生成带 frontmatter 的 Markdown 初稿。
2. 再把 Markdown 转成适合公众号的 HTML。
3. 最后调用官方接口或者后台自动化，把内容送进草稿箱。

## 这个工具做了什么

这套脚本把公众号写作最容易卡住的环节都包起来了：

- 生成文章时，直接输出可发布的 Markdown 结构。
- 上传时，正文图片会替换成微信可识别的图片地址。
- API 模式下可以直接创建草稿，再由手机后台手动发布。

## 你接下来怎么用

先把 `.env.example` 复制成 `.env`，填好大模型和公众号配置，再执行：

```bash
npm run tool -- upload --file ./articles/example.md
```
