
import { publishSessionClockRecordsToPatch } from './publish-edges.js';
import type { PlayerPatchPublishResult } from './types/player-context.js';
import { twinfilePlayerSessionMove, type TwinfilePlayerMoveResult } from './session-move.js';
import {
  type BuildTwinfileResult,
} from '@doppler-group/twinfile-place';

export type TwinfilePlayerAdvanceBody = {
  fromT?: number;
  toT: number;
  publish?: boolean;
};

export type TwinfilePlayerAdvanceResult = TwinfilePlayerMoveResult & {
  patch?: PlayerPatchPublishResult;
};

export function twinfilePlayerAdvance(
  result: BuildTwinfileResult,
  body: TwinfilePlayerAdvanceBody,
  seed: number,
): TwinfilePlayerAdvanceResult {
  const fromT = body.fromT ?? 0;
  const moved = twinfilePlayerSessionMove(result, { fromT, toT: body.toT }, seed);
  const publish = body.publish !== false;
  const patch =
    publish && moved.clockEvents?.length
      ? publishSessionClockRecordsToPatch(result, moved.clockEvents)
      : undefined;
  return {
    ...moved,
    ...(patch ? { patch } : {}),
  };
}
