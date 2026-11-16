import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { RefResolver } from '../ref/ref-resolver.js';
import {
  manifestBytes,
  manifestDigest,
  buildTwinfileOciDistribution,
} from './oci-distribution.js';
import { OciRegistryClient, resolveRegistryAuth, type RegistryAuth } from './oci-registry-client.js';
import { packTwinfileOci } from './oci-pack.js';
import { loadTwinfile } from '../load/load-twinfile.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import {
  manifestReference,
  ociRepository,
  registryHost,
} from '../types/oci-artifact.js';

export type OciPushOptions = {
  ref: string;
  registry?: string;
  auth?: RegistryAuth;
  /** OCI layout directory; defaults to a process temp dir (removed after push). */
  ociDir?: string;
};

export type OciPushResult = {
  ref: string;
  repository: string;
  registry: string;
  manifestDigest: string;
  treeDigest: string;
  tag: string;
};

export function defaultPushRef(twinfile: Record<string, unknown>): string {
  const name = String(twinfile.id ?? 'card');
  const version = String(twinfile.version ?? '0.0.0');
  return `twinfile/${name}:${version}`;
}

export async function pushTwinfileToRegistry(
  unitRoot: string,
  options: OciPushOptions,
): Promise<Result<OciPushResult>> {
  const loaded = loadTwinfile(unitRoot);
  if (!loaded.ok) return loaded;

  const auth = resolveRegistryAuth(options.auth);
  if (!auth?.token) {
    return err([
      {
        code: 'E_BUILD',
        message: 'Registry push requires OCI_REGISTRY_TOKEN or GITHUB_TOKEN',
      },
    ]);
  }

  const resolver = new RefResolver({ defaultRegistry: options.registry ?? 'ghcr.io' });
  const resolved = resolver.resolve(options.ref);
  if (!resolved.name || !resolved.tag) {
    return err([{ code: 'E_BUILD', message: `Push ref must include tag: ${options.ref}` }]);
  }

  const tempOci = !options.ociDir;
  const ociDir = options.ociDir ?? mkdtempSync(join(tmpdir(), 'twinfile-oci-'));
  const packed = await packTwinfileOci(unitRoot, loaded.value.twinfile, ociDir);
  if (!packed.ok) {
    if (tempOci) rmSync(ociDir, { recursive: true, force: true });
    return packed;
  }

  try {
    const configBytes = readFileSync(packed.value.configPath);
    const treeBytes = readFileSync(packed.value.treePath);
    const manifest = buildTwinfileOciDistribution({
      configBytes,
      treeBytes,
      treeDigest: packed.value.treeDigest,
    });
    const manifestBody = manifestBytes(manifest);
    const mDigest = manifestDigest(manifest);
    const registry = registryHost(resolved, options.registry);
    const repository = ociRepository(resolved);
    const client = new OciRegistryClient({ registry, repository, auth });

    const configUpload = await client.uploadBlob(manifest.config.digest, configBytes);
    if (!configUpload.ok) return configUpload;

    const treeDescriptor = manifest.layers[0];
    if (!treeDescriptor?.digest) {
      return err([{ code: 'E_BUILD', message: 'Internal error: manifest missing tree layer' }]);
    }
    const treeUpload = await client.uploadBlob(treeDescriptor.digest, treeBytes);
    if (!treeUpload.ok) return treeUpload;

    const tag = manifestReference(resolved);
    const put = await client.putManifest(tag, manifestBody);
    if (!put.ok) return put;

    return ok({
      ref: options.ref,
      repository,
      registry,
      manifestDigest: mDigest,
      treeDigest: packed.value.treeDigest,
      tag,
    });
  } finally {
    if (tempOci) rmSync(ociDir, { recursive: true, force: true });
  }
}
