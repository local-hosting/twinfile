import { importPlace } from './import.js';
import { exportPlace } from './export.js';
export const bridge = {
    id: 'sosa',
    crosswalkSource: 'sosa',
    roles: ['import', 'export'],
    importPlace,
    exportPlace,
};
export { importPlace } from './import.js';
export { exportPlace } from './export.js';
