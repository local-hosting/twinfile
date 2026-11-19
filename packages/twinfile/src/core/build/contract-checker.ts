export type ContractErrorCode =
  | 'E_NO_PLAN'
  | 'E_ROLE_MISSING'
  | 'E_ROLE_KIND'
  | 'E_ROLE_REF'
  | 'E_ROLE_MIN'
  | 'E_ROLE_VOCAB'
  | 'E_ROLE_TAG'
  | 'E_TIMETABLE_REF';

export type ContractError = {
  code: ContractErrorCode;
  message: string;
};

export type ExpectsRole = {
  kind: string;
  min: number;
};

export type PlanRoles = Record<string, string[]>;

export type PlaceData = Record<string, IdRow[] | undefined> & {
  spaces?: IdRow[];
  openings?: IdRow[];
  assets?: IdRow[];
  sensors?: IdRow[];
  ai?: IdRow[];
  roles?: IdRow[];
  markers?: IdRow[];
  gauges?: IdRow[];
  stations?: IdRow[];
};

type IdRow = { id: string; roles?: string[]; kind?: string };

function recordsForKind(place: PlaceData, kind: string): IdRow[] {
  switch (kind) {
    case 'space':
      return place.spaces ?? [];
    case 'opening':
      return place.openings ?? [];
    case 'asset':
      return place.assets ?? [];
    case 'sensor':
      return place.sensors ?? [];
    case 'ai':
      return place.ai ?? [];
    case 'role':
      return place.roles ?? [];
    case 'marker':
      return place.markers ?? [];
    case 'gauge':
      return place.gauges ?? [];
    case 'station':
      return place.stations ?? [];
    default:
      return [];
  }
}

export class ContractChecker {
  checkPlanPresent(plan: PlanRoles | undefined, eventName: string): ContractError | null {
    if (!plan || !Object.keys(plan).length) {
      return {
        code: 'E_NO_PLAN',
        message: `No event binding for ${eventName}`,
      };
    }
    return null;
  }

  checkExpects(
    place: PlaceData,
    expects: Record<string, ExpectsRole>,
    planRoles: PlanRoles | undefined,
  ): ContractError[] {
    const errors: ContractError[] = [];
    for (const [roleName, spec] of Object.entries(expects)) {
      const mapped = planRoles?.[roleName];
      if (!mapped?.length) {
        errors.push({
          code: 'E_ROLE_MISSING',
          message: `Role ${roleName} has no binding mapping`,
        });
        continue;
      }
      const pool = recordsForKind(place, spec.kind);
      let matched = 0;
      for (const id of mapped) {
        const row = pool.find((r) => r.id === id);
        if (!row) {
          errors.push({ code: 'E_ROLE_REF', message: `Unknown ${spec.kind} id ${id} for ${roleName}` });
          continue;
        }
        if (spec.kind === 'space' && row.kind && row.kind !== (row as IdRow).kind) {
          /* kind on space record is space type, not role kind */
        }
        matched += 1;
      }
      if (matched < spec.min) {
        errors.push({
          code: 'E_ROLE_MIN',
          message: `Role ${roleName} needs min ${spec.min}, got ${matched}`,
        });
      }
    }
    return errors;
  }
}
