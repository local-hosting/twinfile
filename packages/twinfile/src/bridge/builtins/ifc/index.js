import { importIfcProjection } from './import-ifc-projection.js';
import { importIfcStep, isIfcBytesInput } from './import-ifc-step.js';
export function importPlace(input) {
    if (isIfcBytesInput(input))
        throw new Error('ifc: STEP bytes require async import (use twin import ifc)');
    return importIfcProjection(input);
}
/** CLI / async path for STEP `.ifc` files. */
export async function importIfc(input) {
    if (isIfcBytesInput(input))
        return importIfcStep(input);
    return importIfcProjection(input);
}
export const bridge = {
    id: 'ifc',
    crosswalkSource: 'ifc',
    roles: ['import'],
    importPlace,
};
export { importIfcProjection } from './import-ifc-projection.js';
export { importIfcStep, isIfcBytesInput } from './import-ifc-step.js';
