# Mobility hub campus — layout map

Fictional **campus-shaped mobility hub** (transit hub = mobility hub in prose) for **`transit-disruption`** (`transit-hub-campus-hub-queue-spill`). Map pin is illustrative (Penn Station area); topology is fiction.

## Site (one glance)

```text
  [quad] --outdoor plaza--> [shuttle-loop] roadway
         |
         v
  [transit-hub]  covered / ground-transport anchor
         |
         +-- (copy) transit-hub-ticket-hall, transit-hub-platform-shelter, …
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Main quad | `quad` | outdoor | Alternative pickup fiction |
| Shuttle loop | `shuttle-loop` | outdoor | Roadway / ground transport |
| Mobility hub | `transit-hub` | covered | **Anchor** for `copy:` → [`parts/transit-hub`](../parts/transit-hub/) |
| Interior (merged) | `transit-hub-*` | indoor/covered | Prefixed ids from nested building |

## Building copy

The last patch in [`campus.twin.yaml`](../campus.twin.yaml):

```yaml
  - copy: ./parts/transit-hub
    into: transit-hub
```

Add room detail in the **building Twinfile** [`parts/transit-hub`](../parts/transit-hub/), not as campus patches. Rebuild the **site** so prefixes merge.
