/** Fold common YAML mistakes (inline `{ id }` rows) into plain string lists before Zod parse. */
export function coercePlainStringList(input: unknown): unknown {
  if (!Array.isArray(input)) {
    return input;
  }
  return input.map((item) => {
    if (typeof item === 'string') {
      return item;
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const row = item as Record<string, unknown>;
      if (typeof row.id === 'string') {
        return row.id;
      }
      if (typeof row.kind === 'string' && typeof row.slug === 'string') {
        return `${row.kind}:${row.slug}`;
      }
      if (typeof row.label === 'string') {
        return row.label;
      }
    }
    return item;
  });
}
