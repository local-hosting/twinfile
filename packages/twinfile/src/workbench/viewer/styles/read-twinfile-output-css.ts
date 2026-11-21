import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function findTwinfileOutputCssPath(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const path = join(dir, 'styles/twinfile-output.css');
    if (existsSync(path)) {
      return path;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    'viewer: missing styles/twinfile-output.css — run `yarn workspace yarn workspace @local-hosting/twinfile build (viewer assets TBD)`',
  );
}

/** Portable disclosure / code-block tokens (`viewer/styles/twinfile-output.css`). */
export function readTwinfileOutputCss(): string {
  return readFileSync(findTwinfileOutputCssPath(), 'utf8');
}
