import type { TwinMessageV1 } from '../../types/twin-message.js';
import type { PatchMessageBus } from '../patch-message-bus.js';
import { patchCordId } from '../processor-graph-edit.js';
import type { PatchGraphModel } from './patch-graph-model.js';
import type { PatchNodeHandler } from '../../types/patch-program.js';

export function routeOneHop(
  graph: PatchGraphModel,
  bus: PatchMessageBus,
  message: TwinMessageV1,
  cuts?: Set<string>,
  handlers?: Map<string, PatchNodeHandler>,
): TwinMessageV1[] {
  if (!message.to) return [];
  const delivered: TwinMessageV1[] = [message];
  bus.publish(message);

  const moduleId = message.to.module;
  const port = message.to.port;
  const handler = handlers?.get(moduleId);
  if (handler) {
    const outs = handler(port, message);
    if (outs?.length) {
      for (const out of outs) {
        delivered.push(...routeOneHop(graph, bus, out, cuts, handlers));
      }
    }
  }

  const endpoint = { module: moduleId, port };
  for (const conn of graph.outletsFrom(endpoint)) {
    const id = patchCordId(conn.from, conn.to);
    if (cuts?.has(id)) continue;
    const next: TwinMessageV1 = {
      ...message,
      from: { module: conn.from.module, port: conn.from.port },
      to: { module: conn.to.module, port: conn.to.port },
    };
    delivered.push(...routeOneHop(graph, bus, next, cuts, handlers));
  }
  return delivered;
}
