#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolveGeotypesRoot } from './resolve-geotypes-root.mjs';

const indexJs = readFileSync('dist/index.js', 'utf8');
const indexDts = readFileSync('dist/index.d.ts', 'utf8');
const requiredRuntime = ['resolvePlaceMounts', 'resolvePlaceMount', 'placeMountFromJson', 'placeMountToJson'];
const requiredTypes = ['TwinfilePlaceMount', 'PlaceMount'];

const missingRuntime = requiredRuntime.filter((name) => !indexJs.includes(name));
const missingTypes = requiredTypes.filter((name) => !indexDts.includes(name));
const missing = [...missingRuntime, ...missingTypes];
if (missing.length > 0) {
  console.error(
    `check-npm-export-surface: dist/index.js missing exports: ${missing.join(', ')} (rebuild before publish)`,
  );
  process.exit(1);
}

const geotypesRoot = resolveGeotypesRoot();
if (!geotypesRoot && process.env.TF_PUBLISH_USE_REGISTRY !== '1') {
  console.error('check-npm-export-surface: geotypes root not found (CI should checkout twinfile/geotypes)');
  process.exit(1);
}

console.log('check-npm-export-surface ok');
