import { importIfcProjection } from './import-ifc-projection.js';
import { importIfcStep, isIfcBytesInput } from './import-ifc-step.js';
import type { ImportResult, TwinBridge } from '../../types.js';

export function importPlace(input: unknown): ImportResult {
  if (isIfcBytesInput(input)) throw new Error('ifc: STEP bytes require async import (use twin import ifc)');
  return importIfcProjection(input);
}

/** CLI / async path for STEP `.ifc` files. */
export async function importIfc(input: unknown): Promise<ImportResult> {
  if (isIfcBytesInput(input)) return importIfcStep(input);
  return importIfcProjection(input);
}

export const bridge: TwinBridge = {
  id: 'ifc',
  crosswalkSource: 'ifc',
  roles: ['import'],
  importPlace,
};

export { importIfcProjection } from './import-ifc-projection.js';
export { importIfcStep, isIfcBytesInput, type IfcBytesInput } from './import-ifc-step.js';
