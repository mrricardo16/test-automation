import { test, expect } from '@playwright/test';

import {
  validateExecutionResult,
  validateTestCase,
  adaptLegacyCoverage,
  isValidExecutionResult,
  isValidTestCase,
} from '../../scripts/platform/validate-contracts';

test('accepts a complete PASS result with requirement-based expectation', () => {
  const result = validateExecutionResult({
    TestCaseId: 'TC-SYN-CONTRACT-001',
    ExecutionStatus: 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'REQUIREMENT',
    EvidenceIds: ['EV-SYN-001'],
    ObservationEvidenceIds: ['OBS-SYN-001'],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
  });

  expect(result).toEqual([]);
});

test('rejects runtime observation as an ExpectedBasis', () => {
  const result = validateExecutionResult({
    TestCaseId: 'TC-SYN-CONTRACT-002',
    ExecutionStatus: 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'RUNTIME_OBSERVED',
    EvidenceIds: [],
    ObservationEvidenceIds: ['OBS-SYN-002'],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
  });

  expect(result.map((issue) => issue.code)).toContain('INVALID_EXPECTED_BASIS');
});

test('requires a reason when a scenario is not applicable', () => {
  const result = validateExecutionResult({
    TestCaseId: 'TC-SYN-CONTRACT-003',
    ExecutionStatus: 'SKIPPED',
    ApplicabilityStatus: 'NOT_APPLICABLE',
    CoverageStatus: 'NOT_APPLICABLE',
    ExpectedBasis: 'DESIGN',
    EvidenceIds: [],
    ObservationEvidenceIds: [],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'LIMITED',
  });

  expect(result.map((issue) => issue.code)).toContain('MISSING_APPLICABILITY_REASON');
});

test('keeps an expected product defect as FAIL while allowing the acceptance gate to pass', () => {
  const result = validateExecutionResult({
    TestCaseId: 'TC-SYN-CONTRACT-004',
    ExecutionStatus: 'FAIL',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'REQUIREMENT',
    AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
    EvidenceIds: ['EV-SYN-004'],
    ObservationEvidenceIds: ['OBS-SYN-004'],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
  });

  expect(result).toEqual([]);
});

test('does not treat CODE_BEHAVIOR as requirements compliance', () => {
  const result = validateExecutionResult({
    TestCaseId: 'TC-SYN-CONTRACT-005',
    ExecutionStatus: 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'CODE_BEHAVIOR',
    ClaimType: 'REQUIREMENTS_COMPLIANCE',
    EvidenceIds: ['EV-SYN-005'],
    ObservationEvidenceIds: ['OBS-SYN-005'],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
  });

  expect(result.map((issue) => issue.code)).toContain('CODE_BEHAVIOR_COMPLIANCE_CLAIM');
});

test('does not allow an incomplete baseline to pass its gate', () => {
  const result = validateExecutionResult({
    TestCaseId: 'TC-SYN-CONTRACT-006',
    ExecutionStatus: 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'PARTIAL',
    ExpectedBasis: 'APPROVED_BASELINE',
    BaselineStatus: 'BASELINE_INCOMPLETE',
    EvidenceIds: ['EV-SYN-006'],
    ObservationEvidenceIds: [],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
  });

  expect(result.map((issue) => issue.code)).toContain('INCOMPLETE_BASELINE_GATE');
});

test('maps legacy coverage without converting failures to PASS', () => {
  expect(adaptLegacyCoverage({ coverage: 'PASS' })).toEqual({
    ExecutionStatus: 'PASS',
    CoverageStatus: 'COVERED',
  });
  expect(adaptLegacyCoverage({ coverage: 'PARTIAL' })).toEqual({
    GateStatus: 'LIMITED',
    CoverageStatus: 'PARTIAL',
  });
  expect(adaptLegacyCoverage({ coverage: 'NOT_APPLICABLE' })).toEqual({
    ApplicabilityStatus: 'NOT_APPLICABLE',
    CoverageStatus: 'NOT_APPLICABLE',
    ApplicabilityReason: 'Mapped from legacy coverage status NOT_APPLICABLE.',
  });
  expect(adaptLegacyCoverage({ coverage: 'FAIL' })).toEqual({
    ExecutionStatus: 'FAIL',
  });
});

test('validates the canonical TestCase shape and type guards', () => {
  const testCase = {
    TestCaseId: 'TC-SYN-CONTRACT-007',
    ModuleId: 'MOD-SYNTHETIC',
    FeatureId: 'FEATURE-CONTRACTS',
    Title: 'Validate canonical contract fields',
    Priority: 'P1',
    TestType: 'API',
    TestLayer: 'CONTRACT',
    ApplicabilityStatus: 'APPLICABLE',
    ExpectedBasis: 'DESIGN',
    ExpectedResult: 'The canonical contract is accepted.',
    AutomationType: 'AUTO',
    AutomationFramework: 'Playwright Test',
  };

  expect(validateTestCase(testCase)).toEqual([]);
  expect(isValidTestCase(testCase)).toBe(true);
  expect(isValidExecutionResult({})).toBe(false);
});
