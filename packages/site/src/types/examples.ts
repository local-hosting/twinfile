export type ExampleCatalogRole = 'site' | 'building'

export type ExampleCatalogItem = {
  /** `twinfile/name:tag` for sites; path under the examples root for nested buildings and floors. */
  uri: string
  label: string
  role: ExampleCatalogRole
  /** Catalog label of the unit that copies this one (`copy: ./parts/…`). */
  parent?: string
}
