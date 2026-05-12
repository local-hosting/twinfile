import { definePlaceEvent } from '../place-event-request.js';

export const venue_turnstile_flow = definePlaceEvent({
  id: "venue-turnstile-flow",
  name: "Venue turnstile flow",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["pre-open","peak-arrival","gates-closed"],
  expects: {
    "gate": {
      "kind": "opening",
      "min": 1
    },
    "seating": {
      "kind": "space",
      "min": 1
    }
  },
  args: {
    "doorsAt": {
      "type": "time"
    },
    "kickoffAt": {
      "type": "time"
    }
  },
});
