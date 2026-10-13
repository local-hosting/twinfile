# Dunkirk Dock — layout map

**`open_area`** pier site: dock apron, crane yard, passenger shed. No nested building `copy:`.

```text
  [dock-apron]  outdoor pier / ground-transport
        |
        +-- [crane-yard]  outdoor yard
        |
        +-- [passenger-shed]  covered shelter
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Apron | `dock-apron` | outdoor | Cast-off / berth fiction |
| Yard | `crane-yard` | outdoor | Dock crane resource pin |
| Shed | `passenger-shed` | covered | Shelter role |

## Plans

`litter-pollution` `bind:` maps hotspot / safe-access / collection / survey roles on the apron.

## Related

- Resource: [`dock-crane`](../../../../resource/examples/dock-crane/)
- Daily: [`morning-crossing`](../../../../story/examples/morning-crossing/)
- Resilience: [`harbor-resilience`](../../../../story/examples/harbor-resilience/)
