import { loadPatchModuleTypeCatalog } from './module-type-catalog.js';
import type { PatchGraphV1, PatchModuleTypeCatalog } from '../types/patch-graph.js';
import type { TwinMessageV1 } from '../types/twin-message.js';
import { err, ok, type Result } from '../types/twin-error.js';
import type { TwinError } from '../types/twin-error.js';

function portWire(
  graph: PatchGraphV1,
  catalog: PatchModuleTypeCatalog,
  moduleId: string,
  port: string,
  direction: 'in' | 'out',
): string | undefined {
  const mod = graph.modules.find((m) => m.id === moduleId);
  if (!mod) return undefined;
  const def = catalog[mod.type]?.ports[port];
  if (!def || def.direction !== direction) return undefined;
  return def.wire;
}

export function validateEventMessageTarget(
  graph: PatchGraphV1,
  message: TwinMessageV1,
  catalog: PatchModuleTypeCatalog = loadPatchModuleTypeCatalog(),
): Result<void, TwinError[]> {
  const errors: TwinError[] = [];
  if (message.wire !== 'twin:event') {
    errors.push({ code: 'E_MESSAGE', message: `expected wire twin:event, got ${message.wire}` });
  }
  if (!message.to) {
    errors.push({ code: 'E_MESSAGE', message: 'event message requires to port' });
    return err(errors);
  }
  const inWire = portWire(graph, catalog, message.to.module, message.to.port, 'in');
  if (!inWire) {
    errors.push({
      code: 'E_PROCESSOR',
      message: `unknown inlet ${message.to.module}.${message.to.port}`,
    });
  } else if (inWire !== 'twin:event') {
    errors.push({
      code: 'E_PROCESSOR',
      message: `inlet ${message.to.module}.${message.to.port} expects wire ${inWire}, not twin:event`,
    });
  }
  return errors.length ? err(errors) : ok(undefined);
}
