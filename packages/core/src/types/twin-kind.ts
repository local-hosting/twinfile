/** Published twin types (four canvas models). Runs live on story scenes — not a twin kind. */
export type TwinKind = 'place' | 'resource' | 'character' | 'story';

export const TWIN_HEAD_FILES: Record<TwinKind, string> = {
  place: 'Place.yaml',
  resource: 'Resource.yaml',
  character: 'Character.yaml',
  story: 'Story.yaml',
};

/** Scene run heads (under `story/.../scenes/<id>/`) — one-release `Event.yaml` / `preset.yaml`. */
export const RUN_PRESET_NAMES = [
  'run.yaml',
  'Run.yaml',
  'Event.yaml',
  'event.yaml',
  'preset.yaml',
  'Preset.yaml',
] as const;