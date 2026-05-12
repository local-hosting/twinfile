import { createEventCatalog } from '../event-catalog.js';

import { dam_release } from './dam-release.js';
import { drought } from './drought.js';
import { earthquake } from './earthquake.js';
import { field_damage } from './field-damage.js';
import { flood } from './flood.js';
import { litter_pollution } from './litter-pollution.js';
import { passenger_queue } from './passenger-queue.js';
import { power_outage } from './power-outage.js';
import { recovery_resilience } from './recovery-resilience.js';
import { severe_weather } from './severe-weather.js';
import { slope_movement } from './slope-movement.js';
import { transit_disruption } from './transit-disruption.js';
import { tsunami } from './tsunami.js';
import { venue_turnstile_flow } from './venue-turnstile-flow.js';
import { volcanic_ash } from './volcanic-ash.js';
import { wildfire } from './wildfire.js';

export const simulatorBuiltinEventCatalog = createEventCatalog().registerMany([
  dam_release,
  drought,
  earthquake,
  field_damage,
  flood,
  litter_pollution,
  passenger_queue,
  power_outage,
  recovery_resilience,
  severe_weather,
  slope_movement,
  transit_disruption,
  tsunami,
  venue_turnstile_flow,
  volcanic_ash,
  wildfire,
]);
