#!/usr/bin/env node
/** Enforce place head: `id` ref slug (not display `name`). */
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

import { findTwinfileDirs } from './find-twinfile-dirs.mjs';
import { findTwinHead, resolvePlaceExamplesCatalogRoot } from '../../dist/index.js';

const examplesRoot = resolvePlaceExamplesCatalogRoot();
const ID = /^[a-z0-9][a-z0-9-]{0,62}$/;

const errors = [];

function checkRoot(root, label) {
  for (const dir of findTwinfileDirs(root)) {
    const head = findTwinHead(dir);
    if (head?.kind !== 'place') continue;
    const twinfilePath = head.path;
    const rel = dir.replace(`${root}/`, '');
    const pathLabel = label ? `${label}/${rel}` : rel;
    const twinfile = parseYaml(readFileSync(twinfilePath, 'utf8'));

    const id = typeof twinfile.id === 'string' ? twinfile.id.trim() : '';
    if (!id) {
      errors.push(`${pathLabel}: missing head id (ref slug)`);
      continue;
    }
    if (!ID.test(id)) {
      errors.push(`${pathLabel}: id "${id}" must match ${ID}`);
    }

  }
}

checkRoot(examplesRoot, '');

if (errors.length) {
  console.error('check-twinfile-head failed:\n', errors.join('\n'));
  process.exit(1);
}
console.log('check-twinfile-head ok');
