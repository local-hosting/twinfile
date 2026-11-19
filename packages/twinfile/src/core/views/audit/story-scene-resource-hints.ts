import type { TwinfileAuditFindingV1 } from './types.js';

export type SceneResourceHint = {
  sceneIds: string[];
  labelPattern: RegExp;
  resourceSuffixes: string[];
  code: string;
  message: string;
};

/** Curated scene → expected resource unit id suffixes (e.g. `device-showcase`). */
export const STORY_SCENE_RESOURCE_HINTS: SceneResourceHint[] = [
  {
    sceneIds: ['store', 'demo'],
    labelPattern: /demo|showcase|wearable|device table/i,
    resourceSuffixes: ['device-showcase'],
    code: 'SCENE_PROP_HINT',
    message: 'Store/demo scene usually involves a device showcase resource',
  },
  {
    sceneIds: ['wait'],
    labelPattern: /wait|queue|lounge/i,
    resourceSuffixes: ['queue-display', 'waiting-couch'],
    code: 'SCENE_PROP_HINT',
    message: 'Waiting scene usually involves queue display or waiting couch',
  },
  {
    sceneIds: ['check-in'],
    labelPattern: /check-?in|welcome/i,
    resourceSuffixes: ['greeter-kiosk'],
    code: 'SCENE_PROP_HINT',
    message: 'Check-in scene usually involves greeter kiosk',
  },
  {
    sceneIds: ['activate'],
    labelPattern: /service desk|activation|desk/i,
    resourceSuffixes: ['service-desk', 'pay-station'],
    code: 'SCENE_PROP_HINT',
    message: 'Service-desk scene usually involves service desk or pay station resource',
  },
];

function resourceSuffixMatches(involvedResourceIds: ReadonlySet<string>, suffix: string): boolean {
  for (const id of involvedResourceIds) {
    if (id === suffix || id.endsWith(`-${suffix}`)) return true;
  }
  return false;
}

export function storySceneResourceHintFindings(
  scenes: readonly { id: string; label?: string }[],
  involvedResourceIds: ReadonlySet<string>,
): TwinfileAuditFindingV1[] {
  const findings: TwinfileAuditFindingV1[] = [];

  for (const scene of scenes) {
    const label = scene.label ?? '';
    for (const hint of STORY_SCENE_RESOURCE_HINTS) {
      const idMatch = hint.sceneIds.includes(scene.id);
      const labelMatch = hint.labelPattern.test(label);
      if (!idMatch && !labelMatch) continue;

      const satisfied = hint.resourceSuffixes.some((suffix) =>
        resourceSuffixMatches(involvedResourceIds, suffix),
      );
      if (satisfied) continue;

      findings.push({
        level: 'warn',
        code: hint.code,
        message: `${hint.message} (scene \`${scene.id}\` — ${label || scene.id})`,
      });
    }
  }

  return findings;
}