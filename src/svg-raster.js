import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

export async function renderSvgToPng({
  inputPath,
  outputPath = `${inputPath}.png`,
  scale = 2,
}) {
  const svgMarkup = await readFile(inputPath, 'utf8');
  await mkdir(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1200 },
      deviceScaleFactor: scale,
    });

    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:white;display:inline-block;">${svgMarkup}</body></html>`,
      { waitUntil: 'load' },
    );

    const svg = page.locator('svg').first();
    if (!(await svg.count())) {
      throw new Error(`Could not find an <svg> root while rendering ${inputPath}`);
    }

    await svg.screenshot({
      path: outputPath,
      omitBackground: false,
    });
  } finally {
    await browser.close();
  }

  return outputPath;
}
