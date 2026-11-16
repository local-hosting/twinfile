#!/usr/bin/env node
/**
 * CI: wire @doppler-group/twinfile-core + @doppler-group/twinfile-spec before `yarn install` in this repo checkout.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const token = process.env.NODE_AUTH_TOKEN;
if (!token) {
  console.error('ci-prepare-deps: NODE_AUTH_TOKEN is required');
  process.exit(1);
}

const packageRoot = process.cwd();
const pkgPath = path.join(packageRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pins = pkg.twinfilePinnedDependencies ?? {};
pkg.dependencies ??= {};

const coreCheckout = path.join(packageRoot, 'core', 'package.json');
if (existsSync(coreCheckout)) {
  pkg.dependencies['@doppler-group/twinfile-core'] = 'file:../core';
} else if (pins['@doppler-group/twinfile-core']) {
  pkg.dependencies['@doppler-group/twinfile-core'] = `npm:${String(pins['@doppler-group/twinfile-core']).trim()}`;
} else {
  console.error('ci-prepare-deps: checkout twinfile/core to ./core or pin @doppler-group/twinfile-core');
  process.exit(1);
}

const specInCore = path.join(packageRoot, 'core', 'spec', 'package.json');
const specSibling = path.join(packageRoot, 'spec', 'package.json');
if (existsSync(specInCore)) {
  pkg.dependencies['@doppler-group/twinfile-spec'] = 'file:../core/spec';
} else if (existsSync(specSibling)) {
  pkg.dependencies['@doppler-group/twinfile-spec'] = 'file:../spec';
} else {
  const specPin = pins['@doppler-group/twinfile-spec'] ?? '1.0.0-draft.1';
  pkg.dependencies['@doppler-group/twinfile-spec'] = `npm:${String(specPin).trim()}`;
}

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

writeFileSync(
  path.join(packageRoot, '.npmrc'),
  [
    '@twinfile:registry=https://npm.pkg.github.com',
    `//npm.pkg.github.com/:_authToken=${token}`,
    '',
  ].join('\n'),
);

const yarnrcPath = path.join(packageRoot, '.yarnrc.yml');
const base = existsSync(yarnrcPath)
  ? readFileSync(yarnrcPath, 'utf8').replace(/\nnpmScopes:[\s\S]*$/m, '')
  : 'nodeLinker: node-modules';
writeFileSync(
  yarnrcPath,
  `${base.trim()}\nnpmScopes:\n  twinfile:\n    npmRegistryServer: "https://npm.pkg.github.com"\n    npmAuthToken: "${token}"\n`,
);

console.log(
  `ci-prepare-deps: core ${pkg.dependencies['@doppler-group/twinfile-core']}; spec ${pkg.dependencies['@doppler-group/twinfile-spec']}`,
);
