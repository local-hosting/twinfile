import { definePlaceEvent } from '../place-event-request.js';

export const dam_release = definePlaceEvent({
  id: "dam-release",
  name: "Dam release",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["notice","release","peak","receding"],
  expects: {
    "water-launch": {
      "kind": "marker",
      "min": 1
    },
    "flood-refuge": {
      "kind": "marker",
      "min": 1
    },
    "gauge": {
      "kind": "gauge",
      "min": 1
    }
  },
  args: {
    "releaseAt": {
      "type": "time"
    },
    "threshold": {
      "type": "number"
    }
  },
});
