import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Resolve @local-hosting/twinfile checkout for conformance fixtures (monorepo or CI). */
export function specRoot(): string {
  const fromEnv = process.env.TF_SPEC_ROOT?.trim();
  if (fromEnv && existsSync(join(fromEnv, 'conf/crosswalk.yaml'))) return fromEnv;

  const here = dirname(fileURLToPath(import.meta.url));
  for (const rel of ['../../spec', '../spec']) {
    const root = join(here, rel);
    if (existsSync(join(root, 'conf/crosswalk.yaml'))) return root;
  }
  throw new Error('twinfile/spec not found (set TF_SPEC_ROOT or checkout spec alongside bridge)');
}
