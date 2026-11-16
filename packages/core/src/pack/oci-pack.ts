import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as tar from 'tar';

import { digestBuffer } from '../build/digest-file.js';
import { ajvErrorsToTwinErrors } from '../validate/create-validator.js';
import { getDefaultValidator } from '../validate/validate-yaml.js';
import type { Result } from '../types/twin-error.js';
import { err, ok } from '../types/twin-error.js';
import { CORE_SPEC_PIN } from '../types/twinfile-spec.js';

import { collectTwinfileSourcePaths } from './twinfile-tree.js';

const OCI_CFG_SCHEMA = 'https://twinfile.org/schemas/1/oci/oci-cfg.schema.json';

export type OciPackResult = {
  treePath: string;
  configPath: string;
  treeDigest: string;
  config: Record<string, unknown>;
  sourcePaths: string[];
};

export function ociConfigFromTwinfile(twinfile: Record<string, unknown>): Record<string, unknown> {
  const declared = typeof twinfile.kind === 'string' ? twinfile.kind : '';
  const role = typeof twinfile.role === 'string' ? twinfile.role : '';
  const kind =
    declared === 'resource' || declared === 'character' || declared === 'story'
      ? declared
      : declared === 'event'
        ? role === 'situation' || role === 'timetable'
          ? role
          : 'run'
      : declared === 'mixin' || declared === 'base'
        ? declared
        : declared === 'scenario'
          ? 'run'
          : role === 'situation' || role === 'timetable'
            ? role
            : typeof twinfile.from === 'string' || role === 'run'
              ? 'run'
              : 'place';
  const cfg: Record<string, unknown> = {
    twinfile: 1,
    kind,
    name: twinfile.id,
    version: twinfile.version,
    stability: twinfile.stability,
    spec: CORE_SPEC_PIN,
  };
  if (Array.isArray(twinfile.domains)) cfg.domains = twinfile.domains;
  if (twinfile.expects && typeof twinfile.expects === 'object') cfg.expects = twinfile.expects;
  if (twinfile.timetable && typeof twinfile.timetable === 'object') cfg.timetable = twinfile.timetable;
  if (Array.isArray(twinfile.phases)) cfg.phases = twinfile.phases;
  return cfg;
}

export function validateOciConfig(config: Record<string, unknown>, fileHint: string): Result<Record<string, unknown>> {
  const validator = getDefaultValidator();
  const fn = validator.getSchema(OCI_CFG_SCHEMA);
  if (!fn) {
    return err([{ code: 'E_SCHEMA', message: 'OCI config schema not registered', file: fileHint }]);
  }
  const valid = fn(config);
  if (!valid) {
    return err(ajvErrorsToTwinErrors(fileHint, undefined, fn.errors));
  }
  return ok(config);
}

async function twinfileTreeTarGzBuffer(unitRoot: string): Promise<{ buffer: Buffer; sourcePaths: string[] }> {
  const sourcePaths = collectTwinfileSourcePaths(unitRoot);
  if (sourcePaths.length === 0) {
    throw new Error('twinfileTreeTarGzBuffer: no source paths to archive');
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = tar.c(
      {
        gzip: true,
        cwd: unitRoot,
        portable: true,
        noMtime: true,
      },
      sourcePaths,
    );
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve());
  });

  return { buffer: Buffer.concat(chunks), sourcePaths };
}

export async function digestTwinfileTree(
  unitRoot: string,
): Promise<{ treeDigest: string; sourcePaths: string[] }> {
  const { buffer, sourcePaths } = await twinfileTreeTarGzBuffer(unitRoot);
  return { treeDigest: digestBuffer(buffer), sourcePaths };
}

export async function packTwinfileTreeTarGz(
  unitRoot: string,
  outPath: string,
): Promise<{ treeDigest: string; sourcePaths: string[] }> {
  const { buffer, sourcePaths } = await twinfileTreeTarGzBuffer(unitRoot);
  writeFileSync(outPath, buffer);
  return { treeDigest: digestBuffer(buffer), sourcePaths };
}

export async function packTwinfileOci(
  unitRoot: string,
  twinfile: Record<string, unknown>,
  ociDir: string,
): Promise<Result<OciPackResult>> {
  const config = ociConfigFromTwinfile(twinfile);
  const configValid = validateOciConfig(config, join(ociDir, 'config.json'));
  if (!configValid.ok) return configValid;

  const { mkdirSync } = await import('node:fs');
  mkdirSync(ociDir, { recursive: true });
  const treePath = join(ociDir, 'tree.tar.gz');
  const configPath = join(ociDir, 'config.json');

  const { treeDigest, sourcePaths } = await packTwinfileTreeTarGz(unitRoot, treePath);
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  return ok({
    treePath,
    configPath,
    treeDigest,
    config,
    sourcePaths,
  });
}
