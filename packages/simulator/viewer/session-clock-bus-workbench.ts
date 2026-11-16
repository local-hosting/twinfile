import type { SessionClockNote } from '@doppler-group/twinfile-simulator';

import type { WorkbenchContextPulseResponse } from './types/workbench-environment.js';
import type { WorkbenchSessionSample } from './types/workbench-api.js';

export type SessionClockChrome = {
  localAt: string;
  patch?: WorkbenchContextPulseResponse;
  lastEvent?: string;
};

export function sessionSampleFromNote(
  note: SessionClockNote,
  chrome?: SessionClockChrome,
): WorkbenchSessionSample {
  const occupancySpaceIds = note.sample.occupancy
    .map((row) => row.space)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  return {
    playheadT: note.t,
    localAt: chrome?.localAt ?? '',
    mode: note.sample.mode,
    activeIds: note.sample.active.map((row) => row.id),
    occupancySpaceIds,
    occupancyCount: note.sample.occupancy.length,
    visitBeatCount: note.sample.visit_beats.length,
    noteIndex: note.index,
    ...(chrome?.lastEvent ? { lastEvent: chrome.lastEvent } : {}),
    ...(chrome?.patch?.ok
      ? { bus: { messageCount: chrome.patch.messageCount, wires: chrome.patch.wires } }
      : {}),
  };
}

export function mergeSessionClockChrome(
  sample: WorkbenchSessionSample | null,
  chrome: SessionClockChrome,
): WorkbenchSessionSample | null {
  if (!sample) {
    return {
      playheadT: 0,
      localAt: chrome.localAt,
      mode: 'place',
      activeIds: [],
      occupancySpaceIds: [],
      occupancyCount: 0,
      visitBeatCount: 0,
      ...(chrome.lastEvent ? { lastEvent: chrome.lastEvent } : {}),
      ...(chrome.patch?.ok
        ? { bus: { messageCount: chrome.patch.messageCount, wires: chrome.patch.wires } }
        : {}),
    };
  }
  return {
    ...sample,
    localAt: chrome.localAt,
    ...(chrome.lastEvent ? { lastEvent: chrome.lastEvent } : {}),
    ...(chrome.patch?.ok
      ? { bus: { messageCount: chrome.patch.messageCount, wires: chrome.patch.wires } }
      : {}),
  };
}
