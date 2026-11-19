import { z } from 'zod';

import { mentalModelStackJobIds } from '../../domain/skyline/stack-needs.js';
import { coercePlainStringList } from '../coerce-plain-string-list.js';
import { JourneyTouchpointRefSchema } from '../story/journey.schema.js';
import { migrateMentalModelInput } from './migrate-mental-model-input.js';

export const MentalModelSupportAssessmentSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('support'),
    level: z.enum(['weak', 'good']),
    thinkingStyleId: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal('harm'),
    level: z.enum(['mild', 'serious', 'severe', 'systemic']),
    thinkingStyleId: z.string().min(1).optional(),
  }),
]);

const supportFields = {
  id: z.string().min(1),
  how: z.string().min(1).optional(),
  assessments: z.array(MentalModelSupportAssessmentSchema).optional(),
};

export const MentalModelSupportSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('feature'), ...supportFields }),
  z.object({ kind: z.literal('content'), ...supportFields }),
]);

export const MentalModelWindowSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['inner-thinking', 'reaction', 'guiding-principle']),
  text: z.string().min(1),
  thinkingStyleIds: z.array(z.string().min(1)).optional(),
});

export const MentalModelJobGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  jobs: z.array(z.string().min(1)).min(1),
});

/** @deprecated Use {@link MentalModelJobGroupSchema}. */
export const MentalModelNeedGroupSchema = MentalModelJobGroupSchema;

export const MentalModelMatrixColumnSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z
    .object({
      id: z.string().min(1),
      label: z.string().min(1),
    })
    .optional(),
});

export const MentalModelStackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  stackGroup: z
    .object({
      id: z.string().min(1),
      label: z.string().min(1),
    })
    .optional(),
  windows: z.array(MentalModelWindowSchema).optional(),
  jobs: z.array(z.string().min(1)).optional(),
  jobGroupIds: z.preprocess(coercePlainStringList, z.array(z.string().min(1))).optional(),
  support: z.array(MentalModelSupportSchema).default([]),
  columnId: z.string().min(1).optional(),
});

export const MentalModelStackGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).optional(),
  stackIds: z.array(z.string().min(1)).min(1),
});

export const MentalModelMatrixRowSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tier: z.enum(['needs', 'surface', 'external']).optional(),
  touchpoint: JourneyTouchpointRefSchema.optional(),
});

export const MentalModelMatrixCellSchema = z.object({
  rowId: z.string().min(1),
  columnId: z.string().min(1),
  stackGroupId: z.string().min(1),
});

const MentalModelBaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  purpose: z.string().min(1).optional(),
  /** Optional when owned by a Character folder — stamped on load. */
  characterIds: z.array(z.string().min(1)).optional(),
  jobGroups: z.array(MentalModelJobGroupSchema).optional(),
  stacks: z.array(MentalModelStackSchema).min(1),
});

export const MentalModelStacksLayoutSchema = MentalModelBaseSchema.extend({
  layout: z.literal('stacks').optional(),
});

export const MentalModelMatrixLayoutSchema = MentalModelBaseSchema.extend({
  layout: z.literal('matrix'),
  columns: z.array(MentalModelMatrixColumnSchema).min(1),
  rows: z.array(MentalModelMatrixRowSchema).min(1),
  stackGroups: z.array(MentalModelStackGroupSchema).min(1),
  cells: z.array(MentalModelMatrixCellSchema).default([]),
});

