import { importPlace } from './import.js';
import { exportPlace } from './export.js';
export const bridge = {
    id: 'brick',
    crosswalkSource: 'brick',
    roles: ['import', 'export'],
    importPlace,
    exportPlace,
};
export { importPlace } from './import.js';
export { exportPlace } from './export.js';
