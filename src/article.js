import matter from 'gray-matter';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadArticleDocument(filePath, runtimeConfig) {
  const absolutePath = path.resolve(runtimeConfig.cwd, filePath);
  const raw = await readFile(absolutePath, 'utf8');
  const parsed = matter(raw);

  if (!parsed.data.title) {
    throw new Error(`Article is missing frontmatter field "title": ${absolutePath}`);
  }

  const body = stripLeadingTitle(parsed.content, parsed.data.title).trim();
  if (!body) {
    throw new Error(`Article body is empty: ${absolutePath}`);
  }

  const title = String(parsed.data.title).trim();
  const digest = String(parsed.data.digest || '').trim() || makeDigest(body);
  const author =
    String(parsed.data.author || '').trim() || runtimeConfig.wechat.defaultAuthor;
  const contentSourceUrl =
    String(parsed.data.contentSourceUrl || '').trim() ||
    runtimeConfig.wechat.defaultContentSourceUrl;
  const slug =
    String(parsed.data.slug || '').trim() ||
    slugify(path.basename(absolutePath, path.extname(absolutePath)) || title);

  return {
    absolutePath,
    baseDir: path.dirname(absolutePath),
    raw,
    markdown: body,
    meta: {
      title,
      digest,
      author,
      contentSourceUrl,
      coverImage: parsed.data.coverImage ? String(parsed.data.coverImage).trim() : '',
      coverMediaId: parsed.data.coverMediaId ? String(parsed.data.coverMediaId).trim() : '',
      openComment: normalizeBoolean(parsed.data.openComment, false),
      fansOnlyComment: normalizeBoolean(parsed.data.fansOnlyComment, false),
      slug,
    },
  };
}

export async function writeArticleDocument(filePath, content) {
  await ensureParentDir(filePath);
  await writeFile(filePath, content, 'utf8');
}

export function buildArticleFrontmatter({
  title,
  author = '',
  digest = '',
  coverImage = '',
  contentSourceUrl = '',
  openComment = false,
  fansOnlyComment = false,
}) {
  const lines = [
    '---',
    `title: ${escapeYamlScalar(title)}`,
    `author: ${escapeYamlScalar(author)}`,
    `digest: ${escapeYamlScalar(digest)}`,
    `coverImage: ${escapeYamlScalar(coverImage)}`,
    `contentSourceUrl: ${escapeYamlScalar(contentSourceUrl)}`,
    `openComment: ${openComment ? 'true' : 'false'}`,
    `fansOnlyComment: ${fansOnlyComment ? 'true' : 'false'}`,
    '---',
    '',
  ];

  return lines.join('\n');
}

export function makeDefaultArticlePath(cwd, title) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugify(title || 'wechat-article');
  return path.resolve(cwd, 'articles', `${date}-${slug}.md`);
}

export function extractMarkdownImageRefs(markdown) {
  const refs = new Set();
  const regex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  let match = regex.exec(markdown);
  while (match) {
    refs.add(match[1]);
    match = regex.exec(markdown);
  }

  return [...refs];
}

export function replaceMarkdownImageRefs(markdown, replacementMap) {
  return markdown.replace(
    /(!\[[^\]]*]\()([^) \t]+)((?:\s+"[^"]*")?\))/g,
    (fullMatch, prefix, originalRef, suffix) =>
      replacementMap.get(originalRef) ? `${prefix}${replacementMap.get(originalRef)}${suffix}` : fullMatch,
  );
}

export function replaceMarkdownImagesWithPlaceholders(markdown, markerFactory = defaultImageMarker) {
  const images = [];
  let index = 0;

  const withPlaceholders = markdown.replace(
    /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_fullMatch, altText, ref) => {
      index += 1;
      const marker = markerFactory(index, { altText, ref });
      images.push({ marker, altText, ref, index });
      return `\n\n${marker}\n\n`;
    },
  );

  return {
    markdown: withPlaceholders,
    images,
  };
}

export function resolveAssetPath(ref, articleDir) {
  if (/^https?:\/\//i.test(ref)) {
    return ref;
  }

  return path.isAbsolute(ref) ? ref : path.resolve(articleDir, ref);
}

export async function writeHtmlPreview(cwd, slug, html) {
  const outputPath = path.resolve(cwd, 'dist', `${slug}.wechat.html`);
  await ensureParentDir(outputPath);
  await writeFile(outputPath, html, 'utf8');
  return outputPath;
}

export function makeDigest(markdownText) {
  const plainText = markdownToPlainText(markdownText);
  return plainText.slice(0, 120);
}

export function markdownToPlainText(markdownText) {
  return markdownText
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+]\(([^)]+)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'wechat-article';
}

async function ensureParentDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function stripLeadingTitle(markdown, title) {
  const escapedTitle = escapeRegExp(String(title).trim());
  return markdown.replace(new RegExp(`^#\\s+${escapedTitle}\\s*\\n+`, 'i'), '');
}

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value == null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function escapeYamlScalar(value) {
  const safeValue = String(value || '').replace(/"/g, '\\"');
  return `"${safeValue}"`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function defaultImageMarker(index) {
  return `WXIMAGE${index}TOKEN`;
}
