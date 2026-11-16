import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `packages/spec` in the monorepo, for conformance fixtures. */
export function specRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '../../spec');
}
