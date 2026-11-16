export type PathQueryInput = {
  from?: string;
  to?: string;
  /** Spaces reachable from every space tagged with this role. */
  role?: string;
  /** Omit stairs and any edge marked `step_free: false`. */
  step_free?: boolean;
};

export type PlacePath = {
  spaces: string[];
  openings: string[];
  routes: string[];
  length_m: number;
};

export type PathQueryResult =
  | { mode: 'path'; path: PlacePath | null }
  | { mode: 'reachable'; role: string; spaces: string[] };

type Row = Record<string, unknown>;
type Edge = { to: string; length_m: number; opening?: string; route?: string };

function rows(place: Record<string, unknown>, key: string): Row[] {
  const value = place[key];
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Row => !!row && typeof row === 'object' && !Array.isArray(row));
}

function spaceIds(place: Record<string, unknown>): Set<string> {
  return new Set(rows(place, 'spaces').flatMap((row) => (typeof row.id === 'string' ? [row.id] : [])));
}

function openingWalkable(row: Row, stepFree: boolean): boolean {
  if (row.state !== 'open') return false;
  if (stepFree && row.step_free === false) return false;
  return true;
}

function routeWalkable(row: Row, stepFree: boolean): boolean {
  if (typeof row.from !== 'string' || typeof row.to !== 'string' || typeof row.length_m !== 'number') return false;
  if (!stepFree) return true;
  if (row.kind === 'stair' || row.step_free === false) return false;
  return true;
}

function link(adj: Map<string, Edge[]>, from: string, to: string, edge: Omit<Edge, 'to'>): void {
  const forward = adj.get(from) ?? [];
  forward.push({ ...edge, to });
  adj.set(from, forward);
  const back = adj.get(to) ?? [];
  back.push({ ...edge, to: from });
  adj.set(to, back);
}

function buildAdjacency(place: Record<string, unknown>, stepFree: boolean): Map<string, Edge[]> {
  const known = spaceIds(place);
  const adj = new Map<string, Edge[]>();
  const openings = rows(place, 'openings')
    .filter((row) => openingWalkable(row, stepFree))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  for (const row of openings) {
    const connects = row.connects;
    if (!Array.isArray(connects) || connects.length !== 2) continue;
    const [a, b] = connects;
    if (typeof a !== 'string' || typeof b !== 'string' || !known.has(a) || !known.has(b)) continue;
    if (typeof row.id !== 'string') continue;
    link(adj, a, b, { length_m: 0, opening: row.id });
  }
  const routes = rows(place, 'routes')
    .filter((row) => routeWalkable(row, stepFree))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  for (const row of routes) {
    const from = row.from as string;
    const to = row.to as string;
    if (!known.has(from) || !known.has(to) || typeof row.id !== 'string') continue;
    link(adj, from, to, { length_m: row.length_m as number, route: row.id });
  }
  return adj;
}

function shortestPath(adj: Map<string, Edge[]>, from: string, to: string): PlacePath | null {
  if (from === to) return { spaces: [from], openings: [], routes: [], length_m: 0 };
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { edge: Edge; from: string }>();
  const queue = new Set<string>([from]);
  while (queue.size > 0) {
    let current = '';
    let best = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) {
        best = d;
        current = id;
      }
    }
    if (!current || current === to) break;
    queue.delete(current);
    const base = dist.get(current) ?? Infinity;
    for (const edge of adj.get(current) ?? []) {
      const next = base + edge.length_m;
      const known = dist.get(edge.to);
      if (known === undefined || next < known) {
        dist.set(edge.to, next);
        prev.set(edge.to, { edge, from: current });
        queue.add(edge.to);
      }
    }
  }
  if (!prev.has(to)) return null;
  const spaces = [to];
  const openings: string[] = [];
  const routes: string[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = prev.get(cursor);
    if (!step) return null;
    if (step.edge.opening) openings.unshift(step.edge.opening);
    if (step.edge.route) routes.unshift(step.edge.route);
    cursor = step.from;
    spaces.unshift(cursor);
  }
  return { spaces, openings, routes, length_m: dist.get(to) ?? 0 };
}

function reachableSpaces(adj: Map<string, Edge[]>, starts: string[]): string[] {
  const seen = new Set<string>(starts);
  const queue = [...starts];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const edge of adj.get(current) ?? []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push(edge.to);
    }
  }
  return [...seen].sort();
}

/** Shortest walk on the merged place, or the spaces reachable from a role. */
export function queryPath(place: Record<string, unknown>, input: PathQueryInput): PathQueryResult {
  const stepFree = input.step_free === true;
  const adj = buildAdjacency(place, stepFree);
  if (input.role && input.from === undefined && input.to === undefined) {
    const starts = rows(place, 'spaces').flatMap((row) => {
      if (typeof row.id !== 'string' || !Array.isArray(row.roles) || !row.roles.includes(input.role)) return [];
      return [row.id];
    });
    return { mode: 'reachable', role: input.role, spaces: reachableSpaces(adj, starts) };
  }
  if (typeof input.from !== 'string' || typeof input.to !== 'string') {
    throw new Error('path query needs from and to, or a role');
  }
  const known = spaceIds(place);
  if (!known.has(input.from) || !known.has(input.to)) return { mode: 'path', path: null };
  return { mode: 'path', path: shortestPath(adj, input.from, input.to) };
}
