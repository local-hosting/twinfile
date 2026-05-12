import { definePlaceEvent } from '../place-event-request.js';

export const litter_pollution = definePlaceEvent({
  id: "litter-pollution",
  name: "Litter and pollution",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["baseline","post-storm-surge","cleared"],
  expects: {
    "hotspot": {
      "kind": "marker",
      "min": 1
    },
    "safe-access": {
      "kind": "marker",
      "min": 1
    },
    "collection-point": {
      "kind": "marker",
      "min": 1
    },
    "survey-station": {
      "kind": "station",
      "min": 0
    }
  },
  args: {
    "surgeAt": {
      "type": "time"
    },
    "threshold": {
      "type": "number"
    }
  },
});
