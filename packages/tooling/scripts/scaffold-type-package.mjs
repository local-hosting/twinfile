#!/usr/bin/env node
/** Generate symmetric type package skeleton. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const kinds = ['place', 'resource', 'character', 'story'];

for (const kind of kinds) {
  const dir = join(root, kind);
  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'test'), { recursive: true });
  const head =
    kind === 'place'
      ? 'Place.yaml'
      : kind === 'resource'
        ? 'Resource.yaml'
        : kind === 'character'
          ? 'Character.yaml'
          : kind === 'story'
            ? 'Story.yaml'
            : 'Event.yaml';
  const pkgName = `@doppler-group/twinfile-${kind}`;
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: pkgName,
        version: '0.0.1',
        private: true,
        type: 'module',
        exports: { '.': './src/index.ts', './module': './src/twin-module.ts' },
        dependencies: {
          '@doppler-group/twinfile-core': 'workspace:packages/core',
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, 'src/twin-module.ts'),
    `import { createHeadTwinTypeModule } from '@doppler-group/twinfile-core';

export const headFile = '${head}';
export const kind = '${kind}' as const;

export const module = createHeadTwinTypeModule({ kind, headFile });
`,
  );
  writeFileSync(join(dir, 'src/index.ts'), `export { module, kind, headFile } from './twin-module.js';\n`);
  writeFileSync(join(dir, 'README.md'), `# ${kind}\n\nTwin type package — see \`packages/spec/doc/unit-layout.md\`.\n`);
}
console.log('scaffold-type-package: ok');