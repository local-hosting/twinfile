#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const token = process.env.NODE_AUTH_TOKEN;
if (!token) {
  console.error('ci-use-registry-spec: NODE_AUTH_TOKEN is required');
  process.exit(1);
}

const pkgPath = 'package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pin = pkg.twinfilePinnedDependencies?.['@doppler-group/twinfile-spec'] ?? '1.0.0-draft.1';
pkg.dependencies['@doppler-group/twinfile-spec'] = pin;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

writeFileSync(
  '.npmrc',
  [
    '@twinfile:registry=https://npm.pkg.github.com',
    `//npm.pkg.github.com/:_authToken=${token}`,
    '',
  ].join('\n'),
);

const yarnrcPath = '.yarnrc.yml';
const base = readFileSync(yarnrcPath, 'utf8').replace(/\n npmScopes:[\s\S]*$/m, '');
writeFileSync(
  yarnrcPath,
  `${base.trim()}\nnpmScopes:\n  twinfile:\n    npmRegistryServer: "https://npm.pkg.github.com"\n    npmAuthToken: "${token}"\n`,
);

console.log(`ci-use-registry-spec: @doppler-group/twinfile-spec@${pin} (GitHub Packages, private)`);
