/** Scene phase offsets per copied event: `schedule: { <event-id>: { <phase>: <duration> } }`. */
export type SceneSchedule = Record<string, Record<string, string>>;

/** Golden output `twin verify` compares against. */
export type SceneExpected = {
  digest?: string;
  metrics?: Record<string, number>;
};

/** Inline `story.scenes[].run` — compose and runner settings for one scene. */
export type SceneRun = {
  from: string;
  steps?: Array<Record<string, unknown>>;
  domains?: string[];
  args?: Record<string, unknown>;
  schedule?: SceneSchedule;
  clock?: Record<string, unknown>;
  use?: Record<string, unknown>;
  expected?: SceneExpected;
};

/** Scene a run unit was loaded from (`<story-dir>#<scene-id>`). */
export type LoadedScene = {
  id: string;
  expected?: SceneExpected;
};
