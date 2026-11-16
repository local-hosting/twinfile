# Expo City Dubai — layout map

Illustrative tri-petal campus pinned at **Expo City Dubai**. **Topology:** `archetype: campus`, **`space_granularity: zone`**. Site anchor: `place.ext` in the first patch of [`Twinfile.yaml`](../Twinfile.yaml).

**Opportunity gallery** is an extra `spaces:` step on the site twin (`pavilion-opportunity-gallery` under anchor `pavilion-opportunity`). Mobility and sustainability pavilions are modeled as site zones only.

## Site overview

```text
                    [metro-arrival] covered / ground-transport
                            |
                            v
                    [al-wasl-plaza]  covered plaza
                     /      |      \
        district-opportunity | district-mobility ... district-sustainability
              |  door              |                    |
        pavilion-opportunity   pavilion-mobility   pavilion-sustainability
        + gallery (indoor)         (indoor)            (indoor)

  Outdoor program: al-forsan-park, jubilee-park, wasl-stage (roles: outdoor)
```

## Region → spaces → patches

| Region | Primary space ids | Exposure | Detail in |
| --- | --- | --- | --- |
| Arrival | `metro-arrival` | covered | campus `spaces:` patch |
| Central | `al-wasl-plaza` | covered | campus `spaces:` patch |
| Opportunity district | `district-opportunity`, `pavilion-opportunity`, `pavilion-opportunity-gallery` | covered / indoor | site `steps:` |
| Mobility district | `district-mobility`, `pavilion-mobility` | covered / indoor | site `steps:` |
| Sustainability district | `district-sustainability`, `pavilion-sustainability`, `uae-pavilion` | covered / indoor | site `steps:` |
| Outdoor program | `al-forsan-park`, `jubilee-park`, `wasl-stage` | outdoor | site `steps:` |

**Room-tier:** pavilion **galleries** are individual **indoor** spaces (shelter roles), not sub-ids of district rows — connected via **`openings`** from each `district-*` concourse.

## Default visitor path

Use the **`visits:`** patch first (beats `visit-arrival` … `visit-departure`); it is the machine-readable overview TOC.

## Floors

Single site grade: the `levels:` patch declares `ground` only. Per-building floors are **not** modeled; use **`exposure`** + zone spaces instead.

## Related

- [`Twinfile.yaml`](../Twinfile.yaml) · [`ext/layout-index.yaml`](../ext/layout-index.yaml)
- Nested **`copy:`** golden refs (larger stacks): [`arena`](../../arena/) · [`airport`](../../airport/)
