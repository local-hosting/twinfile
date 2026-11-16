import {
  formatDirectorDenouementClosing,
  formatJobPursuitPhrase,
  resolveEffectiveEpisodeTiming,
} from './resolve-story-arc-narrative.js';
import { buildStorySituationsNarrativeContext } from './story-situations-narrative-context.js';
import { buildStoryboardSceneContext, findSamSceneForTouchpoint } from './storyboard-scene-context.js';
import type { DirectorScriptSceneV1, FormatStoryDirectorNarrativeInput } from './storyboard-types.js';
import { resolveScenePlaceForReader, sanitizeReaderProductionPhrase } from './resolve-scene-place-for-reader.js';
import { resolveStoryEpisodePresentation } from './resolve-story-episode-presentation.js';

function readerActionLine(
  scene: DirectorScriptSceneV1,
  protagonistName: string,
  protagonistDescriptor: string,
): string {
  const raw = scene.action.trim();
  const withName = raw.replaceAll(protagonistDescriptor, protagonistName);
  return sanitizeReaderProductionPhrase(withName);
}

/**
 * Plot-only synopsis for humans and agents — no camera, props, or wire ids.
 */
export function formatStoryReaderSynopsisLines(
  input: FormatStoryDirectorNarrativeInput,
  scriptScenes: readonly DirectorScriptSceneV1[],
): string[] {
  const ctx = buildStoryboardSceneContext(input);
  const { snapshot } = input;
  const arc = snapshot.when?.storyArc;
  const presentation =
    input.presentation ??
    resolveStoryEpisodePresentation({ journey: input.journey, story: input.story, arc });
  const touchpointIds = presentation.scriptTouchpointIds.map((id) => id.trim()).filter(Boolean);

  const jsmNarrative =
    input.jsmNarrative ??
    buildStorySituationsNarrativeContext({
      jsm: input.jsm,
      journey: input.journey,
      character: input.character,
      personaGoals: input.personaGoals,
      personaFrustrations: input.personaFrustrations,
      personaQuote: input.personaQuote,
    });

  const lines: string[] = ['## Story (brief)', ''];

  const goal =
    input.journey?.journeyGoal?.trim() ||
    snapshot.storyPitch?.trim() ||
    ctx.storyPitch?.trim();
  if (goal) {
    lines.push(`**${ctx.protagonistName}** — ${goal.replace(/\.$/, '')}.`);
  } else {
    lines.push(`**${ctx.protagonistName}** moves through one continuous episode of this arc.`);
  }

  const jobPursuit = formatJobPursuitPhrase({ journey: input.journey, jsmNarrative });
  if (jobPursuit) {
    lines.push('');
    lines.push(`Through-line: ${jobPursuit}`);
  }

  if (scriptScenes.length > 0) {
    lines.push('');
    lines.push('**What happens**');
    touchpointIds.forEach((touchpointId, index) => {
      const scene = scriptScenes[index];
      if (!scene) return;
      const samScene = findSamSceneForTouchpoint(input.story, touchpointId);
      const place = resolveScenePlaceForReader({
        touchpointId,
        story: input.story,
        samScene,
        journey: input.journey,
        slugline: scene.slugline,
      });
      const action = readerActionLine(scene, ctx.protagonistName, ctx.protagonistDescriptor);
      lines.push(`${index + 1}. **${place}** — ${action}`);
    });
  }

  const episodeTiming = resolveEffectiveEpisodeTiming({
    journey: input.journey,
    story: input.story,
    arc,
    rankedJobCount: jsmNarrative.rankedJobs.length,
  });
  const lastTouchpointId = touchpointIds[touchpointIds.length - 1];
  const lastLabel = lastTouchpointId
    ? scriptScenes[touchpointIds.length - 1]?.storyboard.caption ||
      findSamSceneForTouchpoint(input.story, lastTouchpointId)?.label
    : undefined;
  const closing = formatDirectorDenouementClosing({
    timing: episodeTiming,
    lastTouchpointLabel: lastLabel,
  });
  if (closing) {
    lines.push('');
    lines.push(closing.replace(/^(\*\*Ending:\*\*)/, '**How it lands:**'));
  }

  lines.push('');
  lines.push(
    '_Reader view: use this section for plot. **Script** below is production staging (camera, look, props)._',
  );
  lines.push('');

  return lines;
}
