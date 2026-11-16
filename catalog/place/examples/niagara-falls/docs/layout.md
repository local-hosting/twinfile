# Niagara Falls Visitor — layout map

**`open_area`** visitor plaza: gathering plaza, overlook, tram stop. No nested building `copy:`.

```text
  [visitor-plaza]  outdoor / ground-transport
        |
        +-- [overlook]  outdoor viewing
        |
        +-- [tram-stop]  covered transit
```

| Region | Space ids | Exposure | Notes |
| --- | --- | --- | --- |
| Plaza | `visitor-plaza` | outdoor | Tour arrival |
| Overlook | `overlook` | outdoor | Falls viewing fiction |
| Tram | `tram-stop` | covered | Falls tram resource pin |

## Plans

`litter-pollution` `bind:` maps hotspot / safe-access / collection / survey roles on the plaza loop.

## Related

- Resource: [`falls-tram`](../../../../resource/examples/falls-tram/)
- Daily: [`falls-day-tour`](../../../../story/examples/falls-day-tour/)
