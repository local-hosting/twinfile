/** Inherited vs this unit (Docker `FROM` chain vs local `steps:`). */
export function formatBuildLayerScope(ref: string): 'inherited' | 'local' {
  if (ref.startsWith('from/') || ref.startsWith('with/')) return 'inherited';
  return 'local';
}

function formatStepKeys(stepIndex: string, keys: string): string {
  const keyLabel = keys.includes('+') ? keys.split('+').join(', ') : keys;
  return `Step ${stepIndex} · ${keyLabel}`;
}

/** Short label for CLI / workbench; full `ref` stays in logs and `twin layers` output. */
export function formatBuildLayerStepLabel(ref: string): string {
  const fromPatch = ref.match(/^from\/([^/]+)\/patch\/(\d+)\/(.+)$/);
  if (fromPatch) return formatStepKeys(fromPatch[2], fromPatch[3]);

  const withPatch = ref.match(/^with\/([^/]+)\/patch\/(\d+)\/(.+)$/);
  if (withPatch) return formatStepKeys(withPatch[2], withPatch[3]);

  const withPath = ref.match(/^with\/([^/]+)\/(.+)$/);
  if (withPath && !withPath[2].startsWith('patch/')) return `Step · ${withPath[2]}`;

  const copyNested = ref.match(/^copy\/([^/]+)\/patch\/(\d+)\/(.+)$/);
  if (copyNested) {
    const keys = copyNested[3].includes('+') ? copyNested[3].split('+').join(', ') : copyNested[3];
    return `Copy ${copyNested[1]} · step ${copyNested[2]} · ${keys}`;
  }

  if (/^copy\/\d+$/.test(ref)) return `Step ${ref.slice(5)} · copy`;

  const copyGroup = ref.match(/^copy\/([^/]+)$/);
  if (copyGroup && !/^\d+$/.test(copyGroup[1]!)) return `Copy · ${copyGroup[1]}`;

  if (ref === 'axes') return 'Step · derive archetype';

  if (ref.startsWith('bind/')) return `Bind · ${ref.slice(5)}`;
  if (ref.startsWith('plan/')) return `Bind · ${ref.slice(5)}`;

  const patch = ref.match(/^patch\/(\d+)\/(.+)$/);
  if (patch) return formatStepKeys(patch[1], patch[2]);

  if (ref === 'scenario/args') return 'Step · args';
  if (ref.startsWith('scenario/')) return `Scenario · ${ref.slice('scenario/'.length)}`;

  if (ref.includes('/') && !ref.includes('://')) return `Step · ${ref}`;

  return ref;
}
