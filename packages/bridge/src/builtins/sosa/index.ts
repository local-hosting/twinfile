import type { TwinBridge } from '../../types.js';
import { importPlace } from './import.js';
import { exportPlace } from './export.js';

export const bridge: TwinBridge = {
  id: 'sosa',
  crosswalkSource: 'sosa',
  roles: ['import', 'export'],
  importPlace,
  exportPlace,
};

export { importPlace } from './import.js';
export { exportPlace } from './export.js';
