#!/usr/bin/env node
/** Copy canonical vn-scan-lib.mjs into sibling geo repos (standalone mirrors). */
import { copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const source = join(root, 'packages/tooling/scripts/vn-scan-lib.mjs');
const siblings = [{ dir: '../geotypes' }, { dir: '../geokit' }];

for (const { dir: pkg } of siblings) {
  const dest = join(root, pkg, 'scripts/vn-scan-lib.mjs');
  copyFileSync(source, dest);
  console.log(`synced ${pkg}`);
}