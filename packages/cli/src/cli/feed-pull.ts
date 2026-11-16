import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildTwinfile,
} from '@doppler-group/twinfile-place';
import {
  resolveExamplesRoot,
} from '@doppler-group/twinfile-core';
import { formatTwinErrors } from '@doppler-group/twinfile-core/cli';

import {
  feedRowsToJsonl,
  pullFeedRows,
  type FeedPullRequest,
  type FeedProtocol,
} from '@doppler-group/twinfile-simulator';

type Device = {
  id?: string;
  unit?: string;
  properties?: string[];
  feed?: { protocol?: string; url?: string; replay?: string };
};

export async function runFeedPull(argv: string[]): Promise<number> {
  let protocol: FeedProtocol | undefined;
  let url: string | undefined;
  let device = '';
  let property = '';
  let out = '';
  let dir = '.';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--protocol' && argv[i + 1]) protocol = argv[++i] as FeedProtocol;
    else if (a === '--url' && argv[i + 1]) url = argv[++i];
    else if (a === '--device' && argv[i + 1]) device = argv[++i];
    else if (a === '--property' && argv[i + 1]) property = argv[++i];
    else if (a === '--out' && argv[i + 1]) out = argv[++i];
    else if (!a.startsWith('-')) dir = a;
  }
  if (!protocol || !url || !device || !property || !out) {
    console.error('twin feed pull --protocol <sensorthings|ngsi-ld> --url <endpoint> --device <id> --property <name> --out <file.jsonl>');
    return 1;
  }
  const examplesRoot = resolveExamplesRoot(resolve(dir)) ?? undefined;
  const built = await buildTwinfile(dir, { examplesRoot, writeLock: false });
  if (!built.ok) {
    console.error(formatTwinErrors(dir, built.errors).join('\n'));
    return 1;
  }
  const merged = built.value.data as Record<string, unknown>;
  const devices = (merged.devices ?? merged.gauges ?? []) as Device[];
  const match = devices.find((d) => d.id === device);
  const request: FeedPullRequest = {
    protocol: protocol as Exclude<FeedProtocol, 'file'>,
    url,
    deviceId: device,
    observedProperty: property,
    unit: match?.unit,
  };
  const rows = await pullFeedRows(request);
  writeFileSync(out, feedRowsToJsonl(rows));
  return 0;
}
