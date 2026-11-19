/** Wire row shape when JTBD catalogs reference KPI ids (full registry is cli metrics / eval). */
export type KpiDefinition = {
  id: string;
  label: string;
  touchpointId?: string;
  visitationGoal?: string;
  visitationSubGoal?: string;
  heartDimension?: string;
  unit?: Record<string, number>;
  grain?: unknown;
  [key: string]: unknown;
};

export type KpiRegistry = {
  specVersion: '1.0';
  methodId: string;
  rows: KpiDefinition[];
};