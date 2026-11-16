/** Published twin types (four canvas models). Runs live on story scenes — not a twin kind. */
export type TwinKind = 'place' | 'resource' | 'character' | 'story';

/** Unit head suffix: `<unit>/<unit>.twin.yaml`. */
export { TWIN_HEAD_SUFFIX } from '@doppler-group/twinfile-bridge';

/** Scene run head (under `story/.../scenes/<id>/`). */
export const RUN_PRESET_NAMES = ['run.yaml'] as const;
