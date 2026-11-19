import { describe, expect, it } from 'vitest';
import {
  buildDirectorScriptScenes,
  formatStoryDirectorNarrative,
  humanizeStoryWireLabel,
} from '../../../../../src/contract/narrative/brief/format-story-director-narrative.js';
import { storyboardStoryFixture } from '../helpers/storyboard-story-fixture.js';

describe('humanizeStoryWireLabel', () => {
  it('humanizes touchpoint ids', () => {
    expect(humanizeStoryWireLabel('touchpoint:rider-open-home')).toBe('Open Home');
  });
});

describe('formatStoryDirectorNarrative', () => {
  it('renders script beats and director commentary for a commute episode', () => {
    const text = formatStoryDirectorNarrative({
      snapshot: {
        storyId: 'rider-urban-commuter-3',
        characterId: 'rider-urban-commuter-3',
        storyPitch: 'A rider threads the city from home to destination.',
        who: { characterId: 'persona:rider', displayName: 'Maya' },
        what: { storyId: 'story:rider-commute' },
        when: {
          simulationEpochStart: '2026-01-06',
          planningHorizonDays: 56,
          storyArc: {
            version: 1,
            simulationEpochStart: '2026-01-06',
            planningHorizonDays: 56,
            visitDayIndex: 28,
            objectiveTouchpointIds: [
              'touchpoint:rider-open-home',
              'touchpoint:rider-set-dest',
              'touchpoint:rider-confirm-dest',
              'touchpoint:rider-live-map',
            ],
            phases: {
              pre_visit: { startDayIndex: 0, endDayIndex: 27 },
              on_site: { dayIndex: 28 },
              post_visit: { startDayIndex: 29, endDayIndex: 55 },
            },
            touchpointSchedule: [],
          },
        },
      },
      character: { characterId: 'rider-urban-commuter-3', name: 'Maya' },
      story: storyboardStoryFixture({
        arcTemplate: {
          id: 'arc:commute-three-beat',
          label: 'Commute arc',
          kind: 'man_in_a_hole',
          acts: [
            { id: 'exposition', label: 'Plan', order: 0 },
            { id: 'rising_action', label: 'Request', order: 1 },
            { id: 'denouement', label: 'Arrive', order: 2 },
          ],
        },
        places: [
          { placeRef: 'twinfile/place/demo-home:0.0.0', label: 'Home dropoff', role: 'destination' },
          { placeRef: 'twinfile/place/demo-airport:0.0.0', label: 'Curbside pickup', role: 'pickup' },
        ],
      }),
      journey: {
        id: 'journey:rider-commute',
        journeyGoal: 'Arrive at work on time with predictable pickup',
        label: 'Rider morning commute',
        characterId: 'persona:rider',
        phases: [
          {
            id: 'phase:plan',
            label: 'Plan',
            order: 0,
            jobIds: ['job:commute-work'],
            touchpointIds: ['touchpoint:rider-open-home', 'touchpoint:rider-set-dest'],
            emotions: {},
          },
          {
            id: 'phase:ride',
            label: 'Wait & ride',
            order: 1,
            jobIds: ['job:wait-eta'],
            touchpointIds: ['touchpoint:rider-confirm-dest', 'touchpoint:rider-live-map'],
            emotions: {},
          },
        ],
      },
    });

    expect(text).toContain('## Protagonist');
    expect(text).toContain('## Story (brief)');
    expect(text).toContain('**What happens**');
    expect(text).toContain('tracking pickup and ETA on the live map');
    expect(text).not.toMatch(/In-vehicle or sidewalk/i);
    expect(text).not.toContain('Airport pickup');
    expect(text).toContain('### What drives Maya');
    expect(text).toContain('### Where we find Maya');
    expect(text).toContain('## Script');
    expect(text).toContain('### Scene 1');
    expect(text).toContain('**Storyboard**');
    expect(text).toContain('- **Setting:**');
    expect(text).toContain('- **Duration:**');
    expect(text).toContain('- **Camera:**');
    expect(text).toContain('- **Visual:**');
    expect(text).toContain('- **Caption:**');
    expect(text).toContain('sec on screen');

    const scenes = buildDirectorScriptScenes({
      snapshot: {
        storyId: 'rider-urban-commuter-3',
        when: {
          storyArc: {
            version: 1,
            simulationEpochStart: '2026-01-06',
            planningHorizonDays: 56,
            visitDayIndex: 28,
            objectiveTouchpointIds: ['touchpoint:rider-open-home'],
            phases: {
              pre_visit: { startDayIndex: 0, endDayIndex: 27 },
              on_site: { dayIndex: 28 },
              post_visit: { startDayIndex: 29, endDayIndex: 55 },
            },
            touchpointSchedule: [],
          },
        },
      },
      character: { characterId: 'rider-urban-commuter-3', name: 'Maya' },
    });
    expect(scenes[0]?.storyboard.visual).toBeTruthy();
    expect(scenes[0]?.storyboard.caption).toBeTruthy();
    expect(text).toContain('INT. HOME — MORNING');
    expect(text).toContain('EXT. CITY STREET — DAY');
    expect(text).toContain('## Director');
    expect(text).not.toContain('56-day episode');
    expect(text).not.toContain('store visit');
    expect(text).toContain('single session');
    expect(text).toContain('**Ending:**');
    expect(text).not.toContain('Story episode');
    expect(text).not.toContain('did:locker:');
  });

  it('weaves Story scene situation and character demographics into storyboards', () => {
    const story = storyboardStoryFixture({
      scenes: [
        {
          id: 'scene:plan',
          label: 'Plan commute',
          order: 0,
          actId: 'exposition',
          characterIds: ['persona:rider'],
          placeRef: 'twinfile/place/demo-home:0.0.0',
          context: 'She checks the app before the morning rush.',
          narrativeBeat: 'Open the day with intention.',
          touchpointIds: ['touchpoint:rider-open-home'],
          emotions: {},
        },
      ],
      places: [{ placeRef: 'twinfile/place/demo-home:0.0.0', label: 'Demo apartment' }],
    });

    const scenes = buildDirectorScriptScenes({
      snapshot: {
        when: {
          storyArc: {
            version: 1,
            simulationEpochStart: '2026-01-06',
            planningHorizonDays: 56,
            visitDayIndex: 28,
            objectiveTouchpointIds: ['touchpoint:rider-open-home'],
            phases: {
              pre_visit: { startDayIndex: 0, endDayIndex: 27 },
              on_site: { dayIndex: 28 },
              post_visit: { startDayIndex: 29, endDayIndex: 55 },
            },
            touchpointSchedule: [],
          },
        },
      },
      character: {
        characterId: 'rider-urban-commuter-3',
        name: 'Maya',
        age: 32,
        occupation: 'product designer',
        psychology: { mindset: 'pragmatic', traits: ['hurried', 'observant'] },
      },
      story,
    });

    expect(scenes[0]?.storyboard.visual).toContain('She checks the app before the morning rush');
    expect(scenes[0]?.storyboard.caption).toContain('Open the day with intention');
    expect(scenes[0]?.storyboard.setting).toContain('Demo apartment');
    expect(scenes[0]?.storyboard.visual).toContain('Maya, 32, product designer');
  });
});
