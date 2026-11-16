#!/usr/bin/env node
/**
 * CI: wire @twinfile/* deps and registry auth before `yarn install`.
 * Profile `stack` (core, bridge) or `site` (twinfile-docs). Canonical path: `packages/tooling/scripts/ci-prepare-deps.mjs`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { resolveGeotypesRoot } from './resolve-geotypes-root.mjs';

const token = process.env.NODE_AUTH_TOKEN;
if (!token) {
  console.error('ci-prepare-deps: NODE_AUTH_TOKEN is required');
  process.exit(1);
}

const packageRoot = process.cwd();
const pkgPath = path.join(packageRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const ciPrepare = pkg.twinfileCiPrepare ?? {};

/** @returns {'stack' | 'site'} */
function resolveProfile() {
  const explicit = ciPrepare.profile;
  if (explicit === 'stack' || explicit === 'site') return explicit;
  if (pkg.name === '@doppler-group/twinfile-docs') return 'site';
  return 'stack';
}

const profile = resolveProfile();
const useRegistryGeotypes =
  process.env.TF_PUBLISH_USE_REGISTRY === '1' || process.env.TF_CI_USE_REGISTRY === '1';

if (profile === 'site') {
  pkg.dependencies ??= {};
  for (const [name, version] of Object.entries(pkg.twinfilePinnedDependencies ?? {})) {
    if (name in pkg.dependencies) pkg.dependencies[name] = version;
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const scopeBlock = (scopeName) =>
    `  ${scopeName}:\n    npmRegistryServer: "https://npm.pkg.github.com"\n    npmAlwaysAuth: true\n    npmAuthToken: "\${NODE_AUTH_TOKEN}"\n`;
  writeFileSync(
    path.join(packageRoot, '.yarnrc.yml'),
    `nodeLinker: node-modules\nnpmScopes:\n${scopeBlock('twinfile')}${scopeBlock('westlane')}`,
  );

  console.log('ci-prepare-deps:', JSON.stringify(pkg.twinfilePinnedDependencies ?? {}));
  process.exit(0);
}

const pins = pkg.twinfilePinnedDependencies ?? {};
pkg.dependencies ??= {};

const specPin = pins['@doppler-group/twinfile-spec'] ?? '1.0.0-draft.1';
const specCheckout = path.join(packageRoot, 'spec', 'package.json');
const specAsNpm =
  ciPrepare.specDepAsNpmProtocol === true ||
  (ciPrepare.specDepAsNpmProtocol !== false && pkg.name === '@doppler-group/twinfile-bridge');

let specDep;
if (existsSync(specCheckout)) {
  specDep = 'file:./spec';
} else if (specAsNpm) {
  specDep = `npm:${String(specPin).trim()}`;
} else {
  specDep = String(specPin).trim();
}
pkg.dependencies['@doppler-group/twinfile-spec'] = specDep;

const geotypesPin =
  pins['@doppler-group/geotypes'] ?? (pkg.name === '@doppler-group/twinfile-bridge' ? '0.1.2' : undefined);
const geotypesRoot = useRegistryGeotypes ? null : resolveGeotypesRoot(packageRoot);

if (useRegistryGeotypes) {
  if (!geotypesPin) {
    console.error(
      'ci-prepare-deps: registry geotypes requires @doppler-group/geotypes pin (TF_CI_USE_REGISTRY or TF_PUBLISH_USE_REGISTRY)',
    );
    process.exit(1);
  }
  pkg.dependencies['@doppler-group/geotypes'] = `npm:${String(geotypesPin).trim()}`;
} else if (geotypesRoot) {
  pkg.dependencies['@doppler-group/geotypes'] = existsSync(path.join(packageRoot, 'geotypes', 'package.json'))
    ? 'file:./geotypes'
    : 'file:../geotypes';
} else if (geotypesPin) {
  if (pkg.name === '@doppler-group/twinfile-bridge') {
    pkg.dependencies['@doppler-group/geotypes'] = `npm:${String(geotypesPin).trim()}`;
  } else {
    console.error('ci-prepare-deps: @doppler-group/geotypes pinned but no checkout (add geotypes workflow checkout)');
    process.exit(1);
  }
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
const base = readFileSync(yarnrcPath, 'utf8').replace(/\nnpmScopes:[\s\S]*$/m, '');
writeFileSync(
  yarnrcPath,
  `${base.trim()}\nnpmScopes:\n  twinfile:\n    npmRegistryServer: "https://npm.pkg.github.com"\n    npmAuthToken: "${token}"\n`,
);

const geotypesNote = useRegistryGeotypes
  ? `geotypes npm:${geotypesPin}`
  : geotypesRoot
    ? `geotypes file:${geotypesRoot}`
    : pkg.dependencies['@doppler-group/geotypes']
      ? `geotypes ${pkg.dependencies['@doppler-group/geotypes']}`
      : '';
const specNote = specDep.startsWith('file:') ? 'spec file:./spec' : `@doppler-group/twinfile-spec@${specDep.replace(/^npm:/, '')}`;
console.log(`ci-prepare-deps: ${specNote}${geotypesNote ? `; ${geotypesNote}` : ''}`);
