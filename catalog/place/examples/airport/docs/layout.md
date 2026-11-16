# JFK — layout map

Illustrative single-terminal airport pinned at **John F. Kennedy International Airport** for **`transit-disruption`** demos. Not IFR, not real ops.

## Site (one glance)

```text
  [curb-arrivals] --outdoor--> [bus-gates] --covered-->
         |                           |
         v                           v
              [terminal-a]  indoor / ground-transport hub
         |
         v (airside level)
              [remote-stand]  outdoor apron / alternative
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Landside curb | `curb-arrivals` | outdoor | Ground transport role |
| Covered gates | `bus-gates` | covered | Bus gate area |
| Terminal A | `terminal-a` (+ copied `terminal-a-*`) | indoor | **Interior** via `copy:` — [`parts/terminal-a`](../parts/terminal-a/), which copies [`floors/airside`](../parts/terminal-a/floors/airside/) |
| Airside | `remote-stand` | outdoor | `level: airside` |

## Floors (`levels:` patch)

| Level id | Name | Ordinal |
| --- | --- | --- |
| `ground` | Ground | 0 |
| `airside` | Airside | 1 |

Pattern guide: [campus-building-floor.md](../../../../spec/doc/place/campus-building-floor.md) (Pattern B — building copies its floor).

## Drill-down (future)

When adding gate/hall detail, add patches to [`parts/terminal-a/Twinfile.yaml`](../parts/terminal-a/Twinfile.yaml) (piers, security, gates at `level: ground`), or a new floor under `parts/terminal-a/floors/`. Keep **`terminal-a`** as the zone rollup on the campus.

## Topology (this site)

Vocabulary: [place topology taxonomy](../../../../spec/doc/place/topology-taxonomy.md).

| Mobility | Id | Between regions |
| --- | --- | --- |
| Passage (`openings`) | `door-terminal-curb` | `terminal-a` ↔ `curb-arrivals` (building threshold) |
| Passage | `gate-terminal-bus` | `terminal-a` ↔ `bus-gates` |
| Passage | `door-concourse-security` | `concourse` ↔ `security-hall` (inside building twin) |
| Path (`routes`) | `curb-buses` | `curb-arrivals` → `bus-gates` (45 m) |
| Path | `bus-remote` | `bus-gates` → `remote-stand` (800 m) |

Do not duplicate a passage and a path for the same pair — curb ↔ terminal uses **only** `door-terminal-curb`.

Read order: this file → the campus `spaces:` patch → `parts/terminal-a` → passages/paths.

## Plans

The `transit-disruption` `plan:` item maps **`ground-transport`** roles to terminal/curb/bus spaces — see [`expected/contract.json`](../expected/contract.json).
