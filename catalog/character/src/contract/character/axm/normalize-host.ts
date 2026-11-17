import type { AXMHostContext } from '../types/identity/context.js';

type HostInput = AXMHostContext & {
  axm?: string;
  ref?: string;
};

export function normalizeHostContext(input: HostInput): AXMHostContext {
  const rubricId = input.rubricId ?? input.axm ?? input.ref;
  return {
    kind: input.kind,
    ...(rubricId ? { rubricId } : {}),
    ...(input.label ? { label: input.label } : {}),
    ...(input.zoneId ? { zoneId: input.zoneId } : {}),
  };
}

export function mergeHostContexts(
  base: AXMHostContext | undefined,
  override: AXMHostContext | undefined,
): AXMHostContext | undefined {
  if (!base && !override) {
    return undefined;
  }
  if (!override) {
    return base;
  }
  if (!base) {
    return override;
  }
  return normalizeHostContext({ ...base, ...override });
}
