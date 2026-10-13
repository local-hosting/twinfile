import type { PlaceGraphEdge } from './types.js';

export type PlaceGraph = {
  edges: PlaceGraphEdge[];
  spaces: Map<string, { exposure?: string }>;
};

function spaceExposure(spaces: Map<string, { exposure?: string }>, id: string): string {
  return spaces.get(id)?.exposure ?? '(unset)';
}

export function buildPlaceGraph(mergedPlace: Record<string, unknown>): PlaceGraph {
  const spaces = new Map<string, { exposure?: string }>();
  for (const row of (mergedPlace.spaces ?? []) as Array<Record<string, unknown>>) {
    if (typeof row.id === 'string') {
      spaces.set(row.id, { exposure: typeof row.exposure === 'string' ? row.exposure : undefined });
    }
  }

  const edges: PlaceGraphEdge[] = [];
  for (const row of (mergedPlace.routes ?? []) as Array<Record<string, unknown>>) {
    const from = row.from;
    const to = row.to;
    const length_m = row.length_m;
    if (typeof from !== 'string' || typeof to !== 'string' || typeof length_m !== 'number') continue;
    const routeKind = typeof row.kind === 'string' ? row.kind : undefined;
    const edge: PlaceGraphEdge = { from, to, length_m, via: 'route', routeKind };
    edges.push(edge);
    edges.push({ ...edge, from: to, to: from });
  }

  for (const row of (mergedPlace.openings ?? []) as Array<Record<string, unknown>>) {
    if (row.state === 'closed') continue;
    const connects = row.connects;
    if (!Array.isArray(connects) || connects.length !== 2) continue;
    const [a, b] = connects;
    if (typeof a !== 'string' || typeof b !== 'string') continue;
    const edge: PlaceGraphEdge = { from: a, to: b, length_m: 0, via: 'opening' };
    edges.push(edge);
    edges.push({ from: b, to: a, length_m: 0, via: 'opening' });
  }

  return { edges, spaces };
}

type PathResult = { distance_m: number; edges: PlaceGraphEdge[] } | null;

/** Shortest path by geometric length (opening edges use profile length at loss time). */
export function shortestPath(graph: PlaceGraph, from: string, to: string, openingPathM: number): PathResult {
  if (from === to) return { distance_m: 0, edges: [] };
  if (!graph.spaces.has(from) || !graph.spaces.has(to)) return null;

  const adj = new Map<string, PlaceGraphEdge[]>();
  for (const edge of graph.edges) {
    const list = adj.get(edge.from) ?? [];
    list.push(edge);
    adj.set(edge.from, list);
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, { edge: PlaceGraphEdge; from: string }>();
  const queue = new Set<string>([from]);
  dist.set(from, 0);

  while (queue.size > 0) {
    let current: string | undefined;
    let best = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) {
        best = d;
        current = id;
      }
    }
    if (current === undefined) break;
    if (current === to) break;
    queue.delete(current);
    const base = dist.get(current) ?? Infinity;
    for (const edge of adj.get(current) ?? []) {
      const step =
        edge.via === 'opening' ? openingPathM : Math.max(edge.length_m, 0);
      const next = base + step;
      const known = dist.get(edge.to);
      if (known === undefined || next < known) {
        dist.set(edge.to, next);
        prev.set(edge.to, { edge, from: current });
        queue.add(edge.to);
      }
    }
  }

  if (!prev.has(to) && from !== to) return null;

  const pathEdges: PlaceGraphEdge[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = prev.get(cursor);
    if (!step) return null;
    pathEdges.unshift(step.edge);
    cursor = step.from;
  }

  return { distance_m: dist.get(to) ?? 0, edges: pathEdges };
}

export function exposureLossAlongPath(
  graph: PlaceGraph,
  pathSpaces: string[],
  exposureDb: Partial<Record<string, number>>,
): number {
  let total = 0;
  const seen = new Set<string>();
  for (const id of pathSpaces) {
    if (seen.has(id)) continue;
    seen.add(id);
    const key = spaceExposure(graph.spaces, id);
    total += exposureDb[key] ?? exposureDb['(unset)'] ?? 0;
  }
  return total;
}

export function spacesOnPath(from: string, to: string, edges: PlaceGraphEdge[]): string[] {
  if (from === to) return [from];
  const out = [from];
  let cursor = from;
  for (const edge of edges) {
    cursor = edge.from === cursor ? edge.to : edge.from;
    out.push(cursor);
  }
  return out;
}
