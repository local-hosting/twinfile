import { definePlaceEvent } from '../place-event-request.js';

export const passenger_queue = definePlaceEvent({
  id: "passenger-queue",
  name: "Passenger queue",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["steady","backlog","cleared"],
  expects: {
    "ground-transport": {
      "kind": "space",
      "min": 1
    }
  },
  args: {
    "startsAt": {
      "type": "time"
    },
    "lanes": {
      "type": "integer"
    }
  },
});
