import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHARACTER_MODULE_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

/** `@local-hosting/twinfile` character slice root (`src/catalog/character`). */
export function resolvePackageRoot(): string {
  return CHARACTER_MODULE_ROOT;
}

/** Character/situations YAML under `src/catalog/character/libs/`. */
export function resolveCharacterCatalogsRoot(_moduleUrl?: string | URL): string {
  void _moduleUrl;
  return join(CHARACTER_MODULE_ROOT, 'libs');
}