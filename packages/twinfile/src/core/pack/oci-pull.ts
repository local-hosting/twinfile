import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as tar from 'tar';

import { digestBuffer } from '../build/digest-file.js';
import { RefResolver } from '../ref/ref-resolver.js';
import { OciRegistryClient, resolveRegistryAuth, type RegistryAuth } from './oci-registry-client.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import {
  TWINFILE_OCI_CONFIG_MEDIA,
  TWINFILE_OCI_TREE_MEDIA,
  TWINFILE_TREE_ANNOTATION,
  manifestReference,
  ociRepository,
  registryHost,
  type OciImageManifest,
} from '../types/oci-artifact.js';

export type OciPullOptions = {
  ref: string;
  outDir: string;
  registry?: string;
  auth?: RegistryAuth;
};

export type OciPullResult = {
  outDir: string;
  treeDigest: string;
  config: Record<string, unknown>;
  manifestDigest: string;
};

function asManifest(value: unknown): OciImageManifest | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as OciImageManifest;
  if (row.schemaVersion !== 2 || !row.config || !Array.isArray(row.layers)) return undefined;
  return row;
}

export async function pullTwinfileFromRegistry(
  options: OciPullOptions,
): Promise<Result<OciPullResult>> {
  const auth = resolveRegistryAuth(options.auth);
  const resolver = new RefResolver({ defaultRegistry: options.registry ?? 'ghcr.io' });
  const resolved = resolver.resolve(options.ref);

  const registry = registryHost(resolved, options.registry);
  const repository = ociRepository(resolved);
  const client = new OciRegistryClient({ registry, repository, auth });

  const reference = manifestReference(resolved);
  const fetched = await client.getManifest(reference);
  if (!fetched.ok) return fetched;

  const manifest = asManifest(fetched.value.manifest);
  if (!manifest) {
    return err([{ code: 'E_BUILD', message: 'Registry manifest is not a Twinfile OCI image' }]);
  }

  const treeLayer = manifest.layers.find((layer) => layer.mediaType === TWINFILE_OCI_TREE_MEDIA);
  if (!treeLayer) {
    return err([{ code: 'E_BUILD', message: 'Manifest missing Twinfile tree layer' }]);
  }

  const treeBlob = await client.fetchBlob(treeLayer.digest);
  if (!treeBlob.ok) return treeBlob;

  const actualTreeDigest = digestBuffer(treeBlob.value);
  const annotated = treeLayer.annotations?.[TWINFILE_TREE_ANNOTATION];
  if (annotated && annotated !== actualTreeDigest) {
    return err([
      {
        code: 'E_LOCK_DRIFT',
        message: 'Tree blob digest does not match org.twinfile.tree annotation',
        hint: `expected ${annotated}, got ${actualTreeDigest}`,
      },
    ]);
  }
  if (treeLayer.digest !== actualTreeDigest) {
    return err([
      {
        code: 'E_LOCK_DRIFT',
        message: 'Tree layer descriptor digest mismatch',
      },
    ]);
  }

  mkdirSync(options.outDir, { recursive: true });
  const treePath = join(options.outDir, 'tree.tar.gz');
  writeFileSync(treePath, treeBlob.value);

  await tar.x({ file: treePath, cwd: options.outDir, gzip: true, strip: 0 });

  const configBlob = await client.fetchBlob(manifest.config.digest);
  if (!configBlob.ok) return configBlob;
  if (manifest.config.mediaType !== TWINFILE_OCI_CONFIG_MEDIA) {
    return err([{ code: 'E_SCHEMA', message: 'Unexpected config media type on manifest' }]);
  }

  const configDigest = digestBuffer(configBlob.value);
  if (configDigest !== manifest.config.digest) {
    return err([{ code: 'E_LOCK_DRIFT', message: 'Config blob digest mismatch' }]);
  }

  const config = JSON.parse(configBlob.value.toString('utf8')) as Record<string, unknown>;
  writeFileSync(join(options.outDir, '.twin-pulled-config.json'), `${JSON.stringify(config, null, 2)}\n`);

  return ok({
    outDir: options.outDir,
    treeDigest: actualTreeDigest,
    config,
    manifestDigest: fetched.value.digest,
  });
}
