#!/usr/bin/env node
/**
 * CI-only: use GitHub Packages for @doppler-group/* siblings (no portal/link checkouts).
 * Local dev keeps portal/link entries in package.json unchanged.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function patchJson(relPath, mutator) {
  const path = join(root, relPath);
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  mutator(doc);
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
}

patchJson('package.json', (pkg) => {
  const resolutions = { ...(pkg.resolutions ?? {}) };
  delete resolutions['@doppler-group/frameworks'];
  delete resolutions['@doppler-group/geotypes'];
  pkg.resolutions = resolutions;
});

patchJson('packages/core/package.json', (pkg) => {
  pkg.dependencies ??= {};
  pkg.dependencies['@doppler-group/frameworks-core'] = 'npm:0.4.0';
  pkg.dependencies['@doppler-group/frameworks-presets'] = 'npm:0.4.0';
});

patchJson('packages/site/package.json', (pkg) => {
  pkg.dependencies ??= {};
  pkg.dependencies['@doppler-group/geokit'] = 'npm:0.4.3';
});

const geotypesPins = ['packages/bridge/package.json', 'packages/core/package.json', 'catalog/place/package.json'];
for (const rel of geotypesPins) {
  patchJson(rel, (pkg) => {
    if (pkg.dependencies?.['@doppler-group/geotypes']) {
      pkg.dependencies['@doppler-group/geotypes'] = 'npm:0.1.2';
    }
  });
}

if (existsSync(join(root, '../geotypes/package.json'))) {
  console.log('ci-prepare-monorepo-install: sibling geotypes present; registry mode still ok');
}

console.log('ci-prepare-monorepo-install: registry deps for frameworks, geokit, geotypes');