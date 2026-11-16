import { definePlaceEvent } from '../place-event-request.js';

export const severe_weather = definePlaceEvent({
  id: "severe-weather",
  name: "Severe weather",
  version: "1.0.0",
  stability: "stable",
  catalogKind: 'situation',
  phases: ["watch","warning","all-clear"],
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
    "warningAt": {
      "type": "time"
    },
    "all-clearEndAt": {
      "type": "time"
    }
  },
});
