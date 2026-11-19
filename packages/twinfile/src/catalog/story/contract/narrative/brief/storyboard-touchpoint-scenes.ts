import {
  applyStoryboardPersonalization,
  buildStoryboardSceneContext,
  humanizeStoryWireLabel,
} from './storyboard-scene-context.js';
import type { DirectorScriptSceneV1, FormatStoryDirectorNarrativeInput } from './storyboard-types.js';

function withGeography(base: string, geography: string | undefined): string {
  if (!geography) return base;
  return `${base} (${geography})`;
}

function baseTouchpointScene(
  touchpointId: string,
  sceneNumber: number,
  protagonist: string,
  geography: string | undefined,
): DirectorScriptSceneV1 {
  const label = humanizeStoryWireLabel(touchpointId);
  const key = touchpointId.toLowerCase();

  if (key.includes('open-home') || key.includes('at-home')) {
    return {
      sceneNumber,
      slugline: 'INT. HOME — MORNING',
      storyboard: {
        visual: `${protagonist} at a kitchen counter, thumb hovering over a ride app icon; morning light, steam from coffee, city skyline soft through the window.`,
        caption: 'The day starts with a tap.',
        setting: withGeography('Kitchen or entryway; lived-in urban apartment', geography),
        time: 'Early morning; commute window opening',
        duration: '',
        camera: 'Locked tripod; 40mm spherical, slow 6-inch push-in',
        shot: 'ECU phone lock screen → app splash; MCU as protagonist enters frame',
        look: 'Warm interior, cool UI glow on face',
        props: 'Phone, coffee mug, coat on chair, faint city through window',
      },
      action: `${protagonist} wakes the ride app on their phone. The day’s route still feels open.`,
    };
  }
  if (key.includes('set-dest') || key.includes('choose-dest')) {
    return {
      sceneNumber,
      slugline: 'INT. HOME — CONTINUOUS',
      storyboard: {
        visual: `Over-shoulder on ${protagonist}'s phone: destination search, route line snaking across a map preview; apartment clutter soft in bokeh.`,
        caption: 'Where are we going?',
        setting: withGeography('Same apartment; protagonist still at counter or table', geography),
        time: 'Minutes after open; decision energy rising',
        duration: '',
        camera: 'Shoulder-mounted 35mm; gentle handheld micro-sway',
        shot: 'OTS on destination field; map preview readable in lower third',
        look: 'UI legible; fingers sharp, background soft',
        props: 'Phone, sticky note with address, earbuds case',
      },
      action: `${protagonist} types a destination. Traffic hums outside; the map redraws around their choice.`,
    };
  }
  if (key.includes('confirm-dest')) {
    return {
      sceneNumber,
      slugline: 'INT. HOME — MOMENTS LATER',
      storyboard: {
        visual: `Finger frozen above a glowing confirm button; ${protagonist}'s reflection in glass; front door waiting in the background.`,
        caption: 'Commit to the trip.',
        setting: withGeography('Tight on phone; doorway to outside visible in deep background', geography),
        time: 'Beat before leaving; held breath',
        duration: '',
        camera: 'Tabletop slider; 50mm, snap pan on cut to door',
        shot: 'Insert on confirm tap; CU eyes; wide to exit path',
        look: 'Higher contrast; commit moment',
        props: 'Phone, bag, keys in hand',
      },
      action: `${protagonist} pauses on the confirmation screen, then commits. The trip is real now.`,
    };
  }
  if (key.includes('live-map') || key.includes('in-ride')) {
    return {
      sceneNumber,
      slugline: 'EXT. CITY STREET — DAY',
      storyboard: {
        visual: `${protagonist} in profile against a rain-specked window; live map on a mounted phone; streets and signage streaking past.`,
        caption: 'In motion — follow the line.',
        setting: withGeography('On the commute; in the car with the live map visible', geography),
        time: 'Mid-commute; motion continuous',
        duration: '',
        camera: 'Vehicle mount + stabilized handheld; 28mm wide',
        shot: 'Profile through window; PiP map on phone mount or HUD overlay',
        look: 'Daylight bounce; kinetic blur on street',
        props: 'Phone mount or grip, bag, passing storefronts',
      },
      action: `${protagonist} is in motion. The live map tracks every turn; the city scrolls past the glass.`,
    };
  }
  if (key.includes('store') || key.includes('visit')) {
    return {
      sceneNumber,
      slugline: 'INT. STORE — DAY',
      storyboard: {
        visual: `Automatic doors part; ${protagonist} crosses into bright retail aisles, silhouette widening as store color floods the frame.`,
        caption: 'The visit we planned for.',
        setting: withGeography('Retail floor; aisles depth; branded entry', geography),
        time: 'Visit-day centerpiece; crowd optional',
        duration: '',
        camera: 'Steadicam 32mm; walk-and-follow through doors',
        shot: 'Wide establish → medium push as protagonist crosses threshold',
        look: 'Bright retail key; protagonist small then central',
        props: 'Shopping bag, phone in pocket, door sensors / signage',
      },
      action: `${protagonist} steps inside. This is the visit we have been building toward.`,
    };
  }

  return {
    sceneNumber,
    slugline: 'INT. UNDEFINED SPACE — DAY',
    storyboard: {
      visual: `${protagonist} centered in a readable environment; action suggests “${label}” without UI chrome.`,
      caption: `${protagonist} — ${label}.`,
      setting: withGeography(`Neutral stage for “${label}”`, geography),
      time: 'Story time; match episode clock',
      duration: '',
      camera: 'Tripod 35mm; static or slow pan',
      shot: 'Medium on protagonist; environment readable in one frame',
      look: 'Even, documentary honest',
      props: 'Phone, everyday carry',
    },
    action: `${protagonist} reaches the moment we call “${label}.” The beat lands; the story moves on.`,
  };
}

export function touchpointScriptScene(
  input: FormatStoryDirectorNarrativeInput,
  touchpointId: string,
  sceneNumber: number,
): DirectorScriptSceneV1 {
  const ctx = buildStoryboardSceneContext(input);
  const draft = baseTouchpointScene(
    touchpointId,
    sceneNumber,
    ctx.protagonistName,
    ctx.geography,
  );
  return applyStoryboardPersonalization(draft, ctx, touchpointId, input);
}
