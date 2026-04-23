# AGENTS

This repository is designed to be used directly by coding agents such as Codex and Claude Code.

## What This Repo Is

`wechat-article-tool` is a workflow utility for:

- writing or editing article Markdown
- rendering WeChat-friendly HTML previews
- uploading images through the WeChat Official Account API
- creating WeChat drafts

It is **not** a self-contained AI application that must always call its own model.

## Recommended Agent Workflow

In the most common setup:

1. The coding agent writes or edits Markdown in `./articles/`
2. The agent renders a local preview
3. The agent uploads the article to the WeChat draft box
4. The human publishes manually in the WeChat mobile or backend interface

## Important Distinction

Two different modes exist:

### 1. Agent-authored mode

The coding agent writes the article directly.

Use:

```bash
npm run tool -- render --file ./articles/<file>.md
npm run tool -- upload --file ./articles/<file>.md
```

This mode does **not** require `LLM_API_KEY`.

### 2. CLI-generated mode

The CLI itself calls an external LLM to draft the article.

Use:

```bash
npm run tool -- generate ...
npm run tool -- run ...
```

This mode **does** require:

- `LLM_API_KEY`
- `LLM_MODEL`

## Required Environment for Uploading

To upload drafts, the repo still needs:

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- the current machine's public IP added to the WeChat API whitelist

## Where To Work

- Article Markdown: `./articles/`
- Preview HTML output: `./dist/`
- Main CLI: `./src/cli.js`
- Example env file: `./.env.example`

## Safe Defaults

If you are a coding agent operating in this repo, prefer:

- `render` when the user wants to preview
- `upload` when the user wants a WeChat draft
- `generate` or `run` only when the user explicitly wants the CLI to call an LLM
