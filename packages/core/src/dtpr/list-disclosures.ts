export type DtprDisclosureRow = {
  collection: string;
  id: string;
  name?: string;
  dtpr: unknown;
};

const COLLECTION_KEYS = ['sensors', 'ai', 'assets'] as const;

type IdRow = { id: string; name?: string; dtpr?: unknown };

export function listDtprDisclosures(mergedPlace: Record<string, unknown>): DtprDisclosureRow[] {
  const rows: DtprDisclosureRow[] = [];
  for (const key of COLLECTION_KEYS) {
    const list = mergedPlace[key];
    if (!Array.isArray(list)) continue;
    for (const row of list as IdRow[]) {
      if (row.dtpr === undefined) continue;
      rows.push({
        collection: key,
        id: row.id,
        ...(row.name ? { name: row.name } : {}),
        dtpr: row.dtpr,
      });
    }
  }
  return rows;
}
