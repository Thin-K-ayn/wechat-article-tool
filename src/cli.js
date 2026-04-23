#!/usr/bin/env node

import { Command } from 'commander';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  extractMarkdownImageRefs,
  loadArticleDocument,
  makeDefaultArticlePath,
  replaceMarkdownImageRefs,
  writeArticleDocument,
  writeHtmlPreview,
} from './article.js';
import { loadRuntimeConfig } from './config.js';
import { generateArticleMarkdown } from './llm.js';
import { renderMarkdownToWechatHtml } from './markdown.js';
import {
  fetchAccessToken,
  uploadArticleViaApi,
  uploadInlineImages,
} from './wechat-api.js';

const program = new Command();
const runtimeConfig = loadRuntimeConfig();

program
  .name('wechat-article-tool')
  .description('Write, format, and upload WeChat Official Account drafts through the official API.')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate a new Markdown article with YAML frontmatter.')
  .requiredOption('--topic <topic>', 'Article topic')
  .option('--angle <angle>', 'Specific angle or framing')
  .option('--audience <audience>', 'Target audience')
  .option('--style <style>', 'Writing style')
  .option('--keywords <keywords>', 'Comma-separated keywords')
  .option('--title-hint <titleHint>', 'Optional title hint')
  .option('--notes <file>', 'Optional local notes file to inject into the prompt')
  .option('--cover <coverImage>', 'Cover image path to write into frontmatter')
  .option('--output <output>', 'Output Markdown file path')
  .action(async (options) => {
    const notes = options.notes
      ? await readFile(path.resolve(runtimeConfig.cwd, options.notes), 'utf8')
      : '';
    const outputPath = options.output
      ? path.resolve(runtimeConfig.cwd, options.output)
      : makeDefaultArticlePath(runtimeConfig.cwd, options.topic);

    const content = await generateArticleMarkdown({
      runtimeConfig,
      topic: options.topic,
      angle: options.angle,
      audience: options.audience,
      style: options.style,
      keywords: options.keywords,
      notes,
      titleHint: options.titleHint,
      coverImage: options.cover,
    });

    const finalContent = options.cover
      ? injectCoverIntoGeneratedFrontmatter(content, options.cover)
      : content;

    await writeArticleDocument(outputPath, finalContent);
    console.log(`Generated article: ${outputPath}`);
  });

program
  .command('render')
  .description('Render a Markdown article into WeChat-friendly HTML.')
  .requiredOption('--file <file>', 'Article Markdown file')
  .action(async (options) => {
    const article = await loadArticleDocument(options.file, runtimeConfig);
    const html = renderMarkdownToWechatHtml(article.markdown);
    const htmlPath = await writeHtmlPreview(runtimeConfig.cwd, article.meta.slug, html);
    console.log(`Rendered HTML preview: ${htmlPath}`);
  });

program
  .command('upload')
  .description('Create a WeChat draft through the official API.')
  .requiredOption('--file <file>', 'Article Markdown file')
  .action(async (options) => {
    await uploadFlow({
      file: options.file,
    });
  });

program
  .command('run')
  .description('Generate a new article and create a WeChat draft through the official API.')
  .requiredOption('--topic <topic>', 'Article topic')
  .option('--angle <angle>', 'Specific angle or framing')
  .option('--audience <audience>', 'Target audience')
  .option('--style <style>', 'Writing style')
  .option('--keywords <keywords>', 'Comma-separated keywords')
  .option('--title-hint <titleHint>', 'Optional title hint')
  .option('--notes <file>', 'Optional local notes file to inject into the prompt')
  .option('--cover <coverImage>', 'Cover image path written into the frontmatter')
  .option('--output <output>', 'Output Markdown file path')
  .action(async (options) => {
    const notes = options.notes
      ? await readFile(path.resolve(runtimeConfig.cwd, options.notes), 'utf8')
      : '';

    const outputPath = options.output
      ? path.resolve(runtimeConfig.cwd, options.output)
      : makeDefaultArticlePath(runtimeConfig.cwd, options.topic);

    const generatedContent = await generateArticleMarkdown({
      runtimeConfig,
      topic: options.topic,
      angle: options.angle,
      audience: options.audience,
      style: options.style,
      keywords: options.keywords,
      notes,
      titleHint: options.titleHint,
      coverImage: options.cover,
    });

    const finalContent = options.cover
      ? injectCoverIntoGeneratedFrontmatter(generatedContent, options.cover)
      : generatedContent;

    await writeArticleDocument(outputPath, finalContent);
    console.log(`Generated article: ${outputPath}`);

    await uploadFlow({
      file: outputPath,
    });
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

async function uploadFlow({ file }) {
  const article = await loadArticleDocument(file, runtimeConfig);
  const imageRefs = extractMarkdownImageRefs(article.markdown);

  let preparedMarkdown = article.markdown;
  if (imageRefs.length > 0) {
    const accessToken = await fetchAccessToken(
      runtimeConfig.wechat.appId,
      runtimeConfig.wechat.appSecret,
    );
    const replacementMap = await uploadInlineImages(accessToken, article, imageRefs);
    preparedMarkdown = replaceMarkdownImageRefs(article.markdown, replacementMap);
  }

  const html = renderMarkdownToWechatHtml(preparedMarkdown);
  const htmlPreviewPath = await writeHtmlPreview(runtimeConfig.cwd, article.meta.slug, html);
  console.log(`HTML preview: ${htmlPreviewPath}`);

  const uploadResult = await uploadArticleViaApi({
    runtimeConfig,
    article,
    html,
    imageRefs,
    accessToken: '',
  });

  console.log(`Draft created. media_id=${uploadResult.draft.media_id}`);
  console.log('Publish this draft manually from the WeChat mobile/backend interface.');
}

function injectCoverIntoGeneratedFrontmatter(generatedMarkdown, coverImage) {
  if (!generatedMarkdown.startsWith('---')) {
    return generatedMarkdown;
  }

  const frontmatterEnd = generatedMarkdown.indexOf('\n---', 3);
  if (frontmatterEnd === -1) {
    return generatedMarkdown;
  }

  const frontmatter = generatedMarkdown.slice(0, frontmatterEnd + 4);
  const body = generatedMarkdown.slice(frontmatterEnd + 4);

  if (/^coverImage:/m.test(frontmatter)) {
    return generatedMarkdown.replace(/^coverImage:.*$/m, `coverImage: ${coverImage}`);
  }

  const injected = `${frontmatter.slice(0, -4)}coverImage: ${coverImage}\n---`;
  return `${injected}${body}`;
}
