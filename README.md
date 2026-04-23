# WeChat Article Tool

一个本地命令行工具，用来把 `选题 -> AI 写稿 -> Markdown 转公众号 HTML -> API 推送草稿箱` 串成一条流水线。

## 给 Coding Agent 的说明

这个仓库不是一个“自己带模型运行”的独立 AI 产品，它更像一个给 `Codex`、`Claude Code` 等 coding agent 直接调用的工作流工具。

推荐理解方式：

- `agent` 负责写文章、改文章、整理 Markdown
- `wechat-article-tool` 负责渲染预览、上传图片、创建公众号草稿
- 最终发布动作由你在微信手机端或后台手动完成

这意味着：

- 如果文章内容由 coding agent 直接写出来，你 **不需要** 额外配置 `LLM_API_KEY` 才能使用 `render` 和 `upload`
- 只有当你想让这个 CLI 自己调用模型来生成文章时，才需要配置 `LLM_API_KEY` 并使用 `generate` / `run`

## Repo 内置的 Agent Guidance 在哪里

这个仓库现在有三层 agent 说明：

- `README.md`
  - 给人类读者看的总入口
- `AGENTS.md`
  - 给通用 coding agent 的仓库级说明
- `CLAUDE.md`
  - 给 Claude Code 的专门说明
- `skills/wechat-article-tool/SKILL.md`
  - 给 Codex 风格 skill 系统使用的 repo 内置 skill

### 重要：clone repo 不等于自动启用 skill

团队成员把 repo clone 下来之后：

- `AGENTS.md` / `CLAUDE.md` 往往会被 agent 直接读到
- 但 `SKILL.md` 通常不会因为仓库存在就自动安装到全局 skill 系统

也就是说：

- 对 `Claude Code` 来说，这个 repo 现在已经有比较明确的仓库级说明
- 对 `Codex` 来说，如果想把它当成一个真正可触发的 skill，通常还需要把 `skills/wechat-article-tool/` 安装到 Codex 的 skills 目录里

### 给 Codex 用户的两种使用方式

#### 方式 1：直接在 repo 里工作

让 Codex 直接打开这个仓库，然后按仓库说明使用：

- 读 `README.md`
- 读 `AGENTS.md`
- 在需要时参考 `skills/wechat-article-tool/SKILL.md`

这种方式已经能工作，只是它更像“repo guidance”，不一定是“全局已安装 skill”。

#### 方式 2：把 repo 内置 skill 安装成全局 skill

把这个目录复制到 Codex 的 skills 目录：

```bash
mkdir -p ~/.codex/skills
cp -R ./skills/wechat-article-tool ~/.codex/skills/
```

安装后，Codex 在合适场景下就更容易把它当成一个正式 skill 触发。

如果你的团队已经在用 Codex 的 skill installer，也可以把这个 repo 作为 skill 源来安装。

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

## 适合谁用

适合：

- 已经有公众号，并且能拿到 `AppID` / `AppSecret`
- 希望用 Markdown 管理文章
- 希望通过 API 自动上传草稿，而不是每次手动进后台复制粘贴
- 希望让 `Codex`、`Claude Code` 这类 coding agent 直接参与写稿和上传流程

不适合：

- 想完全自动发布，但账号没有发布接口权限
- 没有能力配置公众号 API 白名单

## 你需要准备什么

