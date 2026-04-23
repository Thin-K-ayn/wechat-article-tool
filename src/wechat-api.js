import { openAsBlob } from 'node:fs';
import path from 'node:path';

export async function uploadArticleViaApi({
  runtimeConfig,
  article,
  html,
  imageRefs,
  accessToken: providedAccessToken,
}) {
  assertApiCredentials(runtimeConfig);
  const accessToken =
    providedAccessToken ||
    (await fetchAccessToken(runtimeConfig.wechat.appId, runtimeConfig.wechat.appSecret));

  const coverSource = article.meta.coverImage || imageRefs[0] || '';
  const thumbMediaId =
    article.meta.coverMediaId ||
    (coverSource
      ? await uploadPermanentImage({
          accessToken,
          imageRef: coverSource,
          articleDir: article.baseDir,
        })
      : '');

  if (!thumbMediaId) {
    throw new Error(
      'API mode requires a cover image. Set frontmatter "coverImage" or "coverMediaId".',
    );
  }

  const draft = await addDraft({
    accessToken,
    article: {
      title: article.meta.title,
      author: article.meta.author,
      digest: article.meta.digest,
      content: html,
      content_source_url: article.meta.contentSourceUrl,
      thumb_media_id: thumbMediaId,
      need_open_comment: article.meta.openComment ? 1 : 0,
      only_fans_can_comment: article.meta.fansOnlyComment ? 1 : 0,
    },
  });

  return {
    accessToken,
    draft,
  };
}

export async function uploadInlineImages(accessToken, article, imageRefs) {
  const replacementMap = new Map();

  for (const ref of imageRefs) {
    const uploadedUrl = await uploadArticleImage({
      accessToken,
      imageRef: ref,
      articleDir: article.baseDir,
    });
    replacementMap.set(ref, uploadedUrl);
  }

  return replacementMap;
}

async function fetchAccessToken(appId, appSecret) {
  const params = new URLSearchParams({
    grant_type: 'client_credential',
    appid: appId,
    secret: appSecret,
  });

  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok || payload.errcode) {
    throw new Error(`Failed to fetch access token: ${payload.errmsg || response.statusText}`);
  }

  return payload.access_token;
}

async function uploadArticleImage({ accessToken, imageRef, articleDir }) {
  const form = new FormData();
  const filePayload = await buildFilePayload(imageRef, articleDir);
  form.set('media', filePayload.blob, filePayload.filename);

  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`,
    {
      method: 'POST',
      body: form,
    },
  );

  const payload = await response.json();
  if (!response.ok || payload.errcode) {
    throw new Error(`Failed to upload article image "${imageRef}": ${payload.errmsg || response.statusText}`);
  }

  return payload.url;
}

async function uploadPermanentImage({ accessToken, imageRef, articleDir }) {
  const form = new FormData();
  const filePayload = await buildFilePayload(imageRef, articleDir);
  form.set('media', filePayload.blob, filePayload.filename);

  const response = await fetch(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`,
    {
      method: 'POST',
      body: form,
    },
  );

  const payload = await response.json();
  if (!response.ok || payload.errcode) {
    throw new Error(`Failed to upload cover image "${imageRef}": ${payload.errmsg || response.statusText}`);
  }

  return payload.media_id;
}

async function addDraft({ accessToken, article }) {
  return await postWechatJson(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
    {
      articles: [article],
    },
    'create draft',
  );
}

async function postWechatJson(url, payload, actionLabel) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || data.errcode) {
    throw new Error(`Failed to ${actionLabel}: ${data.errmsg || response.statusText}`);
  }

  return data;
}

async function buildFilePayload(imageRef, articleDir) {
  if (/^https?:\/\//i.test(imageRef)) {
    const remoteResponse = await fetch(imageRef);
    if (!remoteResponse.ok) {
      throw new Error(`Could not download image: ${imageRef}`);
    }

    const url = new URL(imageRef);
    const filename = path.basename(url.pathname) || 'image';
    return {
      blob: await remoteResponse.blob(),
      filename,
    };
  }

  const absolutePath = path.isAbsolute(imageRef) ? imageRef : path.resolve(articleDir, imageRef);
  return {
    blob: await openAsBlob(absolutePath),
    filename: path.basename(absolutePath),
  };
}

function assertApiCredentials(runtimeConfig) {
  if (!runtimeConfig.wechat.appId || !runtimeConfig.wechat.appSecret) {
    throw new Error('WECHAT_APP_ID or WECHAT_APP_SECRET is missing. API mode cannot continue.');
  }
}

export { fetchAccessToken };
