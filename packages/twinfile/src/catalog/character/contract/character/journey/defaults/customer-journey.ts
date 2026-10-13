import type { CustomerCatalog } from '../../people/customer/profile/customer.js';
import type {
  CustomerFamilyUserTypeId,
  CustomerJourney,
  CustomerJourneyCatalog,
  UserJourneyPhase,
} from '../user-journey.schema.js';
import type { UserTypeDefinition } from '../../people/customer/profile/user-type-definition.js';
import { HeartDimensionIdSchema } from '../../shared/heart-dimension-id.schema.js';
import { DEFAULT_CUSTOMER_CATALOG } from '../../people/audience/defaults/customer-catalog.js';

const CUSTOMER_FAMILY_TYPES: CustomerFamilyUserTypeId[] = ['lead', 'prospect', 'customer'];

function phasesForUserType(
  catalog: CustomerCatalog,
  userType: UserTypeDefinition,
): UserJourneyPhase[] {
  const stageById = new Map(catalog.lifecycleStages.map((stage) => [stage.id, stage]));

  return userType.lifecycleStageIds.map((stageId, order) => {
    const stage = stageById.get(stageId);
    if (!stage) {
      throw new Error(`Unknown lifecycle stage "${stageId}" for user type "${userType.id}"`);
    }

    const heartDimensionRaw = catalog.links?.heartDimensionByLifecycleStage?.[stageId];
    const heartDimensionId = heartDimensionRaw
      ? HeartDimensionIdSchema.parse(heartDimensionRaw)
      : undefined;

    return {
      id: stageId,
      label: stage.label,
      order,
      goal: stage.customerNeeds?.goals[0] ?? stage.label,
      description: stage.description,
      context: stage.description ?? stage.label,
      lifecycleStageId: stageId,
      intentIds: userType.defaultIntentIds,
      opportunityIds: userType.opportunityIds,
      engagementLevelIds: userType.engagementLevelIds,
      obstacleIds: [],
      painPointIds: stage.customerNeeds?.painPointIds ?? [],
      heartDimensionId,
      touchpointIds: [],
      jobIds: [],
      funnelStages: [],
    };
  });
}

/** Build a customer journey from catalog user type lifecycle stages. */
export function buildCustomerJourneyForUserType(
  catalog: CustomerCatalog,
  userTypeId: CustomerFamilyUserTypeId,
): CustomerJourney {
  const userType = catalog.userTypes.find((row) => row.id === userTypeId);
  if (!userType) {
    throw new Error(`Unknown user type "${userTypeId}" in customer catalog`);
  }

  const phases = phasesForUserType(catalog, userType);

  return {
    id: `${userTypeId}-journey`,
    label: `${userType.label} journey`,
    description: userType.description,
    context: userType.description,
    userTypeId,
    journeyGoal: `Guide ${userType.label.toLowerCase()} audience from first touch to relationship depth`,
    phases,
  };
}

/** Default customer-family journeys derived from getDefaultCustomerCatalog(). */
export function getDefaultCustomerJourneyCatalog(
  catalog: CustomerCatalog = DEFAULT_CUSTOMER_CATALOG,
): CustomerJourneyCatalog {
  return {
    specVersion: '1.0',
    journeys: CUSTOMER_FAMILY_TYPES.map((userTypeId) =>
      buildCustomerJourneyForUserType(catalog, userTypeId),
    ),
  };
}
