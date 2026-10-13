import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml, stringify } from 'yaml';
import { describe, expect, it } from 'vitest';

import { addBindToPlace } from '@local-hosting/twinfile/simulator';
import { testExamplesRoot } from '../helpers/catalog-test-roots.js';
import {
  createPlace,
} from '@local-hosting/twinfile/place';
import { collectPlaceIdsForRole, planRolesFromPlace, twinHeadPath } from '@local-hosting/twinfile';

describe('add plan to place', () => {
  it('collects ids by role tag on spaces and openings', () => {
    const place = {
      spaces: [
        { id: 'hall-shelter', roles: ['shelter'] },
        { id: 'quad-outdoor', roles: ['outdoor'] },
      ],
      openings: [
        { id: 'gate-north', roles: ['exit'] },
        { id: 'gate-south', roles: ['exit'] },
      ],
    };
    expect(collectPlaceIdsForRole(place, 'space', 'shelter')).toEqual(['hall-shelter']);
    expect(collectPlaceIdsForRole(place, 'opening', 'exit')).toEqual(['gate-north', 'gate-south']);
  });

  it('scaffolds severe-weather plan from campus base spaces', async () => {
    const examplesRoot = testExamplesRoot(dirname(fileURLToPath(import.meta.url)));

    const scaffoldRoot = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../catalog/place/test/fixtures/plan-scaffold-campus',
    );
    const baseSpaces = readFileSync(join(scaffoldRoot, 'spaces.yaml'), 'utf8');
    const baseOpenings = readFileSync(join(scaffoldRoot, 'openings.yaml'), 'utf8');

    const dir = mkdtempSync(join(tmpdir(), 'twin-add-plan-'));
    try {
      createPlace(dir, {
        geotype: 'university',
        unitName: 'plan-test-campus',
        useFrom: true,
        decorate: false,
      });
      const spacesDoc = parseYaml(baseSpaces) as Record<string, unknown>;
      const openingsDoc = parseYaml(baseOpenings) as Record<string, unknown>;
      const twinfile = parseYaml(readFileSync(twinHeadPath(dir), 'utf8')) as Record<
        string,
        unknown
      >;
      const steps = Array.isArray(twinfile.steps) ? [...(twinfile.steps as unknown[])] : [];
      steps.push(spacesDoc, { ...openingsDoc, mode: 'replace' });
      twinfile.steps = steps;
      writeFileSync(twinHeadPath(dir), stringify(twinfile));

      const result = await addBindToPlace(dir, 'severe-weather', { examplesRoot });
      expect(result.location).toMatch(/^steps\[\d+\]$/);
      expect(result.warnings).toEqual([]);
      expect(result.roles.shelter).toContain('hall-shelter');
      expect(result.roles.exit).toHaveLength(2);

      const bind =
        result.location.startsWith('steps[')
          ? (
              parseYaml(readFileSync(twinHeadPath(dir), 'utf8')) as {
                steps: Array<{ bind?: { for: string; roles: Record<string, string[]> } }>;
              }
            ).steps.find((item) => item.bind?.for === 'severe-weather')?.bind
          : (parseYaml(readFileSync(join(dir, result.location), 'utf8')) as {
              for: string;
              roles: Record<string, string[]>;
            });
      expect(bind?.for).toBe('severe-weather');
      expect(bind?.roles.shelter).toContain('hall-shelter');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('warns when required roles are missing tags', () => {
    const { roles, warnings } = planRolesFromPlace(
      { spaces: [{ id: 'only-outdoor', roles: ['outdoor'] }] },
      {
        shelter: { kind: 'space', min: 1 },
        outdoor: { kind: 'space', min: 0 },
      },
    );
    expect(roles.outdoor).toEqual(['only-outdoor']);
    expect(roles.shelter).toEqual([]);
    expect(warnings.some((w) => w.includes('shelter'))).toBe(true);
  });
});
