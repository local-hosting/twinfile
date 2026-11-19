/** Place unit `geotype` block (Twinfile twinfile). */
export type GeotypeTwinfile = {
  primary: string;
  registry?: string;
};

export function parseGeotypeTwinfile(twinfile: Record<string, unknown>): GeotypeTwinfile | null {
  const raw = twinfile.geotype;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const block = raw as Record<string, unknown>;
  const primary = block.primary;
  if (typeof primary !== 'string' || !primary.trim()) return null;
  const registry = block.registry;
  const out: GeotypeTwinfile = { primary: primary.trim() };
  if (typeof registry === 'string' && registry.trim()) {
    out.registry = registry.trim();
  }
  return out;
}
