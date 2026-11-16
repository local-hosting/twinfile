import { definePlaceEvent } from '../place-event-request.js';

export const field_damage = definePlaceEvent({
  id: "field-damage",
  name: "Field damage",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["reported","active","cleared"],
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
    "activeAt": {
      "type": "time"
    }
  },
});
