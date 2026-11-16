import { definePlaceEvent } from '../place-event-request.js';

export const earthquake = definePlaceEvent({
  id: "earthquake",
  name: "Earthquake",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["alert","shaking","survey","all-clear"],
  expects: {
    "shelter": {
      "kind": "space",
      "min": 1
    },
    "exit": {
      "kind": "opening",
      "min": 2
    },
    "outdoor": {
      "kind": "space",
      "min": 0
    }
  },
  args: {
    "shakingAt": {
      "type": "time"
    }
  },
});
