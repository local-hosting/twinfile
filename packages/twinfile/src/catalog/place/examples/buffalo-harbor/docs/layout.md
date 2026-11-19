# Buffalo Harbor — layout map

**`open_area`** harbor site: basin, ferry slip, boardwalk. No nested building `copy:`.

```text
  [harbor-basin]  outdoor plaza
        |
        +-- [ferry-slip]  outdoor pier / ground-transport
        |
        +-- [boardwalk]  outdoor alternative path
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Basin | `harbor-basin` | outdoor | Arrival plaza |
| Slip | `ferry-slip` | outdoor | Berth / shuttle fiction |
| Boardwalk | `boardwalk` | outdoor | Visitor stroll |

## Plans

`litter-pollution` `bind:` maps hotspot / safe-access / collection / survey roles around the slip.

## Related

- Resource: [`visitor-shuttle`](../../../../resource/examples/visitor-shuttle/)
- Daily: [`morning-crossing`](../../../../story/examples/morning-crossing/), [`falls-day-tour`](../../../../story/examples/falls-day-tour/)
- Resilience: [`harbor-resilience`](../../../../story/examples/harbor-resilience/)
