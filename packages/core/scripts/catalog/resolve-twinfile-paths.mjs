/**
 * CLI shim — catalog path API lives in `@local-hosting/twinfile-core` (`catalog-layout.ts`).
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(coreRoot, 'package.json'));

export const {
  isTwinfileMonorepoRoot,
  resolveTwinfileRootFromPlaceCatalog,
  resolveTwinfileRootFromImportMeta,
  resolveTypeExamplesRoot,
  resolvePlaceExamplesCatalogRoot,
  resolveCharacterCatalogRoot,
  TWIN_CATALOG_HUB,
} = require(join(coreRoot, 'dist/index.js'));