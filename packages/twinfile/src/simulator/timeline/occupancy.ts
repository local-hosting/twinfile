import type { ActiveSchedule, Occupancy, VisitBeatActive, VisitDef } from '../types/twinfile-time.js';

/** Flatten active schedules into space-centric occupancy rows (no actors). */
export function occupancyFromActive(active: ActiveSchedule[]): Occupancy[] {
  const rows: Occupancy[] = [];
  for (const hit of active) {
    if (!hit.uses || Object.keys(hit.uses).length === 0) continue;
    rows.push({
      schedule: hit.id,
      starts_at: hit.starts_at,
      ends_at: hit.ends_at,
      ...hit.uses,
    });
  }
  rows.sort((a, b) => a.schedule.localeCompare(b.schedule));
  return rows;
}

/** Visit beats whose `during` schedule is active at `t`. */
export function visitBeatsFromActive(visits: VisitDef[] | undefined, active: ActiveSchedule[]): VisitBeatActive[] {
  if (!visits?.length || active.length === 0) return [];
  const activeIds = new Set(active.map((a) => a.id));
  const beats: VisitBeatActive[] = [];
  for (const visit of visits) {
    if (!visit.during || !activeIds.has(visit.during)) continue;
    beats.push({
      id: visit.id,
      space: visit.space,
      kind: visit.kind,
      schedule: visit.during,
    });
  }
  beats.sort((a, b) => a.id.localeCompare(b.id));
  return beats;
}
