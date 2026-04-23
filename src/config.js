import 'dotenv/config';

import path from 'node:path';
import process from 'node:process';

export function loadRuntimeConfig() {
  return {
    cwd: process.cwd(),
    llm: {
      baseUrl: process.env.LLM_BASE_URL?.trim() || 'https://api.openai.com/v1',
      apiKey: process.env.LLM_API_KEY?.trim() || '',
      model: process.env.LLM_MODEL?.trim() || '',
    },
    article: {
      defaultAudience: process.env.ARTICLE_DEFAULT_AUDIENCE?.trim() || '',
      defaultStyle: process.env.ARTICLE_DEFAULT_STYLE?.trim() || '',
    },
    wechat: {
      appId: process.env.WECHAT_APP_ID?.trim() || '',
      appSecret: process.env.WECHAT_APP_SECRET?.trim() || '',
      defaultAuthor: process.env.WECHAT_DEFAULT_AUTHOR?.trim() || '',
      defaultContentSourceUrl: process.env.WECHAT_DEFAULT_CONTENT_SOURCE_URL?.trim() || '',
    },
  };
}

export function resolvePath(cwd, targetPath) {
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(cwd, targetPath);
}
