import type { DramaticBeatId } from '../types/dramatic-beat.js';
import type { StoryArcKind } from '../types/story-arc-kind.js';
import type { StoryArcAct } from '../types/story-arc-template.js';
import type { Story } from '../types/story-narrative.js';
import { defaultActsForStoryArcKind } from '../story-arc/write-practice-presets.js';

export type ValidateStoryStoryArcResult = { ok: true } | { ok: false; issues: string[] };

function sortedActs(acts: StoryArcAct[]): StoryArcAct[] {
  return [...acts].sort((a, b) => a.order - b.order);
}

function validateActsRail(acts: StoryArcAct[], issues: string[], prefix: string): Map<DramaticBeatId, number> | undefined {
  if (acts.length < 2) {
    issues.push(`${prefix}: arcTemplate.acts requires at least 2 beats (exposition through denouement)`);
    return undefined;
  }

  const sorted = sortedActs(acts);
  const idSet = new Set<string>();
  const orderByBeat = new Map<DramaticBeatId, number>();

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (idSet.has(row.id)) {
      issues.push(`${prefix}: duplicate act id "${row.id}"`);
    }
    idSet.add(row.id);

    if (row.order !== i) {
      issues.push(
        `${prefix}: act orders must be contiguous from 0 (expected order ${i} for "${row.id}", got ${row.order})`,
      );
    }
    orderByBeat.set(row.id, row.order);
  }

  if (sorted[0]?.id !== 'exposition') {
    issues.push(`${prefix}: first act must be exposition (story setup)`);
  }
  if (sorted.at(-1)?.id !== 'denouement') {
    issues.push(`${prefix}: last act must be denouement (resolution)`);
  }

  return orderByBeat;
}

function isBeatSubsequence(subset: DramaticBeatId[], full: DramaticBeatId[]): boolean {
  let index = 0;
  for (const beat of subset) {
    while (index < full.length && full[index] !== beat) {
      index += 1;
    }
    if (index >= full.length) {
      return false;
    }
    index += 1;
  }
  return true;
}

function validateActsMatchArcKind(kind: StoryArcKind, acts: StoryArcAct[], issues: string[], prefix: string): void {
  const expected = defaultActsForStoryArcKind(kind);
  const expectedIds = sortedActs(expected).map((row) => row.id);
  const actualIds = sortedActs(acts).map((row) => row.id);

  for (const beat of actualIds) {
    if (!expectedIds.includes(beat)) {
      issues.push(`${prefix}: act "${beat}" is not used on the "${kind}" Write Practice arc`);
    }
  }

  if (!isBeatSubsequence(actualIds, expectedIds)) {
    issues.push(
      `${prefix}: arcTemplate.acts must follow the "${kind}" beat order (subset of ${expectedIds.join(' → ')})`,
    );
  }
}

/**
 * Storyboard episodes must follow the declared Write Practice arc:
 * contiguous beats, exposition → denouement, scenes only move forward on the rail, every beat has a frame.
 */
export function validateStoryNarrativeStoryArc(story: Story): ValidateStoryStoryArcResult {
  const scenes = story.scenes;
  const issues: string[] = [];
  const prefix = `Story ${story.id}`;

  const arc = story.arcTemplate;
  if (!arc.kind) {
    issues.push(`${prefix}: arcTemplate.kind is required`);
  }

  const orderByBeat = validateActsRail(arc.acts ?? [], issues, prefix);
  if (arc.kind && arc.acts?.length) {
    validateActsMatchArcKind(arc.kind, arc.acts, issues, prefix);
  }

  if (!orderByBeat) {
    return { ok: false, issues };
  }

  const sceneOrders = new Set<number>();
  for (const scene of scenes) {
    if (sceneOrders.has(scene.order)) {
      issues.push(`${prefix}: duplicate scene order ${scene.order}`);
    }
    sceneOrders.add(scene.order);

    if (!scene.actId) {
      issues.push(`${prefix}: scene ${scene.id} requires actId on the arcTemplate beat rail`);
      continue;
    }

    const beat = scene.actId as DramaticBeatId;
    if (!orderByBeat.has(beat)) {
      issues.push(`${prefix}: scene ${scene.id} actId "${scene.actId}" is not on arcTemplate.acts`);
    }
  }

  const scenesByOrder = [...scenes].sort((a, b) => a.order - b.order);
  let lastActOrder = -1;
  for (const scene of scenesByOrder) {
    if (!scene.actId) {
      continue;
    }
    const beat = scene.actId as DramaticBeatId;
    const actOrder = orderByBeat.get(beat);
    if (actOrder === undefined) {
      continue;
    }
    if (actOrder < lastActOrder) {
      issues.push(
        `${prefix}: scene ${scene.id} regresses the arc (act "${beat}" before a later beat in scene order)`,
      );
    }
    lastActOrder = Math.max(lastActOrder, actOrder);
  }

  if (scenesByOrder[0]?.actId && scenesByOrder[0].actId !== 'exposition') {
    issues.push(`${prefix}: first scene (order ${scenesByOrder[0].order}) should use actId exposition`);
  }

  const lastScene = scenesByOrder.at(-1);
  if (lastScene?.actId && lastScene.actId !== 'denouement') {
    issues.push(`${prefix}: last scene (order ${lastScene.order}) should use actId denouement`);
  }

  const beatsUsed = new Set<DramaticBeatId>();
  for (const scene of scenes) {
    if (scene.actId) {
      beatsUsed.add(scene.actId as DramaticBeatId);
    }
  }
  for (const act of sortedActs(arc.acts ?? [])) {
    if (!beatsUsed.has(act.id)) {
      issues.push(`${prefix}: arc beat "${act.id}" has no scene — add a frame or remove the beat from arcTemplate.acts`);
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
