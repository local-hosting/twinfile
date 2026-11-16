import { definePlaceEvent } from '../place-event-request.js';

export const volcanic_ash = definePlaceEvent({
  id: "volcanic-ash",
  name: "Volcanic ash",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["advisory","ashfall","all-clear"],
  expects: {
    "shelter": {
      "kind": "space",
      "min": 1
    },
    "exit": {
      "kind": "opening",
      "min": 1
    },
    "survey-station": {
      "kind": "station",
      "min": 0
    }
  },
  args: {
    "ashfallAt": {
      "type": "time"
    }
  },
});
