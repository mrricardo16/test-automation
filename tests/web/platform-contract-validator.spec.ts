import { test, expect } from '@playwright/test';

import {
  validateExecutionResult,
  validateExpectationGap,
  validateScenarioSuite,
  validateTestCase,
  validateTestCases,
  adaptLegacyCoverage,
  isValidExecutionResult,
  isValidTestCase,
} from '../../scripts/platform/validate-contracts';

const v2Base = {
  TestCaseId: 'TC-SYN-V2-001',
  CaseKind: 'COMPOSITE',
  ModuleId: 'MOD-SYNTHETIC',
  FeatureId: 'FEATURE-LIFECYCLE',
  Title: 'Synthetic lifecycle transition',
  Priority: 'P1',
  TestType: 'STATE_TRANSITION',
  TestLayer: 'CONTRACT',
  ApplicabilityStatus: 'APPLICABLE',
  ExpectedBasis: 'DESIGN',
  ExpectedResult: 'The documented lifecycle transition is preserved.',
  Objective: 'Validate one synthetic lifecycle objective.',
  PrimaryAssertion: 'The final synthetic state matches the documented state.',
  AutomationType: 'AUTO',
  AutomationEligibility: 'AUTO_ALLOWED',
  CoverageTags: ['COMPOSITE_FLOW', 'STATE_TRANSITION', 'CLEANUP'],
  AutomationFramework: 'Playwright Test',
  LifecycleStatus: 'ACTIVE',
  ReviewGateStatus: 'PASS',
  RiskLevel: 'RISK_LOW',
  SideEffects: 'TEST_DATA_CREATE',
  SideEffectScope: 'TEST_OWNED',
  Reversibility: 'CLEANUP_REVERSIBLE',
  DataOwnership: 'TEST_OWNED',
  InteractionMode: 'UNATTENDED',
  InitialState: 'Synthetic fixture exists in the declared start state.',
  ScenarioSuiteId: 'SS-SYN-V2-001',
  Preconditions: ['The synthetic fixture is isolated and owned by the test.'],
  TestData: { name: 'synthetic-owned' },
  Steps: ['Apply the synthetic transition.', 'Observe the synthetic final state.'],
  ExpectedPerStep: [
    { Step: 1, Action: 'Apply the synthetic transition.', Expected: 'The transition is accepted.', StateAfter: 'INTERMEDIATE' },
    { Step: 2, Action: 'Observe the synthetic final state.', Expected: 'The documented final state is observed.', StateAfter: 'FINAL' },
  ],
  StateTransitions: [
    { From: 'START', Action: 'TRANSITION', To: 'END' },
  ],
  PostConditions: ['Synthetic final state is END.'],
  IntermediateAssertions: ['The intermediate state is observable before the final assertion.'],
  CrossStepInvariants: ['No state outside the synthetic fixture changes.'],
  Cleanup: 'Delete the synthetic fixture.',
  CleanupVerification: 'Verify the synthetic fixture is absent.',
};

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

test('TC-PLATFORM-09-TESTCASE-V2-001 accepts required synthetic lifecycle composites', () => {
  const syntheticResource = {
    id: 'synthetic-1',
    name: 'synthetic-name',
    status: 'ENABLED',
    parentId: null,
  };
  const roles = {
    Viewer: ['READ'],
    Editor: ['READ', 'CREATE', 'UPDATE'],
    Admin: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE'],
  };
  expect(syntheticResource).toMatchObject({ id: expect.any(String), name: expect.any(String), status: 'ENABLED', parentId: null });
  expect(roles.Viewer).not.toContain('DELETE');

  const transitions = [
    ['CREATE', 'READ'],
    ['DELETE', 'READ'],
    ['DELETE', 'RECREATE'],
    ['DELETE', 'UPDATE'],
    ['DELETE', 'DELETE'],
    ['DISABLE', 'UPDATE'],
    ['CREATE_CHILD', 'READ_PARENT_CHILD'],
  ];

  for (const [action, followUp] of transitions) {
    const fixture = {
      ...v2Base,
      TestCaseId: `TC-SYN-V2-${action}-${followUp}`.replaceAll('_', '-'),
      StateTransitions: [
        { From: 'INITIAL', Action: action, To: 'INTERMEDIATE' },
        { From: 'INTERMEDIATE', Action: followUp, To: 'FINAL' },
      ],
    };
    expect(validateTestCase(fixture), `${action}→${followUp}`).toEqual([]);
  }
});

