import { marked } from 'marked';
import { parse } from 'node-html-parser';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const TAG_STYLES = {
  article: 'font-size:16px;line-height:1.8;color:#222;word-break:break-word;',
  p: 'margin:16px 0;color:#222;line-height:1.85;text-align:justify;',
  listParagraph:
    'margin:12px 0;color:#222;line-height:1.85;text-align:left;padding-left:1.4em;text-indent:-1.4em;',
  h1: 'margin:28px 0 16px;font-size:30px;line-height:1.3;font-weight:700;color:#111;',
  h2: 'margin:30px 0 14px;padding-left:12px;border-left:4px solid #07c160;font-size:24px;line-height:1.4;font-weight:700;color:#111;',
  h3: 'margin:24px 0 12px;font-size:20px;line-height:1.5;font-weight:700;color:#111;',
  h4: 'margin:20px 0 10px;font-size:18px;line-height:1.5;font-weight:700;color:#111;',
  ul: 'margin:14px 0 14px 1.4em;padding:0;',
  ol: 'margin:14px 0 14px 1.4em;padding:0;',
  li: 'margin:8px 0;line-height:1.8;color:#222;',
  blockquote:
    'margin:18px 0;padding:12px 16px;background:#f7f8fa;border-left:4px solid #07c160;color:#4a4a4a;',
  a: 'color:#1f7ae0;text-decoration:underline;',
  strong: 'font-weight:700;color:#111;',
  em: 'font-style:italic;color:#444;',
  hr: 'border:none;border-top:1px solid #e5e7eb;margin:28px 0;',
  table: 'width:100%;margin:18px 0;border-collapse:collapse;font-size:14px;',
  thead: 'background:#f5f7fa;',
  th: 'padding:10px;border:1px solid #dcdfe6;text-align:left;font-weight:700;',
  td: 'padding:10px;border:1px solid #dcdfe6;text-align:left;',
  pre: 'margin:16px 0;padding:14px 16px;border-radius:8px;background:#111827;color:#f9fafb;overflow-x:auto;font-size:13px;line-height:1.7;',
  code: 'padding:2px 6px;border-radius:4px;background:#f3f4f6;color:#c7254e;font-family:Menlo,Monaco,Consolas,monospace;font-size:0.92em;',
  img: 'display:block;max-width:100%;height:auto;margin:20px auto;border-radius:8px;',
  figure: 'margin:20px 0;text-align:center;',
  figcaption: 'margin-top:8px;font-size:13px;color:#666;text-align:center;',
};

export function renderMarkdownToWechatHtml(markdown) {
  const html = marked.parse(normalizeWechatLists(markdown));
  const root = parse(`<article>${html}</article>`);
  const article = root.querySelector('article');

  if (!article) {
    return html;
  }

  applyStyles(article);
  unwrapImageParagraphs(article);
  fixInlineCode(article);
  return article.toString();
}

function applyStyles(node) {
  if (!node.tagName) {
    return;
  }

  const tagName = node.tagName.toLowerCase();
  const existingStyle = node.getAttribute('style');
  const nextStyle = TAG_STYLES[tagName];
  const skipDefaultParagraphStyle =
    tagName === 'p' && typeof existingStyle === 'string' && existingStyle.includes('text-indent:-1.4em');

  if (nextStyle && !skipDefaultParagraphStyle) {
    node.setAttribute('style', existingStyle ? `${existingStyle};${nextStyle}` : nextStyle);
  }

  for (const child of node.childNodes) {
    if (child.tagName) {
      applyStyles(child);
    }
  }
}

function unwrapImageParagraphs(article) {
  for (const paragraph of article.querySelectorAll('p')) {
    const elementChildren = paragraph.childNodes.filter((child) => child.tagName);
    const paragraphText = paragraph.textContent?.trim?.() || paragraph.text?.trim?.() || '';
    if (
      elementChildren.length === 1 &&
      elementChildren[0].tagName?.toLowerCase() === 'img' &&
      paragraphText === ''
    ) {
      paragraph.replaceWith(`<figure style="${TAG_STYLES.figure}">${elementChildren[0].toString()}</figure>`);
    }
  }
}

function fixInlineCode(article) {
  for (const pre of article.querySelectorAll('pre')) {
    const code = pre.querySelector('code');
    if (code) {
      code.removeAttribute('style');
      code.setAttribute(
        'style',
        'background:transparent;color:inherit;padding:0;border-radius:0;font-size:inherit;',
      );
    }
  }
}

function normalizeWechatLists(markdown) {
  const lines = markdown.split('\n');
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      let cursor = index;
      while (cursor < lines.length && /^\s*[-*+]\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s*[-*+]\s+/, '• '));
        cursor += 1;
      }
      output.push(items.join('\n\n'));
      index = cursor - 1;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      let cursor = index;
      while (cursor < lines.length && /^\s*\d+\.\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^(\s*)(\d+)\.\s+/, '$1$2\\. '));
        cursor += 1;
      }
      output.push(items.join('\n\n'));
      index = cursor - 1;
      continue;
    }

    output.push(line);
  }

  return output.join('\n');
}
