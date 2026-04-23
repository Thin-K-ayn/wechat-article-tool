---
name: wechat-article-tool
description: Use this skill when working inside a cloned wechat-article-tool repository to draft WeChat Official Account articles, render WeChat-friendly previews, and upload drafts through the WeChat API. Prefer render/upload for agent-authored Markdown; use generate/run only when the CLI itself should call an external LLM.
---

# WeChat Article Tool

Use this skill when the current workspace is the `wechat-article-tool` repo or an equivalent clone.

This skill is for practical execution inside the repo, not generic WeChat advice.

## Use it for

- writing or editing article Markdown under `articles/`
- rendering a WeChat-friendly HTML preview
- uploading inline images and cover images through the official API
- creating a WeChat draft for manual publish later

## Default workflow

1. write or edit the article Markdown in `./articles/`
2. render a preview:
   - `npm run tool -- render --file ./articles/<file>.md`
3. upload the article into the WeChat draft box:
   - `npm run tool -- upload --file ./articles/<file>.md`
4. tell the user to publish manually from the WeChat mobile or backend interface

If the work is part of a series plan under `./plans/` and the user later confirms the article was published successfully, update the corresponding series plan file immediately so publish status is recorded there as the source of truth.

## Two operating modes

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

## Required environment for upload

To upload drafts, the environment still needs:

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- the current machine's public IP added to the WeChat API whitelist

If the whitelist is missing, expect errors like:

```text
invalid ip ... not in whitelist
```

## Safe defaults

When operating as a coding agent in this repo, prefer:

- `render` when the user wants a preview
- `upload` when the user wants a WeChat draft
- `generate` or `run` only when the user explicitly wants the CLI to call an LLM

## Working files

- article Markdown: `./articles/`
- preview output: `./dist/`
- main CLI: `./src/cli.js`
- config example: `./.env.example`

## Publishing rule

This repo currently creates drafts through the WeChat API.

Final publish is still manual:

- WeChat mobile app
- or WeChat backend interface
