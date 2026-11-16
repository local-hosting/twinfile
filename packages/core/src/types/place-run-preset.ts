/** Timeline playlist (scene `run.yaml`) — not a Twinfile. */
/** Scene phase offsets per copied event: `schedule: { <event-id>: { <phase>: <duration> } }`. */
export type SceneSchedule = Record<string, Record<string, string>>;

export type PlaceRunPreset = {
  id: string;
  name?: string;
  version?: string;
  stability?: string;
  from?: string;
  steps?: Array<Record<string, unknown>>;
  role?: 'run' | 'situation' | 'timetable';
  domains?: string[];
  args?: Record<string, unknown>;
  schedule?: SceneSchedule;
  clock?: Record<string, unknown>;
  use?: Record<string, unknown>;
  catalog?: Record<string, unknown>;
  layers?: string[];
};
