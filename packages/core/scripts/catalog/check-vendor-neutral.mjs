#!/usr/bin/env node
import { runVendorNeutralCli } from '../../../tooling/scripts/vn-scan-lib.mjs';

import { resolvePlaceExamplesCatalogRoot } from '../../dist/index.js';

runVendorNeutralCli(resolvePlaceExamplesCatalogRoot());