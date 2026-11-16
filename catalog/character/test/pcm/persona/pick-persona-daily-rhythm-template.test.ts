import { describe, expect, it } from 'vitest';

import type { PCM } from '../../../src/contract/persona/types/pcm.js';
import { findDailyRhythmBlock } from '../../../src/contract/persona/persona/sample-persona-daily-rhythm.js';
import { pickPersonaDailyRhythmTemplate } from '../../../src/contract/persona/persona/pick-persona-daily-rhythm-template.js';
import { pickPcmInstanceCharacteristics } from '../../../src/contract/persona/story/materialize-pcm-story-instance.js';
import { resolvePcmInstanceRandom } from '../../../src/contract/persona/story/pcm-instance-rng.js';
import { URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM } from '../../../src/contract/persona/persona/persona-daily-rhythm-presets.js';

function pcmWithVariants(): PCM {
  return {
    version: 1,
    id: 'persona:rider',
    title: 'Rider',
    revision: 1,
    persona: {
      id: 'persona:rider',
      label: 'Rider',
      quote: 'On time.',
      goals: [],
      frustrations: [],
      segment: 'commuter',
      jobIds: [],
      dailyRhythmVariants: [
        {
          id: 'rhythm:early',
          weight: 1,
          weekday: [
            {
              id: 'wake',
              label: 'Wake',
              startHour: 5,
              startMinute: 30,
              setting: 'home',
            },
            ...URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM.weekday.filter((row) => row.id !== 'wake'),
          ],
        },
        {
          id: 'rhythm:late',
          weight: 3,
          weekday: [
            {
              id: 'wake',
              label: 'Wake',
              startHour: 8,
              startMinute: 30,
              setting: 'home',
            },
            ...URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM.weekday.filter((row) => row.id !== 'wake'),
          ],
        },
      ],
    },
  };
}

describe('pickPersonaDailyRhythmTemplate', () => {
  it('picks weighted variants by random', () => {
    const pcm = pcmWithVariants();
    const early = pickPersonaDailyRhythmTemplate(pcm, () => 0.1, 'weighted');
    expect(early.variantId).toBe('rhythm:early');
    const late = pickPersonaDailyRhythmTemplate(pcm, () => 0.9, 'weighted');
    expect(late.variantId).toBe('rhythm:late');
  });
});

describe('pickPcmInstanceCharacteristics dailyRhythm', () => {
  it('is stable for the same seed and records variant id', () => {
    const pcm = pcmWithVariants();
    const random = resolvePcmInstanceRandom({ seed: 99 });
    const first = pickPcmInstanceCharacteristics(pcm, random);
    const second = pickPcmInstanceCharacteristics(pcm, resolvePcmInstanceRandom({ seed: 99 }));
    expect(first.dailyRhythm?.sourceVariantId).toBe(second.dailyRhythm?.sourceVariantId);
    expect(first.dailyRhythm?.weekday).toEqual(second.dailyRhythm?.weekday);
  });

  it('shifts wake with work_schedule attribute and journey pace', () => {
    const pcm: PCM = {
      ...pcmWithVariants(),
      persona: {
        ...pcmWithVariants().persona,
        dailyRhythm: URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM,
        dailyRhythmVariants: undefined,
        journeyPace: 'slow',
        attributes: { work_schedule: 'late' },
      },
    };
    const row = pickPcmInstanceCharacteristics(
      pcm,
      () => 0.5,
      undefined,
      { specVersion: '1.0', rhythmJitterMinutes: 0 },
    );
    const wake = findDailyRhythmBlock(row.dailyRhythm, 'wake');
    const baseline = findDailyRhythmBlock(URBAN_COMMUTER_WEEKDAY_DAILY_RHYTHM, 'wake');
    expect(wake).toBeTruthy();
    expect(baseline).toBeTruthy();
    const wakeMinutes = wake!.startHour * 60 + (wake!.startMinute ?? 0);
    const baseMinutes = baseline!.startHour * 60 + (baseline!.startMinute ?? 0);
    expect(wakeMinutes).toBeGreaterThan(baseMinutes);
  });
});
