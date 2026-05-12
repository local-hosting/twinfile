import { definePlaceEvent } from '../place-event-request.js';

export const transit_disruption = definePlaceEvent({
  id: "transit-disruption",
  name: "Transit disruption",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["disrupted","restored"],
  expects: {
    "ground-transport": {
      "kind": "space",
      "min": 1
    },
    "alternative": {
      "kind": "space",
      "min": 0
    }
  },
  args: {
    "startsAt": {
      "type": "time"
    },
    "line": {
      "type": "string"
    }
  },
});
