import {
  crosswalkValue,
  optionalCrosswalkValue,
  unmappedExt,
  geotypeSlugForMapping,
  asImportRecord,
  packPlaceUnit,
  readImportName,
  twinId,
  withImportExt,
  kindFromToken,
  notedCategory,
  parseCsv,
  haversine,
  isStationStop,
  stepFreeKind,
  localType,
  localKey,
  normalizeKeys,
  type ImportResult,
} from '../../authoring.js';

type Row = Record<string, unknown>;
type FeedRow = Record<string, unknown>;

const asRecord = asImportRecord;
const readName = readImportName;
const withExt = withImportExt;
const packUnit = packPlaceUnit;

export function importPlace(input: unknown): ImportResult {
  const row = normalizeKeys(asRecord(input, 'sosa'));
  const result = row.hasResult ?? row.result;
  let value: number | undefined;
  let unit: string | undefined;
  if (typeof result === 'number') value = result;
  else if (result && typeof result === 'object' && !Array.isArray(result)) {
    const record = normalizeKeys(result as Row);
    const numeric = record.numericValue ?? record.value;
    if (typeof numeric === 'number') value = numeric;
    if (typeof record.unit === 'string') unit = record.unit;
  }
  if (typeof value !== 'number') throw new Error('sosa: result must be a number');
  const observedAt = row.phenomenonTime ?? row.resultTime;
  if (typeof observedAt !== 'string') throw new Error('sosa: phenomenonTime is required');
  const device = row.madeBySensor;
  const property = row.observedProperty;
  if (typeof device !== 'string' || typeof property !== 'string') {
    throw new Error('sosa: madeBySensor and observedProperty are required');
  }
  const observesRaw = row.hasFeatureOfInterest ?? row.featureOfInterest;
  const observes = typeof observesRaw === 'string' ? twinId(observesRaw) : undefined;
  const available = typeof row.resultTime === 'string' && row.resultTime !== observedAt ? row.resultTime : undefined;
  const feed: FeedRow = {
    device_id: twinId(device),
    observed_property: localKey(property),
    value,
    observed_at: observedAt,
    ...(observes ? { observes } : {}),
    ...(unit ? { unit } : {}),
    ...(available ? { available_at: available } : {}),
  };
  const ext = unmappedExt('sosa', 'feed', row, [
    'type',
    'madeBySensor',
    'hasFeatureOfInterest',
    'featureOfInterest',
    'observedProperty',
    'hasResult',
    'result',
    'phenomenonTime',
    'resultTime',
    'unit',
  ]);
  if (Object.keys(ext).length > 0) feed.ext = ext;
  const line = `${JSON.stringify(feed)}\n`;
  return { files: { 'observation.jsonl': line }, place: {}, feed };
}
