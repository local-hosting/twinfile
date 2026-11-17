import { z } from 'zod';

import { AXM_FIXTURE_KINDS, AXM_KINDS } from '../../types/identity/kind.js';

export const AXMKindSchema = z.enum(AXM_KINDS);

export const AXMFixtureKindSchema = z.enum(AXM_FIXTURE_KINDS);
