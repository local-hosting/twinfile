import { briefSection, joinBriefSections } from './format-brief.js';
import type { AxmSegmentBriefRowV1, BriefV1 } from './types.js';

/** Experience-segment brief for org catalog tools (human terms only). */
export function buildAxmSegmentBrief(input: {
  segments: readonly AxmSegmentBriefRowV1[];
}): BriefV1 {
  const ids = input.segments.map((row) => row.segmentId.trim()).filter(Boolean);
  const segmentBullets =
    ids.length > 0
      ? ids.map((id) => `\`${id}\` — experience segment for story character placement`)
      : ['No experience segments in the org catalog'];

  return joinBriefSections('Experience brief — org segment catalog', [
    briefSection('Summary', [
      `${ids.length} experience segment(s) available for character placement on a story`,
    ]),
    briefSection('Segments', segmentBullets),
  ]);
}
