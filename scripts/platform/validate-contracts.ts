import {
  ACCEPTANCE_EXPECTATIONS,
  APPLICABILITY_STATUSES,
  BASELINE_STATUSES,
  COVERAGE_STATUSES,
  EXECUTION_STATUSES,
  EXPECTED_BASES,
  GATE_STATUSES,
  SOURCE_RUNTIME_ALIGNMENTS,
  type ContractExecutionResult,
  type ContractTestCase,
  type LegacyCoverageInput,
  type LegacyCoverageMapping,
  type ValidationIssue,
} from './contract-types';

const TEST_CASE_ID_PATTERN = /^(TC-[A-Z0-9]+-[A-Z0-9-]+|INFRASTRUCTURE_SELF_TEST)$/;

function issue(code: string, field: string, message: string): ValidationIssue {
  return { code, field, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  input: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): void {
  if (typeof input[field] !== 'string' || input[field].trim() === '') {
    issues.push(issue('REQUIRED_STRING', field, `${field} must be a non-empty string.`));
  }
}

function requireEnum(
  input: Record<string, unknown>,
  field: string,
  values: readonly string[],
  issues: ValidationIssue[],
  invalidCode = 'INVALID_ENUM',
): void {
  if (!values.includes(String(input[field]))) {
    issues.push(issue(invalidCode, field, `${field} must be one of: ${values.join(', ')}.`));
  }
}

function requireStringArray(
  input: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(input[field]) || input[field].some((value) => typeof value !== 'string')) {
    issues.push(issue('INVALID_STRING_ARRAY', field, `${field} must be an array of strings.`));
  }
}

export function validateExecutionResult(input: unknown): ValidationIssue[] {
  if (!isRecord(input)) {
    return [issue('INVALID_OBJECT', 'result', 'Execution result must be an object.')];
  }

  const issues: ValidationIssue[] = [];
  requireString(input, 'TestCaseId', issues);
  requireString(input, 'EnvironmentId', issues);
  requireEnum(input, 'ExecutionStatus', EXECUTION_STATUSES, issues);
  requireEnum(input, 'ApplicabilityStatus', APPLICABILITY_STATUSES, issues);
  requireEnum(input, 'CoverageStatus', COVERAGE_STATUSES, issues);
  requireEnum(input, 'ExpectedBasis', EXPECTED_BASES, issues, 'INVALID_EXPECTED_BASIS');
  requireEnum(input, 'GateStatus', GATE_STATUSES, issues);
  requireStringArray(input, 'EvidenceIds', issues);
  requireStringArray(input, 'ObservationEvidenceIds', issues);

  if (typeof input.TestCaseId === 'string' && !TEST_CASE_ID_PATTERN.test(input.TestCaseId)) {
    issues.push(issue('INVALID_TEST_CASE_ID', 'TestCaseId', 'TestCaseId does not match the canonical ID pattern.'));
  }

  if (input.ApplicabilityStatus === 'NOT_APPLICABLE') {
    if (input.CoverageStatus !== 'NOT_APPLICABLE') {
      issues.push(issue('NOT_APPLICABLE_COVERAGE_MISMATCH', 'CoverageStatus', 'NOT_APPLICABLE scenarios must use NOT_APPLICABLE coverage.'));
    }
    if (typeof input.ApplicabilityReason !== 'string' || input.ApplicabilityReason.trim() === '') {
      issues.push(issue('MISSING_APPLICABILITY_REASON', 'ApplicabilityReason', 'NOT_APPLICABLE scenarios require ApplicabilityReason.'));
    }
  }

  if (input.ApplicabilityStatus === 'CONDITIONAL') {
    if (typeof input.ApplicabilityCondition !== 'string' || input.ApplicabilityCondition.trim() === '') {
      issues.push(issue('MISSING_APPLICABILITY_CONDITION', 'ApplicabilityCondition', 'CONDITIONAL scenarios require ApplicabilityCondition.'));
    }
    if (input.ExecutionStatus === 'PASS') {
      issues.push(issue('CONDITIONAL_CANNOT_PASS_WITHOUT_PROOF', 'ExecutionStatus', 'A conditional scenario cannot PASS without a satisfied condition.'));
    }
  }

  if (input.BaselineStatus !== undefined) {
    requireEnum(input, 'BaselineStatus', BASELINE_STATUSES, issues);
  }

  if (input.SourceRuntimeAlignment !== undefined) {
    requireEnum(input, 'SourceRuntimeAlignment', SOURCE_RUNTIME_ALIGNMENTS, issues);
  }

  if (input.AcceptanceExpectation !== undefined) {
    requireEnum(input, 'AcceptanceExpectation', ACCEPTANCE_EXPECTATIONS, issues);
  }

  if (input.ExpectedBasis === 'CODE_BEHAVIOR' && input.ClaimType === 'REQUIREMENTS_COMPLIANCE') {
    issues.push(issue('CODE_BEHAVIOR_COMPLIANCE_CLAIM', 'ClaimType', 'CODE_BEHAVIOR is limited to characterization or implementation regression.'));
  }

  if (input.BaselineStatus === 'BASELINE_INCOMPLETE' && input.GateStatus === 'PASS') {
    issues.push(issue('INCOMPLETE_BASELINE_GATE', 'GateStatus', 'An incomplete baseline cannot pass its gate.'));
  }

  if (input.AcceptanceExpectation === 'EXPECT_PRODUCT_FAIL' && input.ExecutionStatus !== 'FAIL') {
    issues.push(issue('EXPECTED_PRODUCT_FAIL_MUST_REMAIN_FAIL', 'ExecutionStatus', 'EXPECT_PRODUCT_FAIL requires actual ExecutionStatus=FAIL.'));
  }

  return issues;
}

