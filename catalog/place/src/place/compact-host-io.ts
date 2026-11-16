import type { TwinfileSummaryIoPort } from '@local-hosting/twinfile-core';

/** Sort and drop plan controls from host port lists (workbench / summary layouts). */
export function compactHostIo(io: {
  inputs: TwinfileSummaryIoPort[];
  outputs: TwinfileSummaryIoPort[];
}): { inputs: TwinfileSummaryIoPort[]; outputs: TwinfileSummaryIoPort[] } {
  const inputs = io.inputs
    .filter((p) => p.kind !== 'control' && !p.id.startsWith('control.'))
    .sort((a, b) => a.label.localeCompare(b.label));
  const outputs = [...io.outputs].sort((a, b) => a.label.localeCompare(b.label));
  return { inputs, outputs };
}
