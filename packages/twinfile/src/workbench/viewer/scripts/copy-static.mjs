#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const viewerRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = join(viewerRoot, 'dist/static');
const publicRoot = join(viewerRoot, 'public');
const assetsCss = join(viewerRoot, 'assets/viewer.css');

mkdirSync(staticRoot, { recursive: true });
const stylesOut = join(viewerRoot, 'dist/styles');
const stylesSrc = join(viewerRoot, 'styles/twinfile-output.css');
if (existsSync(stylesSrc)) {
  mkdirSync(stylesOut, { recursive: true });
  cpSync(stylesSrc, join(stylesOut, 'twinfile-output.css'));
}
if (existsSync(publicRoot)) {
  cpSync(publicRoot, staticRoot, { recursive: true });
}
if (!existsSync(assetsCss)) {
  mkdirSync(join(viewerRoot, 'assets'), { recursive: true });
  writeFileSync(assetsCss, '/* twinfile examples viewer — Tailwind browser CDN supplies utilities */\n');
}
console.log('viewer static →', staticRoot);
