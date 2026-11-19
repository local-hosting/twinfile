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

function featureType(feature: Row): string {
  if (typeof feature.feature_type === 'string') return feature.feature_type;
  const props = asRecord(feature.properties ?? {}, 'imdf properties');
  if (typeof props.feature_type === 'string') return props.feature_type;
  throw new Error('imdf: feature is missing feature_type');
}

function featuresOf(input: unknown): Row[] {
  const root = asRecord(input, 'imdf');
  const features = root.features;
  if (!Array.isArray(features)) throw new Error('imdf: expected features[]');
  return features.map((feature, index) => asRecord(feature, `imdf feature ${index}`));
}

export function importPlace(input: unknown): ImportResult {
  const grouped = new Map<string, Row[]>();
  for (const feature of featuresOf(input)) {
    const kind = featureType(feature);
    const list = grouped.get(kind) ?? [];
    list.push(feature);
    grouped.set(kind, list);
  }
  const venue = grouped.get('venue')?.[0];
  if (!venue) throw new Error('imdf: venue feature is required');
  const venueProps = asRecord(venue.properties ?? {}, 'imdf venue');
  const placeName = readName(venueProps.name, 'Imported venue');
  const levels = (grouped.get('level') ?? []).map((feature) => {
    const props = asRecord(feature.properties ?? {}, 'imdf level');
    const id = twinId(String(feature.id ?? props.id ?? 'level'));
    return withExt(
      {
        id,
        ordinal: Number(props.ordinal ?? 0),
        name: readName(props.name, id),
      },
      unmappedExt('imdf', 'levels', props, ['ordinal', 'name', 'id', 'feature_type']),
    );
  });
  const levelIds = new Set(levels.map((level) => String(level.id)));
  const spaces = (grouped.get('unit') ?? []).map((feature) => {
    const props = asRecord(feature.properties ?? {}, 'imdf unit');
    const id = twinId(String(feature.id ?? props.id ?? 'unit'));
    const level = typeof props.level_id === 'string' ? twinId(props.level_id) : undefined;
    const kind = kindFromToken(typeof props.category === 'string' ? props.category : undefined, 'room');
    return withExt(
      {
        id,
        kind: kind.kind,
        name: readName(props.name, id),
        ...(level && levelIds.has(level) ? { level } : {}),
      },
      notedCategory(unmappedExt('imdf', 'spaces', props, ['category', 'name', 'level_id', 'id', 'feature_type']), kind.sourceCategory),
    );
  });
  const openings = (grouped.get('opening') ?? []).map((feature) => {
    const props = asRecord(feature.properties ?? {}, 'imdf opening');
    const rawConnects = props.unit_ids ?? props.connects;
    if (!Array.isArray(rawConnects) || rawConnects.length !== 2) {
      throw new Error(`imdf opening ${String(feature.id)}: unit_ids must list the two units it joins`);
    }
    const id = twinId(String(feature.id ?? 'opening'));
    const width = typeof props.width === 'number' ? props.width : 1;
    const category = typeof props.category === 'string' ? props.category : undefined;
    const kind = kindFromToken(category, 'opening');
    const role = category ? optionalCrosswalkValue('imdf', 'category', 'openings', 'roles', category) : undefined;
    return withExt(
      {
        id,
        kind: kind.kind,
        connects: rawConnects.map((item) => twinId(String(item))),
        width_m: width,
        state: 'open',
        ...(role ? { roles: [role] } : {}),
      },
      notedCategory(
        unmappedExt('imdf', 'openings', props, ['category', 'unit_ids', 'connects', 'width', 'level_id', 'id', 'feature_type']),
        kind.sourceCategory,
      ),
    );
  });
  const archetype = levels.length > 1 ? 'indoor_stack' : 'single_level';
  const address = typeof venueProps.address === 'string' ? venueProps.address : undefined;
  const timezone = typeof venueProps.timezone === 'string' ? venueProps.timezone : 'UTC';
  const site = withExt(
    {
      name: placeName,
      kind: typeof venueProps.category === 'string' ? venueProps.category : 'venue',
      timezone,
      published: false,
      archetype,
      ...(address ? { address } : {}),
    },
    unmappedExt('imdf', 'place', venueProps, ['name', 'category', 'timezone', 'address', 'id', 'feature_type']),
  );
  const docs: Row[] = [{ place: site }];
  if (levels.length > 0) docs.push({ levels });
  if (spaces.length === 0) throw new Error('imdf: at least one unit is required');
  docs.push({ spaces });
  if (openings.length > 0) docs.push({ openings });
  const venueCategory = typeof venueProps.category === 'string' ? venueProps.category : '';
  const geotype = geotypeSlugForMapping('imdf', venueCategory) ?? 'museum';
  return packUnit(twinId(placeName), geotype, docs);
}
