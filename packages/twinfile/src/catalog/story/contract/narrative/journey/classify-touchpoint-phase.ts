import type { EpisodePhaseId } from '../types/episode-arc.js';
import type { TouchpointIndex, TouchpointIndexEntry } from '../types/touchpoint-index.js';
import { touchpointIndexMap } from '../types/touchpoint-index.js';

export function classifyTouchpointPhase(
  touchpointId: string,
  index?: TouchpointIndex,
): EpisodePhaseId {
  const node: TouchpointIndexEntry | undefined = index
    ? touchpointIndexMap(index).get(touchpointId)
    : undefined;

  const phase = node?.journeyPhase?.trim() ?? '';
  if (/pre.?visit/i.test(phase)) return 'pre_visit';
  if (/post.?visit|leaving/i.test(phase)) return 'post_visit';
  if (/on.?site|arriving|waiting/i.test(phase)) return 'on_site';

  if (node?.locus === 'physical' || node?.locus === 'blended') {
    return 'on_site';
  }

  if (/nps|followup|follow-up|mobile-app|smart-appts/i.test(touchpointId)) {
    return 'post_visit';
  }

  if (/buyflow|dotcom|finder|search|mailer|email|sms|hero|pricing|booking|maps/i.test(touchpointId)) {
    return 'pre_visit';
  }

  if (/rider-open-home|set-dest|confirm-dest|dotcom|app|home/i.test(touchpointId)) {
    return 'pre_visit';
  }

  if (/live-map|wait|pickup|curbside|on-?site/i.test(touchpointId)) {
    return 'on_site';
  }

  return node?.locus === 'digital' ? 'pre_visit' : 'on_site';
}
