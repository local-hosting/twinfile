import { z } from 'zod';

/** Canonical default intent ids shipped in getDefaultCustomerCatalog(). */
export const DefaultCustomerIntentIdSchema = z.enum([
  'learn',
  'purchase',
  'switch',
  'setup',
  'rejoin',
  'fix',
  'upgrade',
  'downgrade',
  'cancel',
]);

/** Client catalog intent ids — default set plus extensions. */
export const CustomerIntentIdSchema = z.string().min(1);

export const FocusAreaIdSchema = z.string().min(1);
export const PsychographicSegmentIdSchema = z.string().min(1);
export const ShoppingMethodIdSchema = z.string().min(1);

/** In-store / journey empathy phases shared by sales and service tracks. */
export const EmpathyJourneyPhaseIdSchema = z.enum([
  'Awareness',
  'Decision to Visit',
  'Prep for Visit',
  'Arrival',
  'Engage',
  'Dwell',
  'Exit & Reflect',
]);

/** Strategy scenario keys mapped to visit opportunities. */
export const VisitOpportunityScenarioKeySchema = z.enum(['Fixer', 'Prospect', 'Upgrader']);

export type DefaultCustomerIntentId = z.infer<typeof DefaultCustomerIntentIdSchema>;
export type CustomerIntentId = z.infer<typeof CustomerIntentIdSchema>;
export type FocusAreaId = z.infer<typeof FocusAreaIdSchema>;
export type PsychographicSegmentId = z.infer<typeof PsychographicSegmentIdSchema>;
export type EmpathyJourneyPhaseId = z.infer<typeof EmpathyJourneyPhaseIdSchema>;
export type VisitOpportunityScenarioKey = z.infer<typeof VisitOpportunityScenarioKeySchema>;
