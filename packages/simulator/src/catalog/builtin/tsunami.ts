import { definePlaceEvent } from '../place-event-request.js';

export const tsunami = definePlaceEvent({
  id: "tsunami",
  name: "Tsunami",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["advisory","warning","arrival","all-clear"],
  expects: {
    "flood-refuge": {
      "kind": "marker",
      "min": 1
    },
    "safe-access": {
      "kind": "marker",
      "min": 1
    },
    "water-launch": {
      "kind": "marker",
      "min": 0
    }
  },
  args: {
    "arrivalAt": {
      "type": "time"
    }
  },
});
