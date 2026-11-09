import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const editorRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const viewerVendor = join(editorRoot, 'assets/vendor');

mkdirSync(viewerVendor, { recursive: true });

await esbuild.build({
  entryPoints: [join(editorRoot, 'scripts/viewer-highlight-entry.mjs')],
  outfile: join(viewerVendor, 'highlight.js'),
  bundle: true,
  format: 'iife',
  globalName: 'hljs',
  platform: 'browser',
  minify: true,
  legalComments: 'none',
  mainFields: ['module', 'main'],
});

console.log('viewer: wrote assets/vendor/highlight.js');
