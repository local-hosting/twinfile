import type { WorkbenchCatalogEntry } from './types/workbench-api.js';

export type WorkbenchCatalogTreeNode = {
  entry: WorkbenchCatalogEntry;
  children: WorkbenchCatalogTreeNode[];
};

/** Host site is the Sites trigger; the nested panel lists buildings, floors, and regions only. */
export function workbenchPlaceTreeEntries(
  scoped: WorkbenchCatalogEntry[],
  hostPlaceCatalogId: string,
): WorkbenchCatalogEntry[] {
  return scoped.filter((e) => e.id !== hostPlaceCatalogId);
}

/** Nest flat place-tree rows into parent/child nodes (order preserved per parent). */
export function buildWorkbenchCatalogTree(entries: WorkbenchCatalogEntry[]): WorkbenchCatalogTreeNode[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const childrenByParent = new Map<string, WorkbenchCatalogEntry[]>();

  for (const entry of entries) {
    if (!entry.parent || !byId.has(entry.parent)) continue;
    const siblings = childrenByParent.get(entry.parent) ?? [];
    siblings.push(entry);
    childrenByParent.set(entry.parent, siblings);
  }

  const toNode = (entry: WorkbenchCatalogEntry): WorkbenchCatalogTreeNode => ({
    entry,
    children: (childrenByParent.get(entry.id) ?? []).map(toNode),
  });

  return entries.filter((e) => !e.parent || !byId.has(e.parent)).map(toNode);
}

/** Branch ids to expand so `entryId` is visible in the accordion. */
export function workbenchCatalogBranchAncestors(
  entryId: string,
  entries: WorkbenchCatalogEntry[],
): string[] {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const ancestors: string[] = [];
  let cur = byId.get(entryId);
  while (cur?.parent && byId.has(cur.parent)) {
    ancestors.push(cur.parent);
    cur = byId.get(cur.parent);
  }
  return ancestors;
}
