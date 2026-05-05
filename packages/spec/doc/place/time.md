# Time: clock, tracks, schedules, feeds

See [RFC 0003](../../rfcs/0003-time.md) for motivation. Host alignment: [World session](world-session.md) (player vs runner, cross-repo cleanup).

## Clock

A scenario MAY declare **`clock`**:

```yaml
clock:
  starts_at: "2026-06-12T09:00:00-04:00"
  duration: PT6H
  step: PT5M
```

- `starts_at` MUST be RFC 3339 with an explicit offset (`Z` or `±HH:MM`). Wall-clock times without an offset are rejected so results never depend on the machine running them.
- `duration` and `step` MUST be positive ISO 8601 durations, with `step` ≤ `duration`.
- `t` is seconds since `starts_at`. Samples exist at `t = 0, step, 2·step, …, ≤ duration`.
- Local times (curves, schedules) use `place.timezone` (IANA name).

Every sample MUST be a pure function of `t`, the **merged place** (`Place.data`), feed files, and the run seed, so a viewer can jump to any `t` in either direction and get the same answer.

Implementations expose this as **`openTimelineForPlace`** / **`timeline.at(t)`** in `@local-hosting/twinfile-simulator` (see also [Glossary — World time](../glossary.md#world-time-clock-timeline-player-runner)).

## Session and player (live)

A **session** is a built `Place` plus scenario **`clock:`** and a playhead **`t`**. The host **player** advances `t` (scrub, play, or speed multiplier) and steers the live twin:

1. Read **`sample = timeline.at(t)`** (schedules, tracks, phases, occupancy — same as runner input).
2. On schedule or phase **edges**, publish **`TwinMessageV1`** on the patch **module bus** (see [Patch](../pack/patch.md): `signal:trigger`, `twin:situation`, data-lane `signal:*`).

That is **playback** — not **`twin run`**. Product buttons use the same payloads as **play**; see glossary **Player**.

A run MAY declare **`clock:`** without **`use.runner`** when the goal is session-only (workbench Time, host play) with no frozen stdout contract.

## Runner (offline answer)

**`use.runner`** names the **ENTRYPOINT** that answers **`question:`** for `twin run` / verify. It consumes the same **timeline** on stdin (below); stdout is JSON Lines, not patch wires. Built-in runners may run in-process; **`npm:`** pins stay subprocess unless the host opts in with consent ([`gov/security.md`](../gov/security.md)).

**Player and runner share the clock; sinks differ:** player → module bus; runner → run records. Algorithms (e.g. threshold replay) can be one library with two sinks — see [Runners](../pack/runners.md).

## Tracks

**`tracks.yaml`** → `tracks[]`. Each track has an `id`, a `source`, and optionally `unit` and `interpolate`.

| `source` | Reads | Required fields |
| --- | --- | --- |
| `solar` | Sun elevation in degrees (NOAA approximation, no refraction) | `place.location` |
| `curve` | Daily `HH:MM → value` points in local time | `points` |
| `feed` | One property from a sensor or gauge feed | `device`, `property` |
| `schedule` | `value` (default 1) while the schedule is active, else 0 | `schedule` |
| `coverage` | Expected RF at a **space** from a **radio** asset | `radio`, `space`; optional `metric` (`served` default, or `rssi_dbm`), `threshold_dbm`, `profile`, `engine` |

**Curves** wrap: between the last point of a day and the first point of the next, values interpolate across midnight. Curves support `linear` (default) and `step`.

**Feeds** sample readings by `observed_at`:

| `interpolate` | Value at `t` |
| --- | --- |
| `linear` (default) | Linear between surrounding readings; the last reading holds after the end; `null` before the first |
| `step` | Last reading at or before `t`; `null` before the first |
| `none` | A reading observed in `(t − step, t]`, else `null` (gaps stay visible) |

Readings with a `quality` other than `ok` are skipped.

Each sample reports two values per track:

- **`tracks`** — what the value actually was at `t`.
- **`known`** — for feeds, the latest reading whose `available_at` (default: `observed_at`) is at or before `t`, held without interpolation. For other sources it equals `tracks`.

The gap between the two is the delay between something happening and anyone being able to know it.

## Schedules

**`schedules.yaml`** → `schedules[]`:

```yaml
schedules:
  - id: produce-delivery
    when: Mo,We,Fr 06:00-06:45
    uses: { opening: door-back, space: stockroom }
    variance: { start: PT15M }
```

- `when` is an opening-hours subset: days (`Mo`–`Su`, ranges and comma lists), a space, then `HH:MM-HH:MM` windows (comma list). Rules join with `; `. Windows MUST end after they start; split overnight windows into two rules.
- `uses` names what the schedule occupies while active.
- **`activeWhen`** (optional) — `{ track, min?, max? }`. The schedule is active only when its `when` window applies **and** the named track’s value at the same instant satisfies the bounds (inclusive). Typical use: gate outdoor activity on a **`solar`** track (`min: 0` for sun above the horizon).
- `variance.start` delays each occurrence by `floor(u · variance)` seconds, where `u` is the first 4 bytes (big-endian) of `sha256("<seed>:<id>:<nominal start, UTC ISO 8601 with milliseconds>")` divided by 2³². The whole window shifts; its length is unchanged.

## Feeds

A sensor or gauge with `feed: { protocol: file, url: <path>.jsonl }` points at a JSON Lines file relative to the place root. `protocol` may also be `sensorthings` or `ngsi-ld`. Those name a live endpoint in `url` and a JSON Lines file in `replay`. `twin feed pull` writes `replay` before `twin run`. The clock and the runner read that file. They do not open the socket, so a sample stays a pure function of `t`, the merged place, the feed files, and the seed.

SensorThings `phenomenonTime` → `observed_at`, `resultTime` → `available_at`. NGSI-LD `observedAt` → `observed_at`, `dateModified` → `available_at`.

A command record (`type: command`) is written after the runner exits and is sent in a later step. It is not a feed row, so it does not change the next sample.

Each line is a feed row ([`run/feed.schema.json`](../../schemas/1/run/feed.schema.json)):

```json
{"device_id":"sonde-eddy-pool","observed_property":"turbidity","value":48,"unit":"NTU","observed_at":"2026-06-12T14:00:00Z","available_at":"2026-06-12T15:00:00Z"}
```

Field names follow `sensor.v1` readings. `available_at` MUST NOT be earlier than `observed_at`. A feed track whose device or rows are missing MUST fail the run rather than produce empty output.

### Simulated feeds

A sensor or gauge MAY declare **`simulate:`** instead of (or ahead of) a file `feed:`. Given the scenario **`clock`**, run **seed**, **phase start** times (below), and device id, the implementation generates feed rows in the same JSON Lines shape. **`every`** is the reading interval; optional **`uplink`** rounds each row’s `available_at` up to the next uplink boundary from `clock.starts_at`; optional **`dropout`** (0–1) drops readings deterministically from `sha256(seed:device:bucket:dropout)`.

Each reported property (listed in **`properties[]`** or as a key on `simulate:`) MAY define:

| Field | Role |
| --- | --- |
| `baseline` | Value when no response is active |
| `noise` | Seeded amplitude; per-reading offset from `sha256(seed:device:property:bucket:noise)` |
| `response` | `{ phase, peak, rise, decay }` — triangular bump after `phaseStarts[phase]`: linear rise over `rise`, linear decay over `decay`, adding up to `peak` on top of baseline and noise |

If both `simulate:` and `feed:` are present, **`simulate:` wins** for timeline sampling.

### Coverage (expected RF)

Network **`assets`** MAY declare **`radio`**: `{ protocol: wifi | ble | lora, tx_power_dbm? }` with a **`space`** anchor.

**`coverage`** tracks sample expected signal at a target **`space`** from that **`radio`** asset. Values are a pure function of the merged place (spaces, routes, openings, optional **`coverage_profiles`**) and do not use feed uplink delay — **`known`** equals **`tracks`**.

| Field | Role |
| --- | --- |
| `metric` | `served` (default): 1 when modeled RSSI ≥ `threshold_dbm` (default −75), else 0; `rssi_dbm`: modeled RSSI in dBm |
| `profile` | Id from built-in or merged **`coverage_profiles`** (defaults: `twinfile-wifi-v0`, …) |
| `engine` | Propagation engine id (default `graph-v0`: shortest path on routes + openings) |

Optional **`coverage_profiles.yaml`** → `coverage_profiles[]` patches loss constants by profile id. Compare **`coverage`** tracks to probe **`feed`** tracks on the same timeline for expectation vs observation.

## Situation phases on the clock

Situations declare ordered **`phases`**. For each phase id `foo`, the situation MAY declare a time arg **`fooAt`** (e.g. **`releaseAt`** for phase `release`). Scenario **`args`** supply values: seconds since `clock.starts_at`, an ISO 8601 duration (same as track offsets), or an RFC 3339 instant. When a declared time arg is omitted, phase **`release`** defaults to **`t = 0`**.

The precomputed timeline includes **`phaseStarts`**: `{ "<phase>": <t seconds>, … }`. Runners emit phase events at the mapped `t` (e.g. `{ type: "phase", phase: "release", t: … }`).

## Runner input

When a scenario declares a clock, the runner payload includes:

```json
{ "timeline": { "clock": { … }, "kinds": { "stage": "m" }, "phaseStarts": { "release": 0 }, "samples": [ { "t": 0, "at": "…", "mode": "place", "tracks": {}, "known": {}, "active": [], "occupancy": [], "visit_beats": [] } ] } }
```

**`mode`** on each sample is the summary layout id (**`place`**). Hazard and recovery fiction appear in **`phaseStarts`**, **`active`**, **`occupancy`**, and host **`twin:situation`** pulses — not a catalog **`mode:`** field on presets.

`active` lists schedules active at `t` with their `uses` and actual `starts_at` / `ends_at`, sorted by id.

**`occupancy`** repeats each active schedule that declares `uses`: `{ schedule, starts_at, ends_at, space?, opening?, route?, marker? }` — which parts of the place are in use, without naming people.

**`visit_beats`** lists visit rows whose optional **`during`** schedule id is active (see `visits.yaml` in [Place layers](place.md)).
