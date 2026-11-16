import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['development', 'import', 'default'],
  },
  test: {
    include: ['test/**/*.test.ts'],
    server: {
      deps: {
        inline: ['@doppler-group/twinfile-character'],
      },
    },
  },
});