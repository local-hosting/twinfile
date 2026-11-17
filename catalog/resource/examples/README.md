# Resource examples

Equipment, material, and product twins use **`<unit>.twin.yaml`**. Each unit is `resource/examples/<id>/` and publishes as `twinfile/resource/<id>:<ver>`.

**Sensor bases:** `base-sensor` (global DTPR + sample skeleton) → `wireless-sensor` (`from:` + wireless link) → site sensors (`cold-temp-sensor`, `cold-humidity-sensor`).

**Network base:** `base-network` (`kind: network`) — Contentful Research Center networks live in `@doppler-group/sensors-twinfile`.

**Tennessee watershed sensors** (`water-quality-sensor`, `river-buoy`, `bend-buoy`) live in `@doppler-group/river-twinfile`.

| Id | Place |
| --- | --- |
| `base-sensor` | — (resource base) |
| `wireless-sensor` | — (extends `base-sensor`) |
| `base-network` | — (resource base) |
| `greeter-kiosk` | shop |
| `terminal-kiosk` | airport |
| `concession-cart` | arena |
| `trail-station` | park |
| `gallery-kiosk` | museum |
| `exhibit-kiosk` | aquarium |
| `classroom-kiosk` | school |
| `gangway-kiosk` | port |
| `pavilion-kiosk` | expo |
| `river-gauge` | river |
| `hub-kiosk` | transit-hub-campus |
| `station-kiosk` | mobility-hub |
| `dock-crane` | dunkirk-dock |
| `visitor-shuttle` | buffalo-harbor |
| `reefer-truck` | cold-chain |
| `cold-parcel` | cold-chain (on `cold-pallet`) |
| `cold-pallet` | cold-chain |
| `cold-temp-sensor` | cold-chain (extends `wireless-sensor`) |
| `cold-humidity-sensor` | cold-chain (extends `wireless-sensor`) |
| `falls-tram` | niagara-falls |
