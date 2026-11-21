# Runners

A **runner** is the offline **ENTRYPOINT** pinned by scenario **`use.runner`** (`npm:` refs only). It answers **`question:`** — not live patch playback (glossary **Player** / [Time — Session and player](../place/time.md#session-and-player-live)).

Stdin JSON: `{ bundle, layers, scenario, plans, seed }`, plus `timeline` when the scenario declares a `clock` (see [Time](../place/time.md#runner-input)). Stdout: JSON Lines run records. Stderr: logs.

**Same timeline as the player:** both read `timeline.at(t)` semantics; runners batch-answer or emit metrics on stdout, while the host player publishes controls on the module bus. Consolidate algorithms in core; keep **`use.runner`** as the manifest pin and subprocess boundary for untrusted packages.

Records: `{ t, type: state|phase|metric|command, runner?, … }`.

A runner that cannot answer its question (missing clock, unknown track, unreadable feed) MUST exit non-zero rather than emit placeholder metrics.

## Scenario args (shelter / resources)

Hydraulic-style runners read **`args.target_role`** (e.g. `shelter`) and headcount from **`args.attendance`** or **`args.occupancy`**. Space capacity comes from merged **`spaces[]`** with that role.

Optional **`args.resources`** names stockpiles (e.g. `cots`, `water_liters`) that may also appear on merged **`assets[]`** via `ext.shelter_resource` (golden: [`examples/arena/parts/concourse`](../../../src/catalog/place/examples/arena/parts/concourse/)). Other stock uses **`ext.relief_resource`** per [`hr-marker-crosswalk.yaml`](../../conf/hr-marker-crosswalk.yaml).

When **`target_role: shelter`** and **`args.resources`** is set, `@twinfile/runner-hydraulic` also emits **`resource_shortfall_<key>`** metrics: `max(0, headcount − supply)` where `supply` is the greater of the declared amount and summed asset capacities for that resource key.

## Several runners, one clock

`use.runner` stays the entrypoint. A scenario that needs more than one model lists them under that entrypoint:

```yaml
use:
  runner: npm:@twinfile/runner-compose@^0
  runners:
    - id: flood
      runner: npm:@twinfile/runner-hydraulic@^0
    - id: queue
      runner: npm:@twinfile/runner-queue@^0
```

Compose runs each child on the same stdin bundle and the same precomputed timeline. It merges stdout by `t`, prefixes each record with that child's `id` (`runner`), and exits non-zero if any child does. Children do not see each other's stdout during the step. When one model needs another's output, that output is a feed file from an earlier run, then pulled in as a feed (see [Time](../place/time.md#feeds)).

## Commands

A command back to a device is a run record `{ t, type: command, … }`. The host writes those records after the runner process exits. Sending them (`twin command send --allow-send`) is a separate step with the same consent rule as executing a runner. A command is not a feed row and is not an input to the next sample.