test('TC-PLATFORM-09-TESTCASE-V2-001 rejects incomplete or unsafe unattended AUTO fixtures', () => {
  const issueCodes = (overrides: Record<string, unknown>) =>
    validateTestCase({ ...v2Base, ...overrides }).map((item) => item.code);

  expect(issueCodes({ PrimaryAssertion: undefined })).toContain('MISSING_V2_FIELD');
  expect(issueCodes({ ExpectedPerStep: undefined })).toContain('MISSING_COMPOSITE_FIELD');
  expect(issueCodes({ RiskLevel: 'UNKNOWN' })).toContain('UNKNOWN_RISK_AUTO');
  expect(issueCodes({ RiskLevel: 'RISK_HIGH' })).toContain('HIGH_RISK_AUTO');
  expect(issueCodes({ Reversibility: 'IRREVERSIBLE' })).toContain('IRREVERSIBLE_AUTO_OPERATION');
  expect(issueCodes({ Reversibility: 'UNKNOWN' })).toContain('UNKNOWN_REVERSIBILITY_AUTO');
  expect(issueCodes({ InteractionMode: 'INTERACTIVE' })).toContain('INTERACTIVE_AUTO');
  expect(issueCodes({ Steps: ['等待人工确认后继续'] })).toContain('INTERACTIVE_AUTOMATION_VIOLATION');
  expect(issueCodes({ AutomationType: 'AUTO_PARTIAL' })).toContain('AUTO_PARTIAL_V2_FORBIDDEN');
  expect(issueCodes({ IndependentObjectives: ['Create object', 'Delete unrelated object'] })).toContain('MEGA_CASE_WARNING');
  expect(issueCodes({ Cleanup: undefined })).toContain('MISSING_CLEANUP');
  expect(issueCodes({ CleanupVerification: undefined })).toContain('MISSING_CLEANUP_VERIFICATION');
});

test('TC-PLATFORM-09-TESTCASE-V2-001 protects missing expectations with ExpectationGap', () => {
  const invalid = validateTestCase({
    ...v2Base,
    ExpectedBasis: 'UNKNOWN',
    ExpectedResult: undefined,
  }).map((item) => item.code);
  expect(invalid).toContain('EXPECTATION_GAP_REQUIRED');

  const protectedGap = validateTestCase({
    ...v2Base,
    ExpectedBasis: 'UNKNOWN',
    ExpectedResult: undefined,
    ExpectationGapRefs: ['EG-SYN-V2-001'],
    AutomationEligibility: 'NOT_EXECUTABLE',
    ReviewGateStatus: 'FAIL',
    AutomationType: 'MANUAL',
    AutomationFramework: 'None',
  });
  expect(protectedGap).toEqual([]);
});

test('TC-PLATFORM-09-TESTCASE-V2-001 rejects duplicate IDs and invalid V2 aggregates', () => {
  expect(validateTestCases([v2Base, { ...v2Base }]).map((item) => item.code)).toContain('DUPLICATE_TEST_CASE_ID');

  expect(validateScenarioSuite({
    ScenarioSuiteId: 'SS-SYN-V2-001',
    ModuleId: 'MOD-SYNTHETIC',
    FeatureId: 'FEATURE-LIFECYCLE',
    Title: 'Synthetic lifecycle suite',
    Objective: 'Aggregate lifecycle coverage without execution status.',
    BusinessFlow: 'Create, update, disable and delete a synthetic resource.',
    IncludedTestCases: ['TC-SYN-V2-001'],
    LifecyclePath: ['CREATE', 'UPDATE', 'DISABLE', 'DELETE'],
    CoverageTags: ['LIFECYCLE', 'COMPOSITE_FLOW'],
    Risks: ['Deletion is isolated to synthetic test-owned data.'],
    CleanupStrategy: 'Delete all synthetic resources and verify absence.',
    LifecycleStatus: 'ACTIVE',
    ExpectationGapIds: [],
  })).toEqual([]);

  expect(validateExpectationGap({
    ExpectationGapId: 'EG-SYN-V2-001',
    GapType: 'MISSING_EXPECTED',
    ModuleId: 'MOD-SYNTHETIC',
    FeatureId: 'FEATURE-LIFECYCLE',
    CandidateScenario: 'DELETE_THEN_RECREATE_SAME_KEY',
    MissingExpectation: 'Whether a deleted unique key may be reused.',
    Risk: 'RISK_MEDIUM',
    RequiredClarification: 'Specify whether the deleted key is reusable.',
    RelatedCoverageTags: ['LIFECYCLE', 'DATA_CONSISTENCY'],
    ResolutionStatus: 'OPEN',
    AutomationEligibility: 'NOT_EXECUTABLE',
  })).toEqual([]);

  expect(validateExpectationGap({
    ExpectationGapId: 'EG-SYN-V2-002',
    GapType: 'MISSING_EXPECTED',
    ModuleId: 'MOD-SYNTHETIC',
    FeatureId: 'FEATURE-LIFECYCLE',
    CandidateScenario: 'DELETE_THEN_RECREATE_SAME_KEY',
    MissingExpectation: 'The approved expected result.',
    Risk: 'RISK_MEDIUM',
    RequiredClarification: 'Clarify key reuse.',
    RelatedCoverageTags: ['LIFECYCLE'],
    ResolutionStatus: 'OPEN',
    AutomationEligibility: 'AUTO_ALLOWED',
  }).map((item) => item.code)).toContain('INVALID_ENUM');
});
