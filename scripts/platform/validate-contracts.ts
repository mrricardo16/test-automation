import {
  ACCEPTANCE_EXPECTATIONS,
  APPLICABILITY_STATUSES,
  AUTOMATION_ELIGIBILITIES,
  BASELINE_STATUSES,
  CASE_KINDS,
  COVERAGE_STATUSES,
  DATA_OWNERSHIP_VALUES,
  EXECUTION_STATUSES,
  EXPECTED_BASES,
  FLAKY_CLASSIFICATIONS,
  GATE_STATUSES,
  INTERACTION_MODES,
  LIFECYCLE_STATUSES,
  REVIEW_GATE_STATUSES,
  RISK_LEVELS,
  SIDE_EFFECTS,
  SIDE_EFFECT_SCOPES,
  REVERSIBILITIES,
  COVERAGE_TAGS,
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

function requireRecordArray(
  input: Record<string, unknown>,
  field: string,
  requiredFields: string[],
  issues: ValidationIssue[],
  code: string,
): void {
  const value = input[field];
  if (!Array.isArray(value) || value.length === 0 || value.some((item) =>
    !isRecord(item) || requiredFields.some((required) => item[required] === undefined || item[required] === ''))) {
    issues.push(issue(code, field, `${field} must be a non-empty array with ${requiredFields.join(', ')}.`));
  }
}

function requireNonEmptyStringArray(
  input: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): void {
  const value = input[field];
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    issues.push(issue('INVALID_STRING_ARRAY', field, `${field} must be a non-empty array of strings.`));
  }
}

function containsInteractiveInstruction(input: Record<string, unknown>): boolean {
  const text = ['Steps', 'Preconditions', 'EvidenceRequirement', 'Notes']
    .flatMap((field) => Array.isArray(input[field]) ? input[field] : [input[field]])
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  return /(等待人工|请用户确认|手动点击|手动输入|人工完成后继续|pause for approval|wait for human|confirm with user|manual approval)/i.test(text);
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

  if (input.FlakyClassification !== undefined) {
    requireEnum(input, 'FlakyClassification', FLAKY_CLASSIFICATIONS, issues);
  }
  if (input.attemptCount !== undefined && (!Number.isInteger(input.attemptCount) || Number(input.attemptCount) < 1)) {
    issues.push(issue('INVALID_ATTEMPT_COUNT', 'attemptCount', 'attemptCount must be a positive integer.'));
  }
  if (input.attempts !== undefined) {
    if (!Array.isArray(input.attempts)) {
      issues.push(issue('INVALID_ATTEMPTS', 'attempts', 'attempts must be an array.'));
    } else {
      for (const attempt of input.attempts) {
        if (!isRecord(attempt) || !Number.isInteger(attempt.attempt) || !EXECUTION_STATUSES.includes(String(attempt.ExecutionStatus) as typeof EXECUTION_STATUSES[number]) || !Array.isArray(attempt.EvidenceIds) || attempt.EvidenceIds.some((value) => typeof value !== 'string')) {
          issues.push(issue('INVALID_ATTEMPT', 'attempts', 'Each attempt must contain attempt, ExecutionStatus, and EvidenceIds.'));
          break;
        }
      }
    }
  }
  if (typeof input.attemptCount === 'number' && Array.isArray(input.attempts) && input.attemptCount !== input.attempts.length) {
    issues.push(issue('ATTEMPT_COUNT_MISMATCH', 'attemptCount', 'attemptCount must match attempts.length.'));
  }
  if (input.firstFailureEvidence !== undefined) requireStringArray(input, 'firstFailureEvidence', issues);
  if (input.retryResult !== undefined) requireEnum(input, 'retryResult', EXECUTION_STATUSES, issues);

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
  const isV2 = input.CaseKind !== undefined;
  const isExpectationGap = isV2 && input.ExpectedBasis === 'UNKNOWN';
  for (const field of [
    'TestCaseId',
    'ModuleId',
    'FeatureId',
    'Title',
    'TestType',
    'TestLayer',
    'AutomationFramework',
  ]) {
    requireString(input, field, issues);
  }
  if (!isExpectationGap) requireString(input, 'ExpectedResult', issues);
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

  if (isV2) {
    requireEnum(input, 'CaseKind', CASE_KINDS, issues);
    for (const field of ['Objective', 'PrimaryAssertion']) {
      if (typeof input[field] !== 'string' || input[field].trim() === '') {
        issues.push(issue('MISSING_V2_FIELD', field, `${field} is required for V2 TestCases.`));
      }
    }
    requireEnum(input, 'AutomationEligibility', AUTOMATION_ELIGIBILITIES, issues);
    requireEnum(input, 'LifecycleStatus', LIFECYCLE_STATUSES, issues);
    requireEnum(input, 'ReviewGateStatus', REVIEW_GATE_STATUSES, issues);
    requireEnum(input, 'RiskLevel', RISK_LEVELS, issues);
    requireEnum(input, 'SideEffects', SIDE_EFFECTS, issues);
    requireEnum(input, 'SideEffectScope', SIDE_EFFECT_SCOPES, issues);
    requireEnum(input, 'Reversibility', REVERSIBILITIES, issues);
    requireEnum(input, 'DataOwnership', DATA_OWNERSHIP_VALUES, issues);
    requireEnum(input, 'InteractionMode', INTERACTION_MODES, issues);
    requireNonEmptyStringArray(input, 'CoverageTags', issues);
    if (Array.isArray(input.CoverageTags) && input.CoverageTags.some((tag) => !COVERAGE_TAGS.includes(String(tag) as typeof COVERAGE_TAGS[number]))) {
      issues.push(issue('INVALID_COVERAGE_TAG', 'CoverageTags', `CoverageTags must use controlled values: ${COVERAGE_TAGS.join(', ')}.`));
    }

    if (input.CaseKind === 'COMPOSITE') {
      for (const field of ['InitialState', 'Cleanup', 'CleanupVerification']) {
        if (typeof input[field] !== 'string' || input[field].trim() === '') {
          issues.push(issue('MISSING_COMPOSITE_FIELD', field, `${field} is required for COMPOSITE TestCases.`));
        }
      }
      requireNonEmptyStringArray(input, 'Preconditions', issues);
      if (!Object.prototype.hasOwnProperty.call(input, 'TestData')) {
        issues.push(issue('MISSING_COMPOSITE_FIELD', 'TestData', 'TestData ownership and values must be explicit for COMPOSITE TestCases.'));
      }
      requireNonEmptyStringArray(input, 'Steps', issues);
      requireRecordArray(input, 'ExpectedPerStep', ['Step', 'Action', 'Expected', 'StateAfter'], issues, 'MISSING_COMPOSITE_FIELD');
      requireRecordArray(input, 'StateTransitions', ['From', 'Action', 'To'], issues, 'MISSING_COMPOSITE_FIELD');
      requireNonEmptyStringArray(input, 'IntermediateAssertions', issues);
      requireNonEmptyStringArray(input, 'PostConditions', issues);
      requireNonEmptyStringArray(input, 'CrossStepInvariants', issues);
      if (Array.isArray(input.Steps) && Array.isArray(input.ExpectedPerStep) && input.Steps.length !== input.ExpectedPerStep.length) {
        issues.push(issue('STEP_EXPECTATION_COUNT_MISMATCH', 'ExpectedPerStep', 'Each composite step must have exactly one ExpectedPerStep entry.'));
      }
    }

    const unattendedAuto = input.AutomationEligibility === 'AUTO_ALLOWED';
    if (unattendedAuto && (input.AutomationType !== 'AUTO' || input.LifecycleStatus !== 'ACTIVE' || input.ReviewGateStatus !== 'PASS')) {
      issues.push(issue('AUTO_GATE_NOT_PASSED', 'AutomationEligibility', 'AUTO_ALLOWED requires AUTO type, ACTIVE lifecycle, and PASS review gate.'));
    }
    if (unattendedAuto && (input.RiskLevel === undefined || input.RiskLevel === 'UNKNOWN')) {
      issues.push(issue('UNKNOWN_RISK_AUTO', 'RiskLevel', 'Unknown risk is not eligible for unattended AUTO execution.'));
    }
    if (unattendedAuto && ['RISK_HIGH', 'RISK_CRITICAL'].includes(String(input.RiskLevel))) {
      issues.push(issue('HIGH_RISK_AUTO', 'RiskLevel', 'High or critical risk requires MANUAL_REQUIRED.'));
    }
    if (unattendedAuto && input.Reversibility === 'IRREVERSIBLE') {
      issues.push(issue('IRREVERSIBLE_AUTO_OPERATION', 'Reversibility', 'Irreversible operations require MANUAL_REQUIRED.'));
    }
    if (unattendedAuto && input.Reversibility === 'UNKNOWN') {
      issues.push(issue('UNKNOWN_REVERSIBILITY_AUTO', 'Reversibility', 'Unknown reversibility is not eligible for unattended AUTO execution.'));
    }
    if (unattendedAuto && input.InteractionMode === 'INTERACTIVE') {
      issues.push(issue('INTERACTIVE_AUTO', 'InteractionMode', 'AUTO execution must be unattended.'));
    }
    if (unattendedAuto && containsInteractiveInstruction(input)) {
      issues.push(issue('INTERACTIVE_AUTOMATION_VIOLATION', 'Steps', 'AUTO cases cannot contain instructions that wait for human interaction.'));
    }
    if (unattendedAuto && ['SHARED_ENVIRONMENT', 'UNKNOWN'].includes(String(input.DataOwnership))) {
      issues.push(issue('UNSAFE_DATA_OWNERSHIP_AUTO', 'DataOwnership', 'Shared or unknown data ownership is not eligible for unattended AUTO execution.'));
    }
    if (unattendedAuto && ['SHARED_ENVIRONMENT', 'UNKNOWN'].includes(String(input.SideEffectScope))) {
      issues.push(issue('UNSAFE_SIDE_EFFECT_SCOPE_AUTO', 'SideEffectScope', 'Shared or unknown side-effect scope is not eligible for unattended AUTO execution.'));
    }
    if (unattendedAuto && Array.isArray(input.ExpectationGapRefs) && input.ExpectationGapRefs.length > 0) {
      issues.push(issue('EXPECTATION_GAP_AUTO_FORBIDDEN', 'ExpectationGapRefs', 'AUTO_ALLOWED cannot carry unresolved ExpectationGapRefs.'));
    }
    if (input.SideEffects !== 'NONE') {
      if (typeof input.Cleanup !== 'string' || input.Cleanup.trim() === '') {
        issues.push(issue('MISSING_CLEANUP', 'Cleanup', 'Side-effecting TestCases require Cleanup.'));
      }
      if (typeof input.CleanupVerification !== 'string' || input.CleanupVerification.trim() === '') {
        issues.push(issue('MISSING_CLEANUP_VERIFICATION', 'CleanupVerification', 'Side-effecting TestCases require CleanupVerification.'));
      }
    }
    if (Array.isArray(input.IndependentObjectives) && input.IndependentObjectives.length > 1) {
      issues.push(issue('MEGA_CASE_WARNING', 'IndependentObjectives', 'Independently executable objectives require separate TestCaseIds.'));
    }
    if (isExpectationGap) {
      if (!Array.isArray(input.ExpectationGapRefs) || input.ExpectationGapRefs.length === 0 || input.ExpectationGapRefs.some((ref) => typeof ref !== 'string' || !/^EG-[A-Z0-9]+-[A-Z0-9-]+$/.test(ref))) {
        issues.push(issue('EXPECTATION_GAP_REQUIRED', 'ExpectationGapRefs', 'Unknown Expected requires linked ExpectationGapRefs.'));
      }
      if (input.AutomationEligibility !== 'NOT_EXECUTABLE' || input.ReviewGateStatus === 'PASS') {
        issues.push(issue('EXPECTATION_GAP_EXECUTION_FORBIDDEN', 'AutomationEligibility', 'Unresolved Expected must be NOT_EXECUTABLE and cannot pass Review Gate.'));
      }
      if (input.ExpectedResult !== undefined) {
        issues.push(issue('EXPECTED_GUESS_FORBIDDEN', 'ExpectedResult', 'Do not populate ExpectedResult when ExpectedBasis is UNKNOWN.'));
      }
    }
    if (isV2 && input.AutomationType === 'AUTO_PARTIAL') {
      issues.push(issue('AUTO_PARTIAL_V2_FORBIDDEN', 'AutomationType', 'New V2 cases cannot pause unattended execution for manual steps.'));
    }
    if (input.AutomationEligibility === 'MANUAL_REQUIRED' && input.AutomationType === 'AUTO') {
      issues.push(issue('AUTO_MANUAL_MISMATCH', 'AutomationEligibility', 'MANUAL_REQUIRED cannot use AutomationType=AUTO.'));
    }
    if (input.AutomationEligibility === 'NOT_EXECUTABLE' && input.AutomationType === 'AUTO') {
      issues.push(issue('AUTO_NOT_EXECUTABLE_MISMATCH', 'AutomationEligibility', 'NOT_EXECUTABLE cannot use AutomationType=AUTO.'));
    }
  }
  return issues;
}

