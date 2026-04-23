# CLAUDE

This repository is intended to be directly usable by coding agents.

## Core Idea

`wechat-article-tool` is a WeChat article workflow utility, not a standalone AI app.

In most cases, Claude Code should:

1. write or edit Markdown articles in `./articles/`
2. render previews with:

```bash
npm run tool -- render --file ./articles/<file>.md
```

3. upload drafts with:

```bash
npm run tool -- upload --file ./articles/<file>.md
```

4. let the human publish manually in the WeChat mobile or backend interface

## When an LLM Key Is Needed

Only the CLI commands below require external LLM credentials:

- `generate`
- `run`

If Claude Code is writing the article content directly, you do **not** need `LLM_API_KEY` to use the repo for previewing and draft upload.

## Required WeChat Config

To upload drafts, the environment still needs:

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- the current machine IP whitelisted in the WeChat Official Account backend

For more detail, see `README.md` and `AGENTS.md`.
