#!/usr/bin/env node
/**
 * CI: wire @local-hosting/twinfile-core + @local-hosting/twinfile before `yarn install` in this repo checkout.
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
  pkg.dependencies['@local-hosting/twinfile-core'] = 'file:../core';
} else if (pins['@local-hosting/twinfile-core']) {
  pkg.dependencies['@local-hosting/twinfile-core'] = `npm:${String(pins['@local-hosting/twinfile-core']).trim()}`;
} else {
  console.error('ci-prepare-deps: checkout twinfile/core to ./core or pin @local-hosting/twinfile-core');
  process.exit(1);
}

const specInCore = path.join(packageRoot, 'core', 'spec', 'package.json');
const specSibling = path.join(packageRoot, 'spec', 'package.json');
if (existsSync(specInCore)) {
  pkg.dependencies['@local-hosting/twinfile'] = 'file:../core/spec';
} else if (existsSync(specSibling)) {
  pkg.dependencies['@local-hosting/twinfile'] = 'file:../spec';
} else {
  const specPin = pins['@local-hosting/twinfile'] ?? '1.0.0-draft.1';
  pkg.dependencies['@local-hosting/twinfile'] = `npm:${String(specPin).trim()}`;
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
  `ci-prepare-deps: core ${pkg.dependencies['@local-hosting/twinfile-core']}; spec ${pkg.dependencies['@local-hosting/twinfile']}`,
);
