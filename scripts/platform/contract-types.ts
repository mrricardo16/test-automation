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

export const ACCEPTANCE_EXPECTATIONS = [
  'EXPECT_PASS',
  'EXPECT_PRODUCT_FAIL',
  'EXPECT_BLOCKED',
  'EXPECT_MANUAL',
  'EXPECT_BASELINE_LIMITED',
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type ApplicabilityStatus = (typeof APPLICABILITY_STATUSES)[number];
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];
export type BaselineStatus = (typeof BASELINE_STATUSES)[number];
export type SourceRuntimeAlignment = (typeof SOURCE_RUNTIME_ALIGNMENTS)[number];
export type ExpectedBasis = (typeof EXPECTED_BASES)[number];
export type GateStatus = (typeof GATE_STATUSES)[number];
export type AcceptanceExpectation = (typeof ACCEPTANCE_EXPECTATIONS)[number];
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
  ExpectedResult: string;
  AutomationType: 'AUTO' | 'AUTO_PARTIAL' | 'MANUAL';
  AutomationFramework: string;
}

export type LegacyCoverageValue =
  | 'PASS'
  | 'COVERED'
  | 'PARTIAL'
  | 'LIMITED'
  | 'NOT_APPLICABLE'
  | 'MANUAL'
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
