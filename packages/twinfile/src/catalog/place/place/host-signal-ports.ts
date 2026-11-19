import type { PlaceDataPortV1 } from '@local-hosting/twinfile';
import type { TwinfileSummaryIoPort } from '@local-hosting/twinfile';

/** Prose label for a host signal wire (`signal:rain` → `Rain`). */
export function labelFromSignalWire(wire: string): string {
  if (wire === 'place:merged') return 'Place snapshot';
  const tail = wire.startsWith('signal:') ? wire.slice('signal:'.length) : wire.replace(/^place:/, '');
  if (!tail) return wire;
  return tail
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function hostPortFromHubInlet(row: PlaceDataPortV1): TwinfileSummaryIoPort {
  const label = labelFromSignalWire(row.wire);
  return {
    id: row.wire,
    label,
    kind: row.wire,
    detail: `${label} column (${row.port} on ${row.module})`,
  };
}

export function hostPortFromHubOutlet(row: PlaceDataPortV1): TwinfileSummaryIoPort {
  const label = labelFromSignalWire(row.wire);
  return {
    id: row.wire,
    label,
    kind: row.wire,
    detail: `${label} column (${row.port} on ${row.module})`,
  };
}

export function hostPortFromLogicalWire(_logicalId: string, wire: string, detail: string): TwinfileSummaryIoPort {
  const label = labelFromSignalWire(wire);
  return {
    id: wire,
    label,
    kind: wire,
    detail: detail || label,
  };
}

/** Drop plan-instance controls; host columns are reusable signal wires only. */
export function sanitizeHostIo(io: {
  inputs: TwinfileSummaryIoPort[];
  outputs: TwinfileSummaryIoPort[];
}): { inputs: TwinfileSummaryIoPort[]; outputs: TwinfileSummaryIoPort[] } {
  const isPlanControl = (p: TwinfileSummaryIoPort) =>
    p.kind === 'control' || p.id.startsWith('control.') || p.id.startsWith('control:');
  const isModulePath = (p: TwinfileSummaryIoPort) => p.id.includes('.') && !p.id.includes(':');
  return {
    inputs: io.inputs.filter((p) => !isPlanControl(p) && !isModulePath(p)),
    outputs: io.outputs.filter((p) => !isPlanControl(p) && !isModulePath(p)),
  };
}
