#!/usr/bin/env node
import { runVendorNeutralCli } from '../../../tooling/scripts/vn-scan-lib.mjs';

import { resolveExamplesCatalogRoot } from './resolve-examples-catalog-root.mjs';

runVendorNeutralCli(resolveExamplesCatalogRoot(import.meta.url));