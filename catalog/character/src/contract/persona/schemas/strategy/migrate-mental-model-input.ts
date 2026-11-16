/** Normalize legacy need* keys to job* before MentalModelSchema parse. */
export function migrateMentalModelInput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw;
  }
  const input = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...input };

  const legacyGroups = out.needGroups;
  if (!out.jobGroups && Array.isArray(legacyGroups)) {
    out.jobGroups = legacyGroups.map((group) => {
      if (!group || typeof group !== 'object') return group;
      const g = group as Record<string, unknown>;
      return {
        id: g.id,
        label: g.label,
        jobs: g.jobs ?? g.needs ?? [],
      };
    });
  }
  delete out.needGroups;

  if (Array.isArray(out.stacks)) {
    out.stacks = out.stacks.map((stack) => {
      if (!stack || typeof stack !== 'object') return stack;
      const s = { ...(stack as Record<string, unknown>) };
      if (!s.jobs && s.needs) s.jobs = s.needs;
      delete s.needs;
      if (!s.jobGroupIds && s.needGroupIds) s.jobGroupIds = s.needGroupIds;
      delete s.needGroupIds;
      return s;
    });
  }

  return out;
}