export function validateTestCases(inputs: unknown[]): ValidationIssue[] {
  const issues = inputs.flatMap((input) => validateTestCase(input));
  const seen = new Set<string>();
  for (const input of inputs) {
    if (!isRecord(input) || typeof input.TestCaseId !== 'string') continue;
    if (seen.has(input.TestCaseId)) {
      issues.push(issue('DUPLICATE_TEST_CASE_ID', 'TestCaseId', `Duplicate TestCaseId: ${input.TestCaseId}.`));
    }
    seen.add(input.TestCaseId);
  }
  return issues;
}

export function validateScenarioSuite(input: unknown): ValidationIssue[] {
  if (!isRecord(input)) return [issue('INVALID_OBJECT', 'scenarioSuite', 'ScenarioSuite must be an object.')];
  const issues: ValidationIssue[] = [];
  for (const field of ['ScenarioSuiteId', 'ModuleId', 'FeatureId', 'Title', 'Objective', 'BusinessFlow', 'CleanupStrategy']) requireString(input, field, issues);
  requireNonEmptyStringArray(input, 'IncludedTestCases', issues);
  requireNonEmptyStringArray(input, 'LifecyclePath', issues);
  requireNonEmptyStringArray(input, 'CoverageTags', issues);
  requireNonEmptyStringArray(input, 'Risks', issues);
  if (input.ExpectationGapIds !== undefined) requireStringArray(input, 'ExpectationGapIds', issues);
  if (input.LifecycleStatus !== undefined) requireEnum(input, 'LifecycleStatus', LIFECYCLE_STATUSES, issues);
  if ('ExecutionStatus' in input) issues.push(issue('SUITE_EXECUTION_STATUS_FORBIDDEN', 'ExecutionStatus', 'ScenarioSuite does not carry execution status.'));
  return issues;
}

