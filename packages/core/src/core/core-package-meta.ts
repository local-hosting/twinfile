import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const corePkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'),
) as { name: string; version: string };

/** npm package that implements Twinfile load/build and place mounts. */
export const CORE_PACKAGE = {
  name: corePkg.name,
  version: corePkg.version,
} as const;
