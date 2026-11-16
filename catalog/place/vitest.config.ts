import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@doppler-group/twinfile-core/cli',
        replacement: path.join(root, '../../packages/core/src/cli/twinfile-cli.ts'),
      },
      {
        find: '@doppler-group/twinfile-core',
        replacement: path.join(root, '../../packages/core/src/index.ts'),
      },
    ],
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});