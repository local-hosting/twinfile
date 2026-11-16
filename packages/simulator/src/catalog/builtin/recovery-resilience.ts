import { definePlaceEvent } from '../place-event-request.js';

export const recovery_resilience = definePlaceEvent({
  id: "recovery-resilience",
  name: "Post-hazard recovery — staging relief, surveying damage, standing down shelters",
  version: "0.1.0",
  stability: "example",
  catalogKind: 'situation',
  phases: ["recovery","restoration","standing-down"],
  expects: {
    "shelter": {
      "kind": "space",
      "min": 0
    },
    "staging": {
      "kind": "space",
      "min": 0
    },
    "survey-station": {
      "kind": "station",
      "min": 0
    }
  },
  args: {
    "restorationAt": {
      "type": "time",
      "default": "PT1H"
    }
  },
});
