#!/usr/bin/env node
/**
 * Copy site scenarios into catalog/story/examples/<story>/scenes/<id>/run.yaml.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import {
  resolveTwinfileRootFromImportMeta,
  resolveTypeExamplesRoot,
} from '../../../packages/core/scripts/catalog/resolve-twinfile-paths.mjs';

const root = resolveTwinfileRootFromImportMeta(import.meta.url);
const placeExamples = resolveTypeExamplesRoot('place', root);
const storyExamples = resolveTypeExamplesRoot('story', root);

const STORY_FOR_PLACE_REF = { shop: 'shop-visit' };

function storyIdForSite(sitePath, doc) {
  const parent = doc?.catalog?.parent;
  if (typeof parent === 'string') {
    const slug = /^twinfile\/([^:]+):/.exec(parent)?.[1];
    if (slug && STORY_FOR_PLACE_REF[slug]) return STORY_FOR_PLACE_REF[slug];
    if (slug) return `${slug}-operations`;
  }
  const site = sitePath.split('/')[0];
  return STORY_FOR_PLACE_REF[site] ?? `${site}-operations`;
}

function placeTypedFromCatalog(parent) {
  const slug = /^twinfile\/([^:]+):/.exec(parent)?.[1] ?? 'unknown';
  const ver = parent.split(':')[1] ?? '0.0.0';
  return `twinfile/place/${slug}:${ver}`;
}

function walkPresets(dir, rel = '') {
  const out = [];
  for (const name of readdirSafe(dir)) {
    const path = join(dir, name);
    const stat = statSafe(path);
    if (!stat) continue;
    if (stat.isDirectory()) {
      const preset = join(path, 'preset.yaml');
      if (existsSync(preset)) out.push({ preset, rel: join(rel, name) });
      else out.push(...walkPresets(path, join(rel, name)));
    }
  }
  return out;
}

function readdirSafe(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return undefined;
  }
}

let created = 0;
for (const { preset, rel } of walkPresets(placeExamples)) {
  const doc = parseYaml(readFileSync(preset, 'utf8'));
  if (!doc || typeof doc !== 'object') continue;
  const id = typeof doc.id === 'string' ? doc.id : basename(dirname(preset));
  const storyId = storyIdForSite(rel, doc);
  const sceneDir = join(storyExamples, storyId, 'scenes', id);
  const runPath = join(sceneDir, 'run.yaml');
  if (existsSync(runPath)) continue;
  mkdirSync(sceneDir, { recursive: true });
  const head = { role: 'run', ...doc };
  if (head.from === '..' && typeof head.catalog?.parent === 'string') {
    head.from = placeTypedFromCatalog(head.catalog.parent);
  }
  writeFileSync(runPath, stringifyYaml(head));
  const expected = join(dirname(preset), 'expected');
  if (existsSync(expected)) cpSync(expected, join(sceneDir, 'expected'), { recursive: true });
  const readme = join(sceneDir, 'README.md');
  if (!existsSync(readme)) {
    writeFileSync(
      readme,
      `# ${doc.name ?? id}\n\nFrom \`catalog/place/examples/${relative(placeExamples, dirname(preset))}/preset.yaml\`.\n`,
    );
  }
  created += 1;
}
console.log(`sync:story-scenes: ${created} scene(s)`);