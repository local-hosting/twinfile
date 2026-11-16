import { type ExampleCatalogItem } from '@/types/examples'

export const exampleSiteItems: ExampleCatalogItem[] = [
  {
    uri: 'twinfile/transit-hub-campus:0.1.0',
    label: 'transit-hub-campus',
    role: 'site',
  },
  { uri: 'twinfile/shop:0.2.0', label: 'shop', role: 'site' },
  { uri: 'twinfile/airport:0.2.0', label: 'airport', role: 'site' },
  { uri: 'twinfile/arena:1.2.0', label: 'arena', role: 'site' },
  { uri: 'twinfile/expo:0.2.0', label: 'expo', role: 'site' },
  { uri: 'twinfile/park:0.3.0', label: 'park', role: 'site' },
  { uri: 'twinfile/port:0.2.0', label: 'port', role: 'site' },
  { uri: 'twinfile/river:0.2.0', label: 'river', role: 'site' },
]

function nested(parent: string, path: string, label: string): ExampleCatalogItem {
  return { uri: `places/${path}`, label, role: 'building', parent }
}

export const exampleBuildingItems: ExampleCatalogItem[] = [
  nested('airport', 'airport/parts/terminal-a', 'terminal-a'),
  nested(
    'terminal-a',
    'airport/parts/terminal-a/floors/airside',
    'terminal-a-airside',
  ),
  nested(
    'transit-hub-campus',
    'mobility-hub/campus/parts/transit-hub',
    'transit-hub',
  ),
  nested('arena', 'arena/parts/concourse', 'arena-concourse'),
]

export const exampleCatalogItems: ExampleCatalogItem[] = [
  ...exampleSiteItems,
  ...exampleBuildingItems,
]

export function findExampleBySlug(
  slug: string,
): ExampleCatalogItem | undefined {
  return exampleCatalogItems.find((item) => item.label === slug)
}
