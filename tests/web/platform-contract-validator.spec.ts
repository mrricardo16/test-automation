import { test, expect } from '@playwright/test';
import { classifyHarnessAuthority } from '../../scripts/platform/harness-authority.mjs';

import {
  validateExecutionResult,
  validateExpectationGap,
  validateScenarioSuite,
  validateTestCase,
  validateTestCases,
  adaptLegacyCoverage,
  isValidExecutionResult,
  isValidTestCase,
  validateModularTestCaseCatalog,
  validateTestCaseDesignQuality,
  validateDesignQualityCatalog,
  validateDesignQualityReportPresentation,
} from '../../scripts/platform/validate-contracts';

const v2Base = {
  TestCaseId: 'TC-SYN-V2-001',
  CaseKind: 'COMPOSITE',
  ModuleId: 'MOD-SYNTHETIC',
  FeatureId: 'FEATURE-LIFECYCLE',
  ModuleName: 'Synthetic',
  FeatureName: 'Lifecycle',
  Operation: 'COMPOSITE_LIFECYCLE',
  ScenarioGroup: 'COMPOSITE_FLOW',
  PresentationOrder: { ModuleOrder: 1, FeatureOrder: 1, OperationOrder: 1, ScenarioOrder: 1, CaseOrder: 1 },
  BusinessRules: ['Synthetic lifecycle transition is persisted.'],
  TestDataDesign: { DataFields: ['name'], DataCategory: 'TEST_OWNED_DATA', KeyValues: ['synthetic-owned'], Source: 'SYNTHETIC', Ownership: 'TEST_OWNED', Unique: true, Disposable: true, Sensitive: false },
  SafetyConstraints: ['Only synthetic test-owned data may be changed.'],
  DesignTechniques: ['STATE_MODEL', 'CRUD_LIFECYCLE_MATRIX'],
  DesignMaturity: 'EXECUTABLE',
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

test('TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-001 requires modular classification fields', () => {
  const { ModuleName, FeatureName, Operation, ScenarioGroup, PresentationOrder, ...legacyV2 } = v2Base;
  const issues = validateTestCase(legacyV2).map((item) => item.code);
  expect(issues).toEqual(expect.arrayContaining([
    'MODULE_CLASSIFICATION_REQUIRED',
    'FEATURE_CLASSIFICATION_REQUIRED',
    'OPERATION_CLASSIFICATION_REQUIRED',
    'SCENARIO_GROUP_CLASSIFICATION_REQUIRED',
    'PRESENTATION_ORDER_REQUIRED',
  ]));
});

test('TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-001 keeps status-different query cases adjacent', () => {
  const queryCase = (id: string, status: string, scenario: string, order: number) => ({
    ...v2Base,
    TestCaseId: id,
    ModuleName: '统计分析',
    FeatureName: '统计查询',
    Operation: 'QUERY',
    ScenarioGroup: scenario,
    PresentationOrder: { ModuleOrder: 80, FeatureOrder: 10, OperationOrder: 10, ScenarioOrder: order, CaseOrder: 1 },
    ExecutionStatus: status,
  });
  const catalog = {
    PrimaryGrouping: 'MODULE',
    SecondaryGrouping: 'FEATURE',
    StatusUsedForGrouping: false,
    Cases: [
      queryCase('TC-SYN-STAT-001', 'BLOCKED', 'HAPPY_PATH', 1),
      queryCase('TC-SYN-STAT-002', 'BLOCKED', 'EMPTY_STATE', 2),
      queryCase('TC-SYN-STAT-003', 'ERROR', 'VALIDATION', 3),
    ],
  };
  expect(validateModularTestCaseCatalog(catalog)).toEqual([]);
});

test('TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-001 rejects status-based primary grouping and broken continuity', () => {
  const catalog = {
    PrimaryGrouping: 'ExecutionStatus',
    SecondaryGrouping: 'FEATURE',
    StatusUsedForGrouping: true,
    Cases: [
      { ...v2Base, TestCaseId: 'TC-SYN-QUERY-001', ModuleName: '统计分析', FeatureName: '统计查询', Operation: 'QUERY', ScenarioGroup: 'HAPPY_PATH', PresentationOrder: { ModuleOrder: 80, FeatureOrder: 10, OperationOrder: 10, ScenarioOrder: 1, CaseOrder: 1 } },
      { ...v2Base, TestCaseId: 'TC-SYN-OTHER-001', ModuleName: '系统管理', FeatureName: '用户管理', Operation: 'CREATE', ScenarioGroup: 'HAPPY_PATH', PresentationOrder: { ModuleOrder: 20, FeatureOrder: 20, OperationOrder: 20, ScenarioOrder: 1, CaseOrder: 1 } },
      { ...v2Base, TestCaseId: 'TC-SYN-QUERY-002', ModuleName: '统计分析', FeatureName: '统计查询', Operation: 'QUERY', ScenarioGroup: 'EMPTY_STATE', PresentationOrder: { ModuleOrder: 80, FeatureOrder: 10, OperationOrder: 10, ScenarioOrder: 2, CaseOrder: 1 } },
    ],
  };
  const codes = validateModularTestCaseCatalog(catalog).map((item) => item.code);
  expect(codes).toEqual(expect.arrayContaining(['STATUS_BASED_PRIMARY_GROUPING_FORBIDDEN', 'NON_CONTIGUOUS_MODULE_FEATURE_OPERATION']));
});

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 rejects an atomic case containing multiple primary business rules', () => {
  const issues = validateTestCaseDesignQuality({
    ...v2Base,
    CaseKind: 'ATOMIC',
    Operation: 'VALIDATION',
    BusinessRules: ['重复用户名必须拒绝', '密码低于最小长度必须拒绝'],
    TestDataDesign: { DataFields: ['用户名', '密码'], DataCategory: 'INVALID_DATA', KeyValues: ['duplicate', 'short'], Source: 'HANDOFF_BASELINE', Ownership: 'TEST_OWNED', Unique: true, Disposable: true, Sensitive: true },
    SafetyConstraints: ['仅使用 TEST_OWNED 数据。'],
    DesignTechniques: ['EQUIVALENCE_PARTITIONING', 'BOUNDARY_VALUE'],
    DesignMaturity: 'REVIEWABLE',
  }).map((item) => item.code);
  expect(issues).toContain('MULTIPLE_PRIMARY_BUSINESS_RULES');
  expect(issues).toContain('OVERBROAD_VALIDATION_CASE');
});

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 accepts representative password boundary design', () => {
  const issues = validateTestCaseDesignQuality({
    ...v2Base,
    CaseKind: 'ATOMIC',
    BusinessRules: ['密码长度低于批准最小值必须拒绝'],
    TestDataDesign: { DataFields: ['密码'], DataCategory: 'BOUNDARY_DATA', KeyValues: ['min-1', 'min', 'min+1', 'max-1', 'max', 'max+1'], Source: 'REQUIREMENT', Ownership: 'TEST_OWNED', Unique: false, Disposable: true, Sensitive: true },
    SafetyConstraints: ['不得输出真实密码。'],
    DesignTechniques: ['BOUNDARY_VALUE'],
    BoundaryValues: { Applicable: true, Values: ['min-1', 'min', 'min+1', 'max-1', 'max', 'max+1'], ExpectedKnown: true },
    DesignMaturity: 'EXECUTABLE',
  });
  expect(issues).not.toEqual(expect.arrayContaining([{ code: 'INVALID_BOUNDARY_DESIGN' }]));
});

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 rejects design catalog SKIPPED and stale effective state', () => {
  const issues = validateDesignQualityCatalog({
    Mode: 'DESIGN',
    Cases: [{
      ...v2Base,
      TestCaseId: 'TC-SYN-QUALITY-001',
      BusinessRules: ['登录成功'],
      TestDataDesign: { DataFields: ['账号'], DataCategory: 'VALID_DATA', KeyValues: ['fixture'], Source: 'HANDOFF_BASELINE', Ownership: 'TEST_OWNED', Unique: true, Disposable: true, Sensitive: false },
      SafetyConstraints: ['隔离账号。'],
      DesignTechniques: ['EQUIVALENCE_PARTITIONING'],
      DesignMaturity: 'REVIEWABLE',
      ExecutionStatus: 'SKIPPED',
      AutomationEligibility: 'MANUAL_REQUIRED',
      EffectiveAutomationEligibility: 'AUTO_ALLOWED',
    }],
  }).map((item) => item.code);
  expect(issues).toEqual(expect.arrayContaining(['CATALOG_GENERATED_SKIPPED_INVALID', 'STALE_EFFECTIVE_STATE_PRESENTATION']));
});

test('TC-PLATFORM-11-TESTCASE-DESIGN-QUALITY-001 rejects machine enums in user-facing report rows', () => {
  const issues = validateDesignQualityReportPresentation({
    Rows: [{ Operation: 'QUERY', ScenarioGroup: 'COMPOSITE_FLOW', AutomationEligibility: 'AUTO_ALLOWED', CaseKind: 'ATOMIC' }],
  }).map((item) => item.code);
  expect(issues).toContain('UNTRANSLATED_MACHINE_ENUM_IN_USER_REPORT');
});

test('TC-PLATFORM-14-BLACKBOX-STANDARD-REBUILD-001 accepts a protected pending-authority Expected gap description', () => {
  const issues = validateTestCase({
    ...v2Base,
    ExpectedBasis: 'UNKNOWN',
    ExpectedResult: '待权威确认：删除后唯一键是否允许复用。',
    ExpectedStatus: 'EXPECTED_PENDING_AUTHORITY',
    ExpectedSourceRef: ['EG-SYN-PENDING-001'],
    ExpectedAuthority: 'PENDING_AUTHORITY',
    ExpectationGapId: 'EG-SYN-PENDING-001',
    ExpectationGapRefs: ['EG-SYN-PENDING-001'],
    GapClassification: 'TRUE_GAP',
    ExpectedResultSemantics: 'AUTHORITY_GAP_DESCRIPTION_NOT_BUSINESS_ORACLE',
    AutomationType: 'MANUAL',
    AutomationEligibility: 'NOT_EXECUTABLE',
    ReviewGateStatus: 'LIMITED',
  }).map((item) => item.code);

  expect(issues).not.toContain('EXPECTED_GUESS_FORBIDDEN');
  expect(issues).not.toContain('MISSING_REQUIRED_FIELD');
});

test('TC-SYN-HARNESS-A-001 allows formal Web execution through Project Playwright', () => {
  const result = classifyHarnessAuthority({
    phase: 'FORMAL_EXECUTION',
    operation: 'FORMAL_WEB_TEST',
    harnessType: 'PROJECT_PLAYWRIGHT',
    formalExecutionEligible: 'YES',
    harnessAvailable: true,
    runtimeUrlConfigured: true,
    credentialsConfigured: true,
  });

  expect(result).toMatchObject({ decision: 'ALLOWED', executionStatus: 'PASS', formalExecutionEligible: 'YES', issues: [] });
});

test('TC-SYN-HARNESS-B-001 rejects Agent Browser as a formal Web harness', () => {
  const result = classifyHarnessAuthority({
    phase: 'FORMAL_EXECUTION',
    operation: 'FORMAL_WEB_TEST',
    harnessType: 'AGENT_BROWSER_PLUGIN',
    formalExecutionEligible: 'NO',
    harnessAvailable: true,
    runtimeUrlConfigured: true,
    credentialsConfigured: true,
  });

  expect(result.decision).toBe('REJECTED');
  expect(result.formalExecutionEligible).toBe('NO');
  expect(result.issues.map((item) => item.code)).toContain('HARNESS_AUTHORITY_VIOLATION');
});

test('TC-SYN-HARNESS-C-001 allows Agent Browser diagnostic observation only', () => {
  const result = classifyHarnessAuthority({
    phase: 'DIAGNOSTIC',
    operation: 'DIAGNOSTIC_OBSERVATION',
    harnessType: 'AGENT_BROWSER_PLUGIN',
    formalExecutionEligible: 'NO',
    harnessAvailable: true,
    stateMutation: false,
    formalEvidence: false,
  });

  expect(result).toMatchObject({ decision: 'DIAGNOSTIC_ONLY', executionStatus: 'MANUAL', formalExecutionEligible: 'NO', issues: [] });
});

test('TC-SYN-HARNESS-D-001 rejects Agent Browser state mutation during Project Preparation', () => {
  const result = classifyHarnessAuthority({
    phase: 'PROJECT_PREPARATION',
    operation: 'CREATE_TEST_USER',
    harnessType: 'AGENT_BROWSER_PLUGIN',
    formalExecutionEligible: 'NO',
    harnessAvailable: true,
    stateMutation: true,
    formalEvidence: false,
  });

  expect(result.decision).toBe('REJECTED');
  expect(result.issues.map((item) => item.code)).toContain('HARNESS_AUTHORITY_VIOLATION');
});

test('TC-SYN-HARNESS-E-001 allows Project Preparation mutation through Project Playwright', () => {
  const result = classifyHarnessAuthority({
    phase: 'PROJECT_PREPARATION',
    operation: 'CREATE_TEST_USER',
    harnessType: 'PROJECT_PLAYWRIGHT',
    formalExecutionEligible: 'YES',
    harnessAvailable: true,
    runtimeUrlConfigured: true,
    credentialsConfigured: true,
    stateMutation: true,
    formalEvidence: false,
  });

  expect(result).toMatchObject({ decision: 'ALLOWED', executionStatus: 'PASS', formalExecutionEligible: 'YES', issues: [] });
});

test('TC-SYN-HARNESS-F-001 blocks unavailable Playwright without Agent Browser fallback', () => {
  const result = classifyHarnessAuthority({
    phase: 'FORMAL_EXECUTION',
    operation: 'FORMAL_WEB_TEST',
    harnessType: 'PROJECT_PLAYWRIGHT',
    formalExecutionEligible: 'YES',
    harnessAvailable: false,
    runtimeUrlConfigured: true,
    credentialsConfigured: true,
    fallbackHarnessType: 'AGENT_BROWSER_PLUGIN',
  });

  expect(result.decision).toBe('BLOCKED');
  expect(result.executionStatus).toBe('BLOCKED');
  expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining(['PLAYWRIGHT_UNAVAILABLE', 'HARNESS_FALLBACK_FORBIDDEN']));
});
