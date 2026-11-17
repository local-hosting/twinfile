import { z } from 'zod';
import {
  StrategyScenarioMotivationsSchema,
  StrategyScenarioTitlesSchema,
} from '../graph/customer-relationships.js';

const score = () => z.number().min(0).max(100);
const ratio = () => z.number().min(0).max(1);

export const AttitudeScaleItemSchema = z.object({
  highStatement: z.string().min(1),
  lowStatement: z.string().min(1),
  value: ratio(),
});

export const TechAttitudesSchema = z.object({
  alwaysConnected: AttitudeScaleItemSchema.optional(),
  connectingWithOthers: AttitudeScaleItemSchema.optional(),
  securityConcerns: AttitudeScaleItemSchema.optional(),
  techAdoption: AttitudeScaleItemSchema.optional(),
  techComfort: AttitudeScaleItemSchema.optional(),
  techExpertise: AttitudeScaleItemSchema.optional(),
  willingnessToPay: AttitudeScaleItemSchema.optional(),
});

export const TelecomAttitudesSchema = z.object({
  bundlingConvenience: AttitudeScaleItemSchema.optional(),
  bundlingToSaveMoney: AttitudeScaleItemSchema.optional(),
  costVsQuality: AttitudeScaleItemSchema.optional(),
  customerService: AttitudeScaleItemSchema.optional(),
  flexibility: AttitudeScaleItemSchema.optional(),
  innovativeTech: AttitudeScaleItemSchema.optional(),
  loyalty: AttitudeScaleItemSchema.optional(),
  opennessToSwitching: AttitudeScaleItemSchema.optional(),
  supportPreference: AttitudeScaleItemSchema.optional(),
  telecomPrice: AttitudeScaleItemSchema.optional(),
  telecomVariety: AttitudeScaleItemSchema.optional(),
});

export const FinanceAndLoyaltyPsychographicsSchema = z.object({
  confidenceToManageFinances: score().optional(),
  importantCompaniesRewardLoyalty: score().optional(),
  savvyWithSpending: score().optional(),
  stickCloseToBudget: score().optional(),
});

export const ProductivitySimplificationPsychographicsSchema = z.object({
  overwhelmedByDailyTasks: score().optional(),
  simplerLifeHappier: score().optional(),
  striveToIncreaseProductivity: score().optional(),
  willingToPayForTaskHelp: score().optional(),
});

export const SocialAttitudePsychographicsSchema = z.object({
  beingWithOthersMakesMeFeelEnergized: score().optional(),
  importantToHaveTimeAloneToRecharge: score().optional(),
  regularlyTryNewThingsToImproveSelf: score().optional(),
});

export const TechnologyTrendsPsychographicsSchema = z.object({
  accessibleNoMatterWhereIAm: score().optional(),
  frustratedWhenCantFindAnswer: score().optional(),
  importantToHaveNewestAndBest: score().optional(),
  loveToFollowLatestTrends: score().optional(),
  overwhelmedByEntertainmentOptions: score().optional(),
});

export const SegmentPsychographicsSchema = z.object({
  financeAndLoyalty: FinanceAndLoyaltyPsychographicsSchema.optional(),
  productivitySimplification: ProductivitySimplificationPsychographicsSchema.optional(),
  socialAttitude: SocialAttitudePsychographicsSchema.optional(),
  technologyTrends: TechnologyTrendsPsychographicsSchema.optional(),
});

export const SegmentAttitudesBodySchema = z.object({
  attitudeScales: z
    .object({
      tech: TechAttitudesSchema.optional(),
      telecom: TelecomAttitudesSchema.optional(),
    })
    .optional(),
  psychographics: SegmentPsychographicsSchema.optional(),
});

export const SegmentAttitudesFacetSchema = z.object({
  attitudes: SegmentAttitudesBodySchema,
});

export const PercentageMapSchema = z.record(z.string().min(1), score());

export const RankedPurchaseFactorSchema = z.object({
  factor: z.string().min(1),
  percentage: score(),
  rank: z.number().int().positive(),
});

export const ProviderAttributesSchema = z.object({
  activelySecurity: score().optional(),
  bestValueForPrice: score().optional(),
  highSpeedInternet: score().optional(),
  mobileCoverage: score().optional(),
  putsCustomerFirst: score().optional(),
  reliableConnection: score().optional(),
  responsiveCustomerService: score().optional(),
});

export const SwitchingBehaviorSchema = z.object({
  barriers: PercentageMapSchema.optional(),
  triggers: PercentageMapSchema.optional(),
  internetSwitchFrequency: score().optional(),
  internetSwitchLikelihood: score().optional(),
  mobileSwitchFrequency: score().optional(),
  mobileSwitchLikelihood: score().optional(),
  tvSwitchFrequency: score().optional(),
  tvSwitchLikelihood: score().optional(),
});

export const PurchaseFactorsSchema = z.object({
  providerAttributes: ProviderAttributesSchema.optional(),
  topFactors: z.array(RankedPurchaseFactorSchema).default([]),
  uniqueNuances: z.array(z.string()).default([]),
});

export const ReachabilitySchema = z.object({
  advertisingAttention: PercentageMapSchema.optional(),
  infoSources: PercentageMapSchema.optional(),
  preferredPurchaseChannel: PercentageMapSchema.optional(),
  questionsTheyHave: PercentageMapSchema.optional(),
  socialMediaUsed: PercentageMapSchema.optional(),
});

export const SegmentBehaviorBodySchema = z.object({
  switchingBehavior: SwitchingBehaviorSchema.optional(),
  purchaseFactors: PurchaseFactorsSchema.optional(),
  reachability: ReachabilitySchema.optional(),
});

export const SegmentBehaviorFacetSchema = z.object({
  behavior: SegmentBehaviorBodySchema,
});

export const DesiredEmotionalBenefitsSchema = z.object({
  confident: score().optional(),
  connected: score().optional(),
  entertained: score().optional(),
  impressed: score().optional(),
  inControl: score().optional(),
  inspired: score().optional(),
  productive: score().optional(),
  secure: score().optional(),
  stressFree: score().optional(),
  supported: score().optional(),
  valued: score().optional(),
});

export const SegmentEmotionsBodySchema = z.object({
  currentEmotions: z
    .object({
      frustrationTriggers: z.array(z.string().min(1)).default([]),
      towardCurrentProvider: z.string().min(1).optional(),
    })
    .optional(),
  desiredEmotionalBenefits: DesiredEmotionalBenefitsSchema.optional(),
  futureEmotions: z
    .object({
      avoid: z.string().min(1).optional(),
      desired: z.string().min(1).optional(),
      successFeeling: z.string().min(1).optional(),
    })
    .optional(),
});

export const SegmentEmotionsFacetSchema = z.object({
  emotions: SegmentEmotionsBodySchema,
});

export const SegmentBundlingServiceSchema = z.object({
  preference: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  willingToPay: z.string().min(1).optional(),
});

export const SegmentInternetServiceSchema = z.object({
  hasService: score().optional(),
  primaryUse: z.array(z.string().min(1)).optional(),
  priorities: z.array(z.string().min(1)).optional(),
  reliabilityImportance: z.string().min(1).optional(),
  speedPreference: z.string().min(1).optional(),
});

export const SegmentLandlineServiceSchema = z.object({
  hasService: score().optional(),
});

export const SegmentMobileServiceSchema = z.object({
  hasService: score().optional(),
  dataUsage: z.string().min(1).optional(),
  preference: z.string().min(1).optional(),
});

export const SegmentStreamingServiceSchema = z.object({
  hasService: score().optional(),
  averageServiceCount: z.number().nonnegative().optional(),
  behavior: z.array(z.string().min(1)).optional(),
  platforms: z.array(z.string().min(1)).optional(),
  preference: z.string().min(1).optional(),
});

export const SegmentTelevisionServiceSchema = z.object({
  hasService: score().optional(),
  content: z.array(z.string().min(1)).optional(),
  orientation: z.string().min(1).optional(),
  preference: z.string().min(1).optional(),
  traditionalTV: score().optional(),
  vMVPD: score().optional(),
});

export const SegmentServicesBodySchema = z.object({
  bundling: SegmentBundlingServiceSchema.optional(),
  internet: SegmentInternetServiceSchema.optional(),
  landline: SegmentLandlineServiceSchema.optional(),
  mobile: SegmentMobileServiceSchema.optional(),
  streaming: SegmentStreamingServiceSchema.optional(),
  tv: SegmentTelevisionServiceSchema.optional(),
});

export const SegmentServicesFacetSchema = z.object({
  services: SegmentServicesBodySchema,
});

export const SegmentStrategyBodySchema = z.object({
  acquisition: z
    .object({
      openness: z.string().min(1).optional(),
      strategies: z.array(z.string().min(1)).default([]),
    })
    .optional(),
  retention: z
    .object({
      strategies: z.array(z.string().min(1)).default([]),
      targetType: z.string().min(1).optional(),
    })
    .optional(),
});

export const SegmentScenariosSchema = z.object({
  journeyTitles: StrategyScenarioTitlesSchema.optional(),
  storyMotivations: StrategyScenarioMotivationsSchema.optional(),
});

export const SegmentStrategyFacetSchema = z.object({
  strategy: SegmentStrategyBodySchema.optional(),
  scenarios: SegmentScenariosSchema.optional(),
});

export const SegmentPersonaAttitudeSchema = z.object({
  bundleToSave: z.boolean().optional(),
  firstToTryTech: z.boolean().optional(),
  haveInnovation: z.boolean().optional(),
  haveTheBasics: z.boolean().optional(),
  haveTheBest: z.boolean().optional(),
  lastToTryTech: z.boolean().optional(),
  onlineSupport: z.boolean().optional(),
  personalSupport: z.boolean().optional(),
  securityConcerns: z.boolean().optional(),
});

export const SegmentPersonaPreferencesSchema = z.object({
  communication: z.array(z.string().min(1)).optional(),
  subscribedServices: z.array(z.string().min(1)).optional(),
  technology: z.array(z.string().min(1)).optional(),
});

export type AttitudeScaleItem = z.infer<typeof AttitudeScaleItemSchema>;
export type SegmentAttitudesFacet = z.infer<typeof SegmentAttitudesFacetSchema>;
export type SegmentBehaviorFacet = z.infer<typeof SegmentBehaviorFacetSchema>;
export type SegmentEmotionsFacet = z.infer<typeof SegmentEmotionsFacetSchema>;
export type SegmentServicesFacet = z.infer<typeof SegmentServicesFacetSchema>;
export type SegmentStrategyFacet = z.infer<typeof SegmentStrategyFacetSchema>;
export type SegmentPersonaAttitude = z.infer<typeof SegmentPersonaAttitudeSchema>;
export type SegmentPersonaPreferences = z.infer<typeof SegmentPersonaPreferencesSchema>;
