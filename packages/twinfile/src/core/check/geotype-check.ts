import { resolveGeotypeRef } from '@local-hosting/geotypes';

import type { TwinError } from '../types/twin-error.js';
import { parseGeotypeTwinfile } from '../types/geotype-twinfile.js';

export type CheckGeotypeTwinfileOptions = {
  /** When true, missing `geotype.primary` is an error. */
  published?: boolean;
};

export function checkGeotypeTwinfile(
  twinfile: Record<string, unknown>,
  file?: string,
  options: CheckGeotypeTwinfileOptions = {},
): TwinError | null {
  if (twinfile.kind !== 'place') return null;
  const geotype = parseGeotypeTwinfile(twinfile);
  if (!geotype) {
    if (options.published) {
      return {
        code: 'E_GEOTYPE_MISSING',
        message: 'Published place twinfile requires geotype.primary',
        file,
      };
    }
    return null;
  }
  if (resolveGeotypeRef(geotype.primary)) return null;
  return {
    code: 'E_GEOTYPE_UNKNOWN',
    message: `Unknown geotype.primary "${geotype.primary}" (expected @local-hosting/geotypes slug or acronym)`,
    file,
  };
}
