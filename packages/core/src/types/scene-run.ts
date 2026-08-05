/** Scene phase offsets per copied event: `schedule: { <event-id>: { <phase>: <duration> } }`. */
export type SceneSchedule = Record<string, Record<string, string>>;

/** Inline `story.scenes[].run` — compose and runner settings for one scene. */
export type SceneRun = {
  /** Place to compose; defaults to the story's single `links` `involves` place ref. */
  from?: string;
  steps?: Array<Record<string, unknown>>;
  domains?: string[];
  args?: Record<string, unknown>;
  schedule?: SceneSchedule;
  clock?: Record<string, unknown>;
  use?: Record<string, unknown>;
};

/** Scene a run unit was loaded from (`<story-dir>#<scene-id>`). */
export type LoadedScene = {
  id: string;
};
