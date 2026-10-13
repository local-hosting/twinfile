import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['development', 'import', 'module', 'default'],
  },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/vitest-setup.ts'],
    testTimeout: 60_000,
  },
})