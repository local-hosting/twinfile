import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/** Directory containing `conf/` in the installed @doppler-group/twinfile-spec package. */
export function resolveSpecPackageRoot(): string {
  return dirname(require.resolve('@doppler-group/twinfile-spec/package.json'));
}

export function resolveSpecConfPath(...segments: string[]): string {
  return join(resolveSpecPackageRoot(), 'conf', ...segments);
}
