import {
  twinfilePlayerAdvance,
  type TwinfilePlayerAdvanceBody,
  type TwinfilePlayerMoveResult,
} from '@local-hosting/twinfile/simulator/host';

import type { WorkbenchContextPulseResponse } from '../../types/workbench-environment.js';
import {
  type BuildTwinfileResult,
} from '@local-hosting/twinfile/place';

export type ViewerSessionAdvanceBody = TwinfilePlayerAdvanceBody & {
  seed?: number;
};

export type ViewerSessionAdvancePayload = TwinfilePlayerMoveResult & {
  schema: 'twinfile.viewer.session.advance.v1';
  digest: string;
  pulse?: WorkbenchContextPulseResponse;
};

function toWorkbenchPulse(
  patch: NonNullable<ReturnType<typeof twinfilePlayerAdvance>['patch']>,
): WorkbenchContextPulseResponse {
  if (patch.ok) {
    return {
      schema: 'twinfile.viewer.context.pulse.v1',
      ok: true,
      messageCount: patch.messageCount,
      wires: patch.wires,
    };
  }
  return {
    schema: 'twinfile.viewer.context.pulse.v1',
    ok: false,
    messageCount: 0,
    wires: [],
    error: patch.error,
  };
}

export function viewerSessionAdvance(
  result: BuildTwinfileResult,
  body: ViewerSessionAdvanceBody,
  seed: number,
): ViewerSessionAdvancePayload {
  const advanced = twinfilePlayerAdvance(result, body, seed);
  return {
    schema: 'twinfile.viewer.session.advance.v1',
    digest: result.digest,
    ...advanced,
    ...(advanced.patch ? { pulse: toWorkbenchPulse(advanced.patch) } : {}),
  };
}
