export async function generateArticleMarkdown({
  runtimeConfig,
  topic,
  angle = '',
  audience = '',
  style = '',
  keywords = '',
  notes = '',
  titleHint = '',
  coverImage = '',
}) {
  if (!runtimeConfig.llm.apiKey) {
    throw new Error('LLM_API_KEY is missing. Fill .env before using the generate command.');
  }

  if (!runtimeConfig.llm.model) {
    throw new Error('LLM_MODEL is missing. Fill .env before using the generate command.');
  }

  const systemPrompt = [
    'You write high-quality Chinese WeChat Official Account articles.',
    'Return only Markdown.',
    'The response must begin with YAML frontmatter and then the article body.',
    'Do not wrap the result in code fences.',
    'Frontmatter fields must be: title, author, digest, coverImage, contentSourceUrl, openComment, fansOnlyComment.',
    'The body should be readable in WeChat, with short paragraphs, concrete examples, and scannable headings.',
    'Do not repeat the title as a first-level heading in the body.',
    'Prefer practical, trustworthy writing over hype.',
  ].join(' ');

  const userPrompt = [
    `主题：${topic}`,
    `文章角度：${angle || '由你判断一个最适合公众号传播的实操角度'}`,
    `目标读者：${audience || runtimeConfig.article.defaultAudience || '泛互联网读者'}`,
    `文风：${style || runtimeConfig.article.defaultStyle || '专业、清楚、自然'}`,
    `关键词：${keywords || '无'}`,
    `封面图路径：${coverImage || '请留空字符串'}`,
    `标题提示：${titleHint || '无'}`,
    notes
      ? `补充材料：\n${notes}`
      : '补充材料：无。请直接根据主题生成一篇完整文章。',
    '如果无法确定原文链接，请把 contentSourceUrl 设为空字符串。',
    'frontmatter 中的 coverImage 如果没有明确路径就写空字符串。',
  ].join('\n\n');

  const response = await fetch(`${stripTrailingSlash(runtimeConfig.llm.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${runtimeConfig.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: runtimeConfig.llm.model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('LLM returned an empty article.');
  }

  return content;
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, '');
}
