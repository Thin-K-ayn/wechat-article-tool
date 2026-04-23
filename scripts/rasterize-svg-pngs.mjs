#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';

import { renderSvgToPng } from '../src/svg-raster.js';

const inputs = process.argv.slice(2);

if (inputs.length === 0) {
  console.error('Usage: node ./scripts/rasterize-svg-pngs.mjs <file.svg> [more.svg ...]');
  process.exit(1);
}

for (const input of inputs) {
  const absoluteInput = path.resolve(process.cwd(), input);
  const output = await renderSvgToPng({
    inputPath: absoluteInput,
    outputPath: `${absoluteInput}.png`,
  });

  console.log(`${absoluteInput} -> ${output}`);
}
