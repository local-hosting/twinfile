import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildTwinfile } from '@local-hosting/twinfile/place';
import { loadTwinfile, resolveAuditExamplesRoot, resolveTwinfileRoot, sceneAddress } from '@local-hosting/twinfile';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function resolveRiverPackRoot(): string | undefined {
  const fromEnv = process.env.TF_RIVER_TWINFILE_ROOT?.trim();
  if (fromEnv && existsSync(fromEnv)) return resolve(fromEnv);

  const twinRoot = resolveTwinfileRoot(pkgRoot);
  const repoRoot = join(twinRoot, '..', '..');
  const candidates = [
    join(repoRoot, '..', '..', 'doppler-group', 'river-twinfile'),
    join(repoRoot, 'doppler-group', 'river-twinfile'),
    join(twinRoot, '..', '..', '..', '..', 'doppler-group', 'river-twinfile'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'story', 'tennessee-river-operations'))) return resolve(dir);
  }
  return undefined;
}

const riverRoot = resolveRiverPackRoot();
const describeRiver = riverRoot ? describe : describe.skip;

describeRiver('river-twinfile overlay pack (layout, no twin.local.yaml)', () => {
  it('resolves audit examples root from Tennessee River place unit', () => {
    const placeRoot = join(riverRoot!, 'place', 'tennessee-river');
    expect(resolveAuditExamplesRoot(placeRoot)).toBe(riverRoot);
  });

  it('loadTwinfile accepts place with monorepo base-linear from', () => {
    const placeRoot = join(riverRoot!, 'place', 'tennessee-river');
    const loaded = loadTwinfile(placeRoot);
    expect(loaded.ok, loaded.ok ? '' : JSON.stringify(loaded.errors)).toBe(true);
  });

  it('buildTwinfile composes confluence-round scene', async () => {
    const storyDir = join(riverRoot!, 'story', 'tennessee-river-operations');
    const address = sceneAddress(storyDir, 'confluence-round');
    expect(resolveAuditExamplesRoot(address)).toBe(riverRoot);

    const built = await buildTwinfile(address, { writeLock: false });
    expect(built.ok, built.ok ? '' : JSON.stringify(built.errors)).toBe(true);
    if (built.ok) {
      expect(built.value.meta?.id).toBe('confluence-round');
    }
  });
});