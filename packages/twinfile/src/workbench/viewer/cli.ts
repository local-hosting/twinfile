#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { resolveViewerPackageRoot } from './server/resolve-workbench-static.js';
import { runViewerCli } from './server/run-viewer-cli.js';

function ensureStatic(): string {
  const viewerRoot = resolveViewerPackageRoot();
  const staticRoot = join(viewerRoot, 'dist/static');
  const publicRoot = join(viewerRoot, 'public');
  mkdirSync(staticRoot, { recursive: true });
  if (existsSync(publicRoot)) {
    cpSync(publicRoot, staticRoot, { recursive: true });
  }
  return staticRoot;
}

runViewerCli(process.argv.slice(2), { staticRoot: ensureStatic() });
