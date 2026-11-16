export type StarterLayerKind = 'assets' | 'sensors';

/** Placeholder rows `twin init --geotype` and `twin add assets` write; authors rename them and set `space:`. */
export const STARTER_LAYER_ROWS: Readonly<Record<StarterLayerKind, readonly Record<string, unknown>[]>> = {
  assets: [{ id: 'starter-kiosk', name: 'Starter kiosk', kind: 'kiosk', state: 'active' }],
  sensors: [{ id: 'starter-sensor', name: 'Starter sensor', observes: 'occupancy' }],
};

export function isStarterLayerKind(kind: string): kind is StarterLayerKind {
  return kind in STARTER_LAYER_ROWS;
}

/** Fresh `{ <kind>: rows }` step, safe to mutate. */
export function starterLayerStep(kind: StarterLayerKind): Record<string, unknown> {
  return { [kind]: structuredClone(STARTER_LAYER_ROWS[kind]) };
}
