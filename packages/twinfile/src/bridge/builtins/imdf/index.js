import { importPlace } from './import.js';
import { exportPlace } from './export.js';
export const bridge = {
    id: 'imdf',
    crosswalkSource: 'imdf',
    roles: ['import', 'export'],
    importPlace,
    exportPlace,
};
export { importPlace } from './import.js';
export { exportPlace } from './export.js';