export function validateExpectationGap(input: unknown): ValidationIssue[] {
  if (!isRecord(input)) return [issue('INVALID_OBJECT', 'expectationGap', 'ExpectationGap must be an object.')];
  const issues: ValidationIssue[] = [];
  for (const field of ['ExpectationGapId', 'ModuleId', 'FeatureId', 'CandidateScenario', 'MissingExpectation', 'RequiredClarification']) requireString(input, field, issues);
  requireEnum(input, 'GapType', ['MISSING_EXPECTED', 'AMBIGUOUS_RULE', 'UNDEFINED_STATE', 'UNDEFINED_RELATIONSHIP'], issues);
  requireEnum(input, 'Risk', ['RISK_LOW', 'RISK_MEDIUM', 'RISK_HIGH', 'RISK_CRITICAL'], issues);
  requireNonEmptyStringArray(input, 'RelatedCoverageTags', issues);
  requireEnum(input, 'ResolutionStatus', ['OPEN', 'RESOLVED', 'REJECTED'], issues);
  if (input.ResolutionStatus === 'RESOLVED') {
    for (const field of ['ApprovedExpected', 'ApprovedExpectedBasis', 'ResolutionEvidence']) requireString(input, field, issues);
  }
  if (input.RuntimeObservationEvidenceIds !== undefined) requireStringArray(input, 'RuntimeObservationEvidenceIds', issues);
  if (input.AutomationEligibility !== undefined) {
    requireEnum(input, 'AutomationEligibility', ['MANUAL_REQUIRED', 'NOT_EXECUTABLE'], issues);
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
