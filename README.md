# WeChat Article Tool

一个本地命令行工具，用来把 `选题 -> AI 写稿 -> Markdown 转公众号 HTML -> API 推送草稿箱` 串成一条流水线。

当前版本只保留一条通道：

- `API`：调用公众号官方接口上传图片、创建草稿，再由你在手机端或公众号后台手动发布。

## 官方接口限制

微信官方文档当前写明：`2025 年 7 月起`，个人主体账号、企业主体未认证账号及不支持认证的账号会被回收发布相关接口权限。

这意味着当前最稳的做法是：

- 用 `API` 完成上传图片和创建草稿
- 再由你在手机端或公众号后台手动发布

官方文档：

- [草稿箱](https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html)
- [发布能力](https://developers.weixin.qq.com/doc/offiaccount/Publish/Publish.html)
- [上传图文图片](https://developers.weixin.qq.com/doc/service/api/material/permanent/api_uploadimage)

## 安装

```bash
cd wechat-article-tool
npm install
cp .env.example .env
```

项目内已经附带 `.npmrc`，会优先使用 `npmmirror`，在当前网络环境里更稳定。

## Markdown 文章格式

文章文件使用 YAML frontmatter + Markdown 正文：

```md
---
title: 用 AI 帮你自动化写公众号
author: Kayn
digest: 一篇介绍 AI 写作、配图与公众号自动上传流程的实战文章。
coverImage: ../assets/cover.png
contentSourceUrl: https://example.com
openComment: false
fansOnlyComment: false
---

## 为什么要做这件事

正文写 Markdown 即可，正文中的本地图片会在 API 模式下自动上传到微信并替换为微信图片地址。

![流程图](../assets/workflow.png)
```

## 常用命令

生成文章：

```bash
npm run tool -- generate \
  --topic "用 AI 搭建公众号自动写作流程" \
  --audience "独立开发者" \
  --style "专业但不端着，适合公众号阅读" \
  --output ./articles/ai-wechat.md
```

上传到草稿箱：

```bash
npm run tool -- upload --file ./articles/ai-wechat.md
```

生成并直接上传：

```bash
npm run tool -- run \
  --topic "用 AI 搭建公众号自动写作流程" \
  --audience "独立开发者" \
  --style "专业但不端着，适合公众号阅读" \
  --cover ../assets/cover.png \
  --output ./articles/ai-wechat.md
```

## API 模式需要的配置

在 `.env` 中设置：

```bash
LLM_API_KEY=...
LLM_MODEL=...
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
WECHAT_DEFAULT_AUTHOR=你的公众号作者名
```

注意：

- 正文图片会走 `media/uploadimg`
- 封面图会走 `material/add_material?type=image`
- 封面图建议使用 `jpg/png`
- 正文图片建议控制在 `1MB` 以内，更符合微信官方限制
- 服务器出口 IP 必须先加到公众号 `IP 白名单`
- 当前工作流默认只创建草稿，不直接通过 API 发布

如果你想提前把一批本地 `svg` 结构图转成紧贴内容的 `png`，可以直接运行：

```bash
npm run rasterize:svg -- ./assets/a.svg ./assets/b.svg
```

## 输出文件

每次上传前，工具都会额外生成一个调试用 HTML：

- `./dist/<slug>.wechat.html`

这个文件方便你先本地预览排版，再决定是否上传。
