import nextVitals from 'eslint-config-next/core-web-vitals'
import { defineConfig, globalIgnores } from 'eslint/config'
import { tokenColorRules } from './eslint-tokens.mjs'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'spec/**',
    'examples/**',
  ]),
  tokenColorRules,
])

export default eslintConfig
