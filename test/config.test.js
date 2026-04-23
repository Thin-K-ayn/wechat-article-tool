import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePath } from '../src/config.js';

test('resolvePath keeps absolute paths unchanged', () => {
  assert.equal(resolvePath('/tmp', '/tmp/file.md'), '/tmp/file.md');
});

test('resolvePath resolves relative paths from cwd', () => {
  assert.equal(
    resolvePath('/workspace/wechat-article-tool', './articles/a.md'),
    '/workspace/wechat-article-tool/articles/a.md',
  );
});
