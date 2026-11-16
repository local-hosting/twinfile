import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@local-hosting/twinfile-core/cli',
        replacement: path.join(root, '../../packages/core/src/cli/twinfile-cli.ts'),
      },
      {
        find: '@local-hosting/twinfile-core',
        replacement: path.join(root, '../../packages/core/src/index.ts'),
      },
    ],
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});