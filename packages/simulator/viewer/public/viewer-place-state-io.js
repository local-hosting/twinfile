/** Match `@local-hosting/twinfile-core` `sanitizeHostIo` filter for the examples viewer. */
export function placeStateIo(io) {
  if (!io) return { inputs: [], outputs: [] };
  const isPlanControl = (p) =>
    p.kind === 'control' || p.id.startsWith('control.') || p.id.startsWith('control:');
  const isModulePath = (p) => p.id.includes('.') && !p.id.includes(':');
  const keep = (p) => !isPlanControl(p) && !isModulePath(p);
  const inputs = (io.inputs || []).filter(keep).sort((a, b) => a.label.localeCompare(b.label));
  const outputs = (io.outputs || []).filter(keep).sort((a, b) => a.label.localeCompare(b.label));
  return { inputs, outputs };
}
