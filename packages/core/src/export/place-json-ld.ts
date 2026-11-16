import {
  resolveGeotypeRef,
  schemaOrgTypeForGeotypeRef,
} from '@local-hosting/geotypes';

import { defaultPushRef } from '../pack/oci-push.js';
import type { LoadedTwinfile } from '../load/load-twinfile.js';
import { listTwinfilePatchDocs } from '../load/twinfile-instructions.js';
import { parseGeotypeTwinfile } from '../types/geotype-twinfile.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org';

export type PlaceJsonLdDocument = Record<string, unknown>;

export type BuildPlaceJsonLdOptions = {
  twinfileRef?: string;
};

function placeLayerFromLayers(layers: readonly Record<string, unknown>[]): Record<string, unknown> | undefined {
  return layers.find((l) => 'place' in l)?.place as Record<string, unknown> | undefined;
}

export function isPublishedPlaceTwinfile(unit: LoadedTwinfile): boolean {
  if (unit.twinfile.kind !== 'place') return false;
  const place = placeLayerFromLayers(listTwinfilePatchDocs(unit));
  return place?.published === true;
}

export function buildPlaceJsonLdFromTwinfile(
  unit: LoadedTwinfile,
  options: BuildPlaceJsonLdOptions = {},
): PlaceJsonLdDocument | null {
  return buildPlaceJsonLd(unit.twinfile, listTwinfilePatchDocs(unit), options);
}

export function buildPlaceJsonLd(
  twinfile: Record<string, unknown>,
  layers: readonly Record<string, unknown>[],
  options: BuildPlaceJsonLdOptions = {},
): PlaceJsonLdDocument | null {
  if (twinfile.kind !== 'place') return null;
  const geotype = parseGeotypeTwinfile(twinfile);
  if (!geotype) return null;
  const resolved = resolveGeotypeRef(geotype.primary);
  if (!resolved) return null;

  const place = placeLayerFromLayers(layers);
  const twinfileRef = options.twinfileRef ?? defaultPushRef(twinfile);
  const name = String(place?.name ?? twinfile.name ?? twinfileRef);
  const typeName = schemaOrgTypeForGeotypeRef(geotype.primary);
  const doc: PlaceJsonLdDocument = {
    '@context': SCHEMA_ORG_CONTEXT,
    '@type': typeName ?? 'Place',
    '@id': twinfileRef,
    name,
    identifier: twinfileRef,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        propertyID: 'twinfile:geotype',
        value: resolved.slug,
      },
      ...(geotype.registry
        ? [
            {
              '@type': 'PropertyValue',
              propertyID: 'twinfile:geotype-registry',
              value: geotype.registry,
            },
          ]
        : []),
    ],
  };

  if (typeof place?.address === 'string' && place.address.trim()) {
    doc.address = place.address.trim();
  }
  if (typeof place?.timezone === 'string' && place.timezone.trim()) {
    doc.additionalProperty = [
      ...(doc.additionalProperty as Record<string, unknown>[]),
      {
        '@type': 'PropertyValue',
        propertyID: 'twinfile:timezone',
        value: place.timezone.trim(),
      },
    ];
  }

  const ext = place?.ext as Record<string, unknown> | undefined;
  const lat = ext?.lat ?? place?.lat;
  const lon = ext?.lon ?? place?.lon;
  if (typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)) {
    doc.geo = {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lon,
    };
  }

  return doc;
}
