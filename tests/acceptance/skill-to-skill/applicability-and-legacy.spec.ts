import { test, expect } from '@playwright/test';

import { adaptLegacyCoverage } from '../../../scripts/platform/validate-contracts';
let helpers;

test.beforeAll(async () => {
  helpers = await import('./helpers/contract-acceptance.mjs');
});

test('TC-SYN-ACCEPTANCE-002 covers all ApplicabilityStatus values', () => {
  expect(helpers.evaluateApplicability({ ApplicabilityStatus: 'APPLICABLE' }).valid).toBe(true);
  expect(helpers.evaluateApplicability({ ApplicabilityStatus: 'NOT_APPLICABLE', CoverageStatus: 'NOT_APPLICABLE', ApplicabilityReason: 'Manual-only OS surface.' }).valid).toBe(true);
  expect(helpers.evaluateApplicability({ ApplicabilityStatus: 'CONDITIONAL', ApplicabilityCondition: 'Windows desktop session exists.', ExecutionStatus: 'BLOCKED' }).valid).toBe(true);
  expect(helpers.evaluateApplicability({ ApplicabilityStatus: 'UNKNOWN' }).valid).toBe(true);
  expect(helpers.evaluateApplicability({ ApplicabilityStatus: 'NOT_APPLICABLE', CoverageStatus: 'NOT_APPLICABLE' }).valid).toBe(false);
});

test('TC-SYN-ACCEPTANCE-002 covers baseline and source/runtime alignment values', () => {
  for (const baseline of ['BASELINE_VALIDATED', 'BASELINE_LIMITED', 'BASELINE_INCOMPLETE']) {
    for (const alignment of ['ALIGNED', 'MISMATCH', 'UNKNOWN', 'NOT_APPLICABLE']) {
      expect(helpers.evaluateBaselineAndAlignment(baseline, alignment).represented).toBe(true);
    }
  }
});

test('TC-SYN-CONTRACT-003 maps legacy coverage without rewriting historical files', () => {
  expect(adaptLegacyCoverage({ coverage: 'COVERED_PASS' })).toEqual({ ExecutionStatus: 'PASS', CoverageStatus: 'COVERED' });
  expect(adaptLegacyCoverage({ coverage: 'COVERED_FAIL' })).toEqual({ ExecutionStatus: 'FAIL', CoverageStatus: 'COVERED' });
  expect(adaptLegacyCoverage({ coverage: 'COVERED_ERROR' })).toEqual({ ExecutionStatus: 'ERROR', CoverageStatus: 'COVERED' });
  expect(adaptLegacyCoverage({ coverage: 'NOT_COVERED' })).toEqual({ ExecutionStatus: 'SKIPPED', CoverageStatus: 'UNTESTED' });
  expect(adaptLegacyCoverage({ coverage: 'MANUAL_PENDING' })).toEqual({ ExecutionStatus: 'MANUAL', CoverageStatus: 'MANUAL' });
});
