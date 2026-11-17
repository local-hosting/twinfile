# Memphis Cold Chain Hub — layout map

Illustrative cold-storage campus for **cold-chain logistics**. **Daily:** air intake → hub handoff → pier transfer (`cold-chain-operations`). **Resilience:** cold-room outage / apron storm hold (`cold-chain-resilience`). Layout is fiction.

## Site (one glance)

```text
  [receiving-dock] --corridor--> [cold-room]
                                      |
                                      +-- [packing-bay]
                                      |
                                      v
                               [reefer-yard] --path--> [dispatch-curb]
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Dock | `receiving-dock` | outdoor | Air/road intake |
| Cold store | `cold-room`, `packing-bay` | indoor | Temp-controlled staging |
| Yard / curb | `reefer-yard`, `dispatch-curb` | outdoor | Vehicle + parcel dispatch |

## Routes

| Id | From → to | Kind |
| --- | --- | --- |
| `dock-to-cold` | receiving-dock → cold-room | corridor |
| `cold-to-pack` | cold-room → packing-bay | corridor |
| `pack-to-yard` | packing-bay → reefer-yard | path |
| `yard-to-dispatch` | reefer-yard → dispatch-curb | path |

## Related

- Place: [`cold-chain.twin.yaml`](../cold-chain.twin.yaml)
- Resources: [`reefer-truck`](../../../../resource/examples/reefer-truck/), [`cold-parcel`](../../../../resource/examples/cold-parcel/)
- Network: [`airport`](../../airport/), [`port`](../../port/)
