import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Directory containing `conf/` in the installed @local-hosting/twinfile package. */
export function resolveSpecPackageRoot(): string {
  return dirname(require.resolve('@local-hosting/twinfile/package.json'));
}

export function resolveSpecConfPath(...segments: string[]): string {
  return join(resolveSpecPackageRoot(), 'conf', ...segments);
}
