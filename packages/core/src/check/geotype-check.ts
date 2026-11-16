import { resolveGeotypeRef } from '@doppler-group/geotypes';

import type { TwinError } from '../types/twin-error.js';
import { parseGeotypeTwinfile } from '../types/geotype-twinfile.js';

export function checkGeotypeTwinfile(
  twinfile: Record<string, unknown>,
  file?: string,
): TwinError | null {
  if (twinfile.kind !== 'place') return null;
  const geotype = parseGeotypeTwinfile(twinfile);
  if (!geotype) return null;
  if (resolveGeotypeRef(geotype.primary)) return null;
  return {
    code: 'E_GEOTYPE_UNKNOWN',
    message: `Unknown geotype.primary "${geotype.primary}" (expected @doppler-group/geotypes slug or acronym)`,
    file,
  };
}
