import type { MentalModel, MentalModelStack } from '../../types/strategy/mental-model.js';

const jobGroupMap = (model: MentalModel) =>
  new Map((model.jobGroups ?? []).map((g) => [g.id, g]));

/** All JTBD job ids cited above the line on a stack (flat + expanded groups). */
export function mentalModelStackJobIds(model: MentalModel, stack: MentalModelStack): string[] {
  const ids: string[] = [...(stack.jobs ?? [])];
  const groups = jobGroupMap(model);
  for (const groupId of stack.jobGroupIds ?? []) {
    const group = groups.get(groupId);
    if (group) ids.push(...group.jobs);
  }
  return ids;
}

/** @deprecated Use {@link mentalModelStackJobIds}. */
export const mentalModelStackNeedIds = mentalModelStackJobIds;

/** Every job id on the model (for uniqueness checks). */
export function mentalModelAllJobIds(model: MentalModel): string[] {
  const ids: string[] = [];
  for (const group of model.jobGroups ?? []) {
    ids.push(...group.jobs);
  }
  for (const stack of model.stacks) {
    ids.push(...(stack.jobs ?? []));
  }
  return ids;
}

/** @deprecated Use {@link mentalModelAllJobIds}. */
export const mentalModelAllNeedIds = mentalModelAllJobIds;
