import { defineConfig } from 'vitest/config'

import { legacyCatalogTestResolvePlugin } from './test/vitest-legacy-catalog-resolve.ts'
import { preferTypeScriptSourcePlugin } from './test/vitest-prefer-ts-source.ts'

export default defineConfig({
  resolve: {
    conditions: ['development', 'import', 'module', 'default'],
  },
  plugins: [preferTypeScriptSourcePlugin(), legacyCatalogTestResolvePlugin()],
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/vitest-setup.ts'],
    testTimeout: 60_000,
  },
})