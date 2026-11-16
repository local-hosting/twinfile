# Event catalog

`@doppler-group/twinfile-event` — what happens at a place: phases, `expects` roles, args.

`examples/<id>/<id>.twin.yaml` — catalog events (hazards, operations, programmes).

Tag every event with **`mode: daily`** or **`mode: resilience`** (default when omitted is resilience). Daily events cover everyday operations (queues, game day, ferry legs). Resilience events cover hazards, shelter, and recovery.

| Mode | Examples |
| --- | --- |
| **daily** | `arena-game-day`, `dawn-cast-off`, `dunkirk-return`, `falls-loop`, `harbor-berth`, `passenger-queue`, `reach-patrol`, `transit-disruption`, `venue-turnstile-flow` |
| **resilience** | `dam-release`, `drought`, `earthquake`, `field-damage`, `flood`, `litter-pollution`, `power-outage`, `recovery-resilience`, `severe-weather`, `slope-movement`, `tsunami`, `volcanic-ash`, `wildfire` |
