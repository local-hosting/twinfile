import { definePlaceEvent } from '../place-event-request.js';

export const flood = definePlaceEvent({
  id: "flood",
  name: "Flood",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["advisory","warning","crest","receding"],
  expects: {
    "flood-refuge": {
      "kind": "marker",
      "min": 1
    },
    "safe-access": {
      "kind": "marker",
      "min": 1
    },
    "gauge": {
      "kind": "gauge",
      "min": 1
    }
  },
  args: {
    "crestAt": {
      "type": "time"
    }
  },
});
