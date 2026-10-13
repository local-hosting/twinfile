export type TwinfileAuditFindingLevel = 'info' | 'warn' | 'gap';

export type TwinfileAuditFindingV1 = {
  level: TwinfileAuditFindingLevel;
  code: string;
  message: string;
};

export type TwinfileAuditLensRowV1 = {
  id: string;
  label: string;
  detail?: string;
};

export type TwinfileAuditLinkedUnitV1 = {
  rel: string;
  href: string;
  resolved: boolean;
  kind?: string;
  id?: string;
  name?: string;
  anchor?: string;
};

export type TwinfileAuditCardV1 = {
  schema: 'twinfile.audit.v1';
  header: {
    id: string;
    name: string;
    kind: string;
    version: string;
    stability?: string;
  };
  lenses: {
    cast: TwinfileAuditLensRowV1[];
    stage: TwinfileAuditLensRowV1[];
    motive: TwinfileAuditLensRowV1[];
    path: TwinfileAuditLensRowV1[];
    props: TwinfileAuditLensRowV1[];
    bless: TwinfileAuditLensRowV1[];
  };
  findings: TwinfileAuditFindingV1[];
  linked: TwinfileAuditLinkedUnitV1[];
};

export type TwinfileAuditViewFormat = 'markdown' | 'json';