#!/usr/bin/env node
/**
 * Vendor-neutral scan for a package tree. Run from the package directory.
 */
import { resolve } from 'node:path';

import { runVendorNeutralCli } from './vn-scan-lib.mjs';

const root = resolve(process.cwd());
runVendorNeutralCli(root);