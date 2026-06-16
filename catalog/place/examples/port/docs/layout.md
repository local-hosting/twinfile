# Port of New Orleans — layout map

Illustrative pier campus pinned at the **Port of New Orleans** (Napoleon Avenue container terminal — logistics) for **`litter-pollution`** → **`gangway-backup`**. Layout is fiction.

## Site (one glance)

```text
  [pier-main]  outdoor pier
        |
        v
  [warehouse]  indoor anchor
        |
        +-- warehouse-main (interior row)
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Pier | `pier-main` | outdoor | Litter / access fiction |
| Warehouse | `warehouse`, `warehouse-main` | indoor | single site twin — no nested building unit |

## Floors

The `levels:` patch names the single site grade.

## Plans

The `litter-pollution` `bind:` item binds cleanup roles to pier + warehouse zones.

## Related

- [`Twinfile.yaml`](../Twinfile.yaml) · [`../PARTS.md`](../../PARTS.md) (nested `copy:` — arena, airport, mobility campus)