export function validateTestCase(input: unknown): ValidationIssue[] {
  if (!isRecord(input)) {
    return [issue('INVALID_OBJECT', 'testCase', 'TestCase must be an object.')];
  }

  const issues: ValidationIssue[] = [];
  for (const field of [
    'TestCaseId',
    'ModuleId',
    'FeatureId',
    'Title',
    'TestType',
    'TestLayer',
    'ExpectedResult',
    'AutomationFramework',
  ]) {
    requireString(input, field, issues);
  }
  requireEnum(input, 'ApplicabilityStatus', APPLICABILITY_STATUSES, issues);
  requireEnum(input, 'ExpectedBasis', EXPECTED_BASES, issues);

  if (typeof input.TestCaseId === 'string' && !TEST_CASE_ID_PATTERN.test(input.TestCaseId)) {
    issues.push(issue('INVALID_TEST_CASE_ID', 'TestCaseId', 'TestCaseId does not match the canonical ID pattern.'));
  }
  if (!['P0', 'P1', 'P2', 'P3'].includes(String(input.Priority))) {
    issues.push(issue('INVALID_PRIORITY', 'Priority', 'Priority must be P0, P1, P2, or P3.'));
  }
  if (!['AUTO', 'AUTO_PARTIAL', 'MANUAL'].includes(String(input.AutomationType))) {
    issues.push(issue('INVALID_AUTOMATION_TYPE', 'AutomationType', 'AutomationType must be AUTO, AUTO_PARTIAL, or MANUAL.'));
  }
  return issues;
}

export function adaptLegacyCoverage(input: LegacyCoverageInput): LegacyCoverageMapping {
  const coverage = input.coverage.trim().toUpperCase();
  switch (coverage) {
    case 'PASS':
    case 'COVERED':
    case 'COVERED_PASS':
      return { ExecutionStatus: 'PASS', CoverageStatus: 'COVERED' };
    case 'COVERED_FAIL':
      return { ExecutionStatus: 'FAIL', CoverageStatus: 'COVERED' };
    case 'COVERED_ERROR':
      return { ExecutionStatus: 'ERROR', CoverageStatus: 'COVERED' };
    case 'PARTIAL':
    case 'LIMITED':
      return { GateStatus: 'LIMITED', CoverageStatus: 'PARTIAL' };
    case 'NOT_APPLICABLE':
      return {
        ApplicabilityStatus: 'NOT_APPLICABLE',
        CoverageStatus: 'NOT_APPLICABLE',
        ApplicabilityReason: 'Mapped from legacy coverage status NOT_APPLICABLE.',
      };
    case 'NOT_COVERED':
      return { ExecutionStatus: 'SKIPPED', CoverageStatus: 'UNTESTED' };
    case 'MANUAL':
    case 'MANUAL_PENDING':
      return { ExecutionStatus: 'MANUAL', CoverageStatus: 'MANUAL' };
    case 'UNTESTED':
      return { ExecutionStatus: 'SKIPPED', CoverageStatus: 'UNTESTED' };
    case 'FAIL':
      return { ExecutionStatus: 'FAIL' };
    case 'ERROR':
      return { ExecutionStatus: 'ERROR' };
    case 'BLOCKED':
      return { ExecutionStatus: 'BLOCKED' };
    default:
      throw new Error(`Unsupported legacy coverage value: ${input.coverage}`);
  }
}

export function isValidExecutionResult(input: unknown): input is ContractExecutionResult {
  return validateExecutionResult(input).length === 0;
}

export function isValidTestCase(input: unknown): input is ContractTestCase {
  return validateTestCase(input).length === 0;
}
