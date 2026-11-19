import { join } from 'node:path';

import { resolveSpecPackageRoot } from './resolve-spec-package-root.js';

export { resolveSpecPackageRoot, resolveSpecSchemasRoot } from './resolve-spec-package-root.js';

export function resolveSpecConfPath(...segments: string[]): string {
  return join(resolveSpecPackageRoot(), 'conf', ...segments);
}