#!/usr/bin/env node
/** Enforce place head: `id` ref slug (not display `name`). */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { findTwinfileDirs } from './find-twinfile-dirs.mjs';
import { resolvePlaceExamplesCatalogRoot, resolveSimulatorRoot } from '../../dist/index.js';

const examplesRoot = resolvePlaceExamplesCatalogRoot();
const simulatorRoot = resolveSimulatorRoot();
const ID = /^[a-z0-9][a-z0-9-]{0,62}$/;

const errors = [];

function checkRoot(root, label) {
  for (const dir of findTwinfileDirs(root)) {
    const twinfilePath = ['Place.yaml', 'place.yaml', 'Twinfile.yaml', 'twinfile.yaml']
      .map((name) => join(dir, name))
      .find((p) => statSync(p, { throwIfNoEntry: false })?.isFile());
    if (!twinfilePath) continue;
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
if (statSync(simulatorRoot, { throwIfNoEntry: false })?.isDirectory()) {
  checkRoot(simulatorRoot, '../simulator');
}

if (errors.length) {
  console.error('check-twinfile-head failed:\n', errors.join('\n'));
  process.exit(1);
}
console.log('check-twinfile-head ok');
