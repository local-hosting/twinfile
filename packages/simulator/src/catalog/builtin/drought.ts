import { definePlaceEvent } from '../place-event-request.js';

export const drought = definePlaceEvent({
  id: "drought",
  name: "Drought",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["advisory","restriction","emergency"],
  expects: {
    "gauge": {
      "kind": "gauge",
      "min": 1
    },
    "collection-point": {
      "kind": "marker",
      "min": 1
    },
    "shelter": {
      "kind": "space",
      "min": 0
    },
    "survey-station": {
      "kind": "station",
      "min": 0
    }
  },
  args: {
    "restrictionAt": {
      "type": "time"
    }
  },
});
