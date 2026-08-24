export const EXECUTION_STATUSES = [
  'PASS',
  'FAIL',
  'ERROR',
  'BLOCKED',
  'MANUAL',
  'SKIPPED',
] as const;

export const APPLICABILITY_STATUSES = [
  'APPLICABLE',
  'NOT_APPLICABLE',
  'CONDITIONAL',
  'UNKNOWN',
] as const;

export const COVERAGE_STATUSES = [
  'COVERED',
  'PARTIAL',
  'UNTESTED',
  'MANUAL',
  'NOT_APPLICABLE',
] as const;

export const BASELINE_STATUSES = [
  'BASELINE_VALIDATED',
  'BASELINE_LIMITED',
  'BASELINE_INCOMPLETE',
] as const;

export const SOURCE_RUNTIME_ALIGNMENTS = [
  'ALIGNED',
  'MISMATCH',
  'UNKNOWN',
  'NOT_APPLICABLE',
] as const;

export const EXPECTED_BASES = [
  'REQUIREMENT',
  'DESIGN',
  'APPROVED_BASELINE',
  'HANDOFF_BASELINE',
  'CODE_BEHAVIOR',
  'UNKNOWN',
] as const;

export const GATE_STATUSES = ['PASS', 'LIMITED', 'FAIL'] as const;

export const FLAKY_CLASSIFICATIONS = [
  'NOT_FLAKY',
  'FLAKY_PASS',
  'FLAKY_FAIL',
  'RETRY_NOT_APPLICABLE',
  'UNKNOWN',
] as const;

export const ACCEPTANCE_EXPECTATIONS = [
  'EXPECT_PASS',
  'EXPECT_PRODUCT_FAIL',
  'EXPECT_BLOCKED',
  'EXPECT_MANUAL',
  'EXPECT_BASELINE_LIMITED',
] as const;

export const CASE_KINDS = ['ATOMIC', 'COMPOSITE'] as const;
export const AUTOMATION_ELIGIBILITIES = ['AUTO_ALLOWED', 'MANUAL_REQUIRED', 'NOT_EXECUTABLE'] as const;
export const LIFECYCLE_STATUSES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const;
export const REVIEW_GATE_STATUSES = ['PASS', 'LIMITED', 'FAIL'] as const;
export const RISK_LEVELS = ['RISK_LOW', 'RISK_MEDIUM', 'RISK_HIGH', 'RISK_CRITICAL'] as const;
export const SIDE_EFFECTS = ['NONE', 'TEST_DATA_CREATE', 'TEST_DATA_UPDATE', 'TEST_DATA_DELETE', 'AUTH_CHANGE', 'SESSION_CHANGE', 'GLOBAL_CONFIG_CHANGE', 'EXTERNAL_EFFECT'] as const;
export const SIDE_EFFECT_SCOPES = ['TEST_OWNED', 'PROJECT_SANDBOX', 'SHARED_ENVIRONMENT', 'UNKNOWN'] as const;
export const REVERSIBILITIES = ['REVERSIBLE', 'CLEANUP_REVERSIBLE', 'IRREVERSIBLE', 'UNKNOWN'] as const;
export const DATA_OWNERSHIP_VALUES = ['TEST_OWNED', 'PROJECT_SANDBOX', 'SHARED_ENVIRONMENT', 'UNKNOWN'] as const;
export const INTERACTION_MODES = ['UNATTENDED', 'INTERACTIVE'] as const;
export const COVERAGE_TAGS = ['HAPPY_PATH', 'BUSINESS_RULE', 'VALIDATION', 'BOUNDARY', 'NEGATIVE', 'PERMISSION', 'AUTHENTICATION', 'STATE_TRANSITION', 'POST_CONDITION', 'DATA_CONSISTENCY', 'REFERENTIAL_INTEGRITY', 'IDEMPOTENCY', 'DUPLICATE', 'RECOVERY', 'SESSION', 'COMPOSITE_FLOW', 'LIFECYCLE', 'CONCURRENCY', 'CLEANUP', 'MANUAL_BOUNDARY'] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type ApplicabilityStatus = (typeof APPLICABILITY_STATUSES)[number];
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];
export type BaselineStatus = (typeof BASELINE_STATUSES)[number];
export type SourceRuntimeAlignment = (typeof SOURCE_RUNTIME_ALIGNMENTS)[number];
export type ExpectedBasis = (typeof EXPECTED_BASES)[number];
export type GateStatus = (typeof GATE_STATUSES)[number];
export type FlakyClassification = (typeof FLAKY_CLASSIFICATIONS)[number];
export type AcceptanceExpectation = (typeof ACCEPTANCE_EXPECTATIONS)[number];
export type CaseKind = (typeof CASE_KINDS)[number];
export type AutomationEligibility = (typeof AUTOMATION_ELIGIBILITIES)[number];
export type ClaimType =
  | 'CHARACTERIZATION'
  | 'IMPLEMENTATION_REGRESSION'
  | 'REQUIREMENTS_COMPLIANCE';

export interface ValidationIssue {
  code: string;
  field: string;
  message: string;
}

export interface ObservationEvidence {
  EvidenceId: string;
  ObservationType: string;
  ObservedAt: string;
  Source: string;
  Payload: Record<string, unknown>;
}

export interface ContractExecutionResult {
  TestCaseId: string;
  ExecutionStatus: ExecutionStatus;
  ApplicabilityStatus: ApplicabilityStatus;
  CoverageStatus: CoverageStatus;
  ExpectedBasis: ExpectedBasis;
  EvidenceIds: string[];
  ObservationEvidenceIds: string[];
  EnvironmentId: string;
  GateStatus: GateStatus;
  ApplicabilityReason?: string;
  ApplicabilityCondition?: string;
  BaselineStatus?: BaselineStatus;
  SourceRuntimeAlignment?: SourceRuntimeAlignment;
  AcceptanceExpectation?: AcceptanceExpectation;
  ClaimType?: ClaimType;
  attemptCount?: number;
  attempts?: RetryAttempt[];
  firstFailureEvidence?: string[];
  retryResult?: ExecutionStatus;
  FlakyClassification?: FlakyClassification;
}

export interface RetryAttempt {
  attempt: number;
  ExecutionStatus: ExecutionStatus;
  EvidenceIds: string[];
}

export interface ContractTestCase {
  TestCaseId: string;
  ModuleId: string;
  FeatureId: string;
  Title: string;
  Priority: 'P0' | 'P1' | 'P2' | 'P3';
  TestType: string;
  TestLayer: string;
  ApplicabilityStatus: ApplicabilityStatus;
  ExpectedBasis: ExpectedBasis;
  ExpectedResult?: string;
  AutomationType: 'AUTO' | 'AUTO_PARTIAL' | 'MANUAL';
  AutomationFramework: string;
  CaseKind?: CaseKind;
  Objective?: string;
  PrimaryAssertion?: string;
  AutomationEligibility?: AutomationEligibility;
  LifecycleStatus?: (typeof LIFECYCLE_STATUSES)[number];
  ReviewGateStatus?: (typeof REVIEW_GATE_STATUSES)[number];
  RiskLevel?: (typeof RISK_LEVELS)[number];
  SideEffects?: (typeof SIDE_EFFECTS)[number];
  SideEffectScope?: (typeof SIDE_EFFECT_SCOPES)[number];
  Reversibility?: (typeof REVERSIBILITIES)[number];
  DataOwnership?: (typeof DATA_OWNERSHIP_VALUES)[number];
  InteractionMode?: (typeof INTERACTION_MODES)[number];
  ExpectationGapRefs?: string[];
}

export type LegacyCoverageValue =
  | 'PASS'
  | 'COVERED'
  | 'COVERED_PASS'
  | 'COVERED_FAIL'
  | 'COVERED_ERROR'
  | 'PARTIAL'
  | 'LIMITED'
  | 'NOT_APPLICABLE'
  | 'NOT_COVERED'
  | 'MANUAL'
  | 'MANUAL_PENDING'
  | 'UNTESTED'
  | 'FAIL'
  | 'ERROR'
  | 'BLOCKED';

export interface LegacyCoverageInput {
  coverage: string;
}

export type LegacyCoverageMapping = Partial<Pick<
  ContractExecutionResult,
  | 'ExecutionStatus'
  | 'ApplicabilityStatus'
  | 'CoverageStatus'
  | 'GateStatus'
  | 'ApplicabilityReason'
>>;
