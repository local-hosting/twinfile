# Madison Square Garden — layout map

Illustrative stadium campus pinned at **Madison Square Garden**. **Daily:** `arena-game-day` → `gate-open-ramp` (`arena-operations`). **Resilience:** `severe-weather` / `earthquake` → `storm-at-halftime` / `flood-shelter-standup` / `bowl-quake` (`arena-resilience`). Layout is fiction; the map pin is real.

Pattern C — [campus-building-floor.md](../../../../../packages/spec/doc/place/campus-building-floor.md) (one `copy: ./parts/concourse`).

## Site (one glance)

```text
  [plaza-east]  outdoor          [plaza-west]  outdoor
        \                            /
         \                          /
          ===== [concourse] indoor anchor =====
                     |    \
              [lot-c]      [bowl-a] outdoor seating
                     |
        (copy) concourse-lower, concourse-tunnel-north, …
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Anchor building | `concourse` | indoor | **`copy:`** → [`parts/concourse`](../parts/concourse/) |
| Outdoor plazas | `plaza-east`, `plaza-west` | outdoor | Shelter roles / weather fiction |
| Parking | `lot-c` | outdoor | |
| Bowl | `bowl-a` | outdoor | Seating shell |
| Interior (merged) | `concourse-*` | indoor | Prefixed from nested building |

## Building copy

The last patch in [`arena.twin.yaml`](../arena.twin.yaml):

```yaml
  - copy: ./parts/concourse
    into: concourse
```

Site **`openings`** connect prefixed concourse spaces to plazas; gate rows live in the nested **concourse** building stage.

## Floors

The `levels:` patch declares site `ground` for outdoor/indoor fiction at campus tier.

## Plans

The `severe-weather` `plan:` item: shelter on `concourse` + prefixed interior; outdoor beats on plazas / bowl.

## Module patch graph

Manifest **`processors:`** scopes the concourse building into **`map-concourse`**, wires GTFS into campus map input, and binds shelter standup to `concourse-lower` (see [`arena.twin.yaml`](../arena.twin.yaml)). Checked with `twin check … --profile processors`.

## Related

- Child: [`parts/concourse`](../parts/concourse/) — `ext.shelter_resource` on cot/water assets
- Daily: [`gate-open-ramp`](../../../../story/examples/arena-operations/arena-operations.twin.yaml) (`catalog/story/examples/arena-operations#gate-open-ramp`)
- Resilience: [`flood-shelter-standup`](../../../../story/examples/arena-resilience/arena-resilience.twin.yaml) (`catalog/story/examples/arena-resilience#flood-shelter-standup`)