- 一个已开通开发配置的微信公众号
- 公众号的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`
- 一台可以访问公众号 API 的机器
- 这台机器的公网出口 IP，并将它加入公众号后台 `IP 白名单`
- 如果要让 CLI 自己自动生成文章，还需要一个兼容 OpenAI API 的 `LLM_API_KEY`

## 安装

```bash
git clone git@github.com:Thin-K-ayn/wechat-article-tool.git
cd wechat-article-tool
npm install
cp .env.example .env
```

项目内已经附带 `.npmrc`，会优先使用 `npmmirror`，在当前网络环境里更稳定。

## 配置

把 [`.env.example`](./.env.example) 复制成 `.env` 后，至少要填这几项：

```bash
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
WECHAT_DEFAULT_AUTHOR=你的公众号作者名
```

如果你要用 AI 帮你起草文章，再补上：

```bash
LLM_API_KEY=...
LLM_MODEL=gpt-5.4-mini
```

如果你是把这个仓库交给 coding agent 使用，通常有两种模式：

### 模式 1：Agent 直接写文章

这种模式下：

- agent 直接创建或修改 `./articles/*.md`
- 你只需要配置公众号相关变量
- 然后使用：

```bash
npm run tool -- render --file ./articles/your-article.md
npm run tool -- upload --file ./articles/your-article.md
```

这种模式 **不需要** `LLM_API_KEY`。

### 模式 2：CLI 自己调用模型生成文章

这种模式下：

- 你需要配置 `LLM_API_KEY` 和 `LLM_MODEL`
- 然后使用：

```bash
npm run tool -- generate ...
npm run tool -- run ...
```

## 对 Agent 最重要的使用结论

如果你是 coding agent，在这个 repo 里优先按下面这条规则工作：

- 用户要你写或改文章：直接改 `./articles/*.md`
- 用户要预览：运行 `npm run tool -- render --file ...`
- 用户要推草稿：运行 `npm run tool -- upload --file ...`
- 只有当用户明确要求“让 CLI 自己调用模型生成文章”时，才用 `generate` 或 `run`

## 第一次使用前必须做的事

### 1. 把服务器出口 IP 加入公众号白名单

在微信公众平台后台：

- `设置与开发`
- `基本配置`
- `IP 白名单`

把当前机器的公网出口 IP 加进去。  
如果这一步没做，调用 API 时会看到：

```text
invalid ip ... not in whitelist
```

### 2. 先确认命令能跑起来

```bash
npm run check
```

### 3. 建议先用示例文章跑通一次

```bash
npm run tool -- render --file ./articles/example.md
npm run tool -- upload --file ./articles/example.md
```

如果上传成功，终端会输出一条 `media_id`。  
这说明文章已经进入公众号草稿箱，你可以在微信手机端或公众号后台手动发布。

## 如何使用

这套工具当前最推荐的工作流是：

1. 写 Markdown 文章
2. 本地预览 HTML
3. 用 API 推送到公众号草稿箱
4. 在微信手机端或公众号后台手动发布

### 方式 1：自己写文章，再上传草稿

```bash
npm run tool -- render --file ./articles/example.md
npm run tool -- upload --file ./articles/example.md
```

### 方式 2：让 AI 先生成，再上传草稿

```bash
npm run tool -- run \
  --topic "用 AI 搭建公众号自动写作流程" \
  --audience "独立开发者" \
  --style "专业但不端着，适合公众号阅读" \
  --cover ./assets/cover.png \
  --output ./articles/ai-wechat.md
```

### 方式 3：只生成，不上传

```bash
npm run tool -- generate \
  --topic "用 AI 搭建公众号自动写作流程" \
  --audience "独立开发者" \
  --style "专业但不端着，适合公众号阅读" \
  --output ./articles/ai-wechat.md
```

## 一次完整示例

```bash
# 1. 生成一篇文章
npm run tool -- generate \
  --topic "为什么 AI Agent 不能一上来就多智能体" \
  --audience "AI 从业者" \
  --style "清楚、克制、适合公众号阅读" \
  --output ./articles/agent.md

# 2. 本地渲染预览
npm run tool -- render --file ./articles/agent.md

# 3. 推到公众号草稿箱
npm run tool -- upload --file ./articles/agent.md
```

完成后：

- 到微信手机端找到这篇草稿
- 检查封面、摘要、图片、排版
- 手动点击发布

## 可选：安装成全局命令

如果你不想每次都写 `npm run tool --`，可以在仓库目录里执行：

```bash
npm link
wechat-article-tool --help
```

这样之后就可以直接运行：

```bash
wechat-article-tool render --file ./articles/example.md
wechat-article-tool upload --file ./articles/example.md
```

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

## 常见问题

### 1. 为什么上传时报 `invalid ip ... not in whitelist`

说明当前机器的公网出口 IP 还没加入公众号后台白名单。

### 2. 为什么能建草稿，但不能 API 直接发布

很多账号没有发布接口权限。  
这个仓库当前默认只做：

- 上传图片
- 创建草稿

最后发布动作仍然建议在微信手机端或后台手动完成。

### 3. 为什么文章图片上传后显示异常

建议：

- 封面图使用 `jpg/png`
- 正文图尽量控制在 `1MB` 以内
- 结构图优先先转成 `png`

### 4. 哪个文件是给别人复制配置用的

- [`.env.example`](./.env.example)