function refineJobGroups(model: z.infer<typeof MentalModelBaseSchema>, ctx: z.RefinementCtx): void {
  const groupIds = new Set<string>();
  for (const group of model.jobGroups ?? []) {
    if (groupIds.has(group.id)) {
      ctx.addIssue({
        code: 'custom',
        message: `duplicate job group id ${group.id}`,
      });
    }
    groupIds.add(group.id);
    const seenInGroup = new Set<string>();
    for (const jobId of group.jobs) {
      if (seenInGroup.has(jobId)) {
        ctx.addIssue({
          code: 'custom',
          message: `job group ${group.id} lists duplicate job ${jobId}`,
        });
      }
      seenInGroup.add(jobId);
    }
  }

  for (const stack of model.stacks) {
    const flatJobs = stack.jobs ?? [];
    const groupRefs = stack.jobGroupIds ?? [];
    const hasWindows = (stack.windows?.length ?? 0) > 0;
    if (flatJobs.length === 0 && groupRefs.length === 0) {
      if (!hasWindows) {
        ctx.addIssue({
          code: 'custom',
          message: `stack ${stack.id} must cite windows[], jobs[], or jobGroupIds[]`,
        });
      }
      continue;
    }
    for (const groupId of groupRefs) {
      if (!groupIds.has(groupId)) {
        ctx.addIssue({
          code: 'custom',
          message: `stack ${stack.id} references unknown job group ${groupId}`,
        });
      }
    }
    if (mentalModelStackJobIds(model, stack).length < 1) {
      ctx.addIssue({
        code: 'custom',
        message: `stack ${stack.id} resolves to zero job ids`,
      });
    }
  }

  const seenInJobGroups = new Set<string>();
  for (const group of model.jobGroups ?? []) {
    for (const jobId of group.jobs) {
      if (seenInJobGroups.has(jobId)) {
        ctx.addIssue({
          code: 'custom',
          message: `job id ${jobId} appears more than once in this mental model`,
        });
      }
      seenInJobGroups.add(jobId);
    }
  }

  const jobPlacement = new Map<string, Set<string>>();
  for (const stack of model.stacks) {
    const placementKey = stack.stackGroup?.id ?? `stack:${stack.id}`;
    for (const jobId of mentalModelStackJobIds(model, stack)) {
      let placements = jobPlacement.get(jobId);
      if (!placements) {
        placements = new Set();
        jobPlacement.set(jobId, placements);
      }
      placements.add(placementKey);
    }
  }
  for (const [jobId, placements] of jobPlacement) {
    if (placements.size > 1) {
      ctx.addIssue({
        code: 'custom',
        message: `job id ${jobId} appears in unrelated stack columns`,
      });
    }
  }
}

function refineWindows(model: z.infer<typeof MentalModelBaseSchema>, ctx: z.RefinementCtx): void {
  const windowIds = new Set<string>();
  for (const stack of model.stacks) {
    for (const window of stack.windows ?? []) {
      if (windowIds.has(window.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate window id ${window.id} in mental model ${model.id}`,
        });
      }
      windowIds.add(window.id);
    }
  }
}

function refineMatrixLayout(
  model: z.infer<typeof MentalModelMatrixLayoutSchema>,
  ctx: z.RefinementCtx,
): void {
  const stackIds = new Set(model.stacks.map((s) => s.id));
  const groupIds = new Set(model.stackGroups.map((g) => g.id));
  const rowIds = new Set(model.rows.map((r) => r.id));
  const columnIds = new Set(model.columns.map((c) => c.id));

  for (const stack of model.stacks) {
    if (stack.columnId && !columnIds.has(stack.columnId)) {
      ctx.addIssue({
        code: 'custom',
        message: `stack ${stack.id} references unknown columnId ${stack.columnId}`,
      });
    }
  }

  for (const group of model.stackGroups) {
    for (const sid of group.stackIds) {
      if (!stackIds.has(sid)) {
        ctx.addIssue({
          code: 'custom',
          message: `stack group ${group.id} references unknown stack ${sid}`,
        });
      }
    }
  }

  const stackToGroup = new Map<string, string>();
  for (const group of model.stackGroups) {
    for (const sid of group.stackIds) {
      const prev = stackToGroup.get(sid);
      if (prev) {
        ctx.addIssue({
          code: 'custom',
          message: `stack ${sid} appears in groups ${prev} and ${group.id}`,
        });
      }
      stackToGroup.set(sid, group.id);
    }
  }

  const cellKeys = new Set<string>();
  for (const cell of model.cells) {
    if (!rowIds.has(cell.rowId)) {
      ctx.addIssue({
        code: 'custom',
        message: `cell references unknown row ${cell.rowId}`,
      });
    }
    if (!columnIds.has(cell.columnId)) {
      ctx.addIssue({
        code: 'custom',
        message: `cell references unknown column ${cell.columnId}`,
      });
    }
    if (!groupIds.has(cell.stackGroupId)) {
      ctx.addIssue({
        code: 'custom',
        message: `cell references unknown stack group ${cell.stackGroupId}`,
      });
    }
    const key = `${cell.rowId}:${cell.columnId}`;
    if (cellKeys.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: `duplicate matrix cell ${key}`,
      });
    }
    cellKeys.add(key);
  }

  if (!model.rows.some((r) => r.tier === 'needs')) {
    ctx.addIssue({
      code: 'custom',
      message: 'matrix layout requires a row with tier "needs"',
    });
  }
}

export const MentalModelSchema = z.preprocess(
  migrateMentalModelInput,
  z
    .union([MentalModelStacksLayoutSchema, MentalModelMatrixLayoutSchema])
    .superRefine((model, ctx) => {
      refineJobGroups(model, ctx);
      refineWindows(model, ctx);
      if (model.layout === 'matrix') {
        refineMatrixLayout(model, ctx);
      }
    }),
);

export function parseMentalModel(input: unknown) {
  return MentalModelSchema.parse(input);
}
