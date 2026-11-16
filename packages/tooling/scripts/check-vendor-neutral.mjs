#!/usr/bin/env node
/**
 * Vendor-neutral scan for a package tree. Run from package cwd or set TF_PACKAGE_ROOT.
 */
import { resolve } from 'node:path';

import { runVendorNeutralCli } from './vn-scan-lib.mjs';

const root = resolve(process.env.TF_PACKAGE_ROOT?.trim() || process.cwd());
runVendorNeutralCli(root);