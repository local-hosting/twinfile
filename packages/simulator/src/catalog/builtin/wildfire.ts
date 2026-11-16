import { definePlaceEvent } from '../place-event-request.js';

export const wildfire = definePlaceEvent({
  id: "wildfire",
  name: "Wildfire",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["watch","evacuation-order","contained"],
  expects: {
    "shelter": {
      "kind": "space",
      "min": 1
    },
    "exit": {
      "kind": "opening",
      "min": 2
    },
    "safe-access": {
      "kind": "marker",
      "min": 1
    }
  },
  args: {
    "evacuationAt": {
      "type": "time"
    }
  },
});
