import type { TwinBridge } from '../../types.js';
import { importPlace } from './import.js';

export const bridge: TwinBridge = {
  id: 'gltf',
  crosswalkSource: 'gltf',
  roles: ['import', 'geometry'],
  importPlace,
};

export { importPlace } from './import.js';
