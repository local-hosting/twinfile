# Tellico River — layout map

**`linear`** reach twin pinned on the **Tellico River** watershed (Tennessee fiction). Hydrology and sampling story — not a licensed forecast product.

## One glance

```text
  [reach-upper] ----path----> [eddy-pool]
       |                            |
  gauge-upstream              sonde + lab grab
  launch-ramp                 levee-top (refuge)
```

| Region | Space ids | Notes |
| --- | --- | --- |
| Upper reach | `reach-upper` | Stage gauge feed |
| Eddy pool | `eddy-pool` | Turbidity + bacteria sampling |
| Access | `launch-ramp`, `levee-top` | `dam-release` roles |

## Operator path

See **`visits:`** in [`Twinfile.yaml`](../Twinfile.yaml) — sample beat at the eddy pool on the grab schedule.

## Agents

Machine index: [`ext/layout-index.yaml`](../ext/layout-index.yaml). `twin layout summary examples/river`.
