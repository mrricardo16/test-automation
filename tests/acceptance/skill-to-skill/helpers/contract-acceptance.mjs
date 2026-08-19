import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const helperDirectory = dirname(fileURLToPath(import.meta.url));
const sourceContractPath = resolve(helperDirectory, '../../../../fixtures/synthetic-product/contracts/source-contract.json');

export async function loadSyntheticSourceContract() {
  return JSON.parse(await readFile(sourceContractPath, 'utf8'));
}

function stableIdList(source) {
  return Object.values(source.stableIds).flat();
}

function sourceHash(source) {
  return createHash('sha256').update(JSON.stringify(source)).digest('hex');
}

function graphValidation(artifacts) {
  const issues = [];
  if (!artifacts.handoff.readOnlyExpected) issues.push('HANDOFF_NOT_READ_ONLY');
  if (artifacts.handoff.ExpectedBasis !== 'HANDOFF_BASELINE') issues.push('HANDOFF_EXPECTED_BASIS_INVALID');
  if (artifacts.coverage.TestCaseId !== artifacts.testCase.TestCaseId) issues.push('COVERAGE_TESTCASE_MISMATCH');
  if (artifacts.execution.TestCaseId !== artifacts.testCase.TestCaseId) issues.push('EXECUTION_TESTCASE_MISMATCH');
  if (artifacts.feedback.TestCaseId !== artifacts.execution.TestCaseId) issues.push('FEEDBACK_TESTCASE_MISMATCH');
  return issues;
}

export function buildDevToTestArtifacts(source, options = {}) {
  const hasMismatch = Boolean(options.runtimeObservation);
  const evidence = hasMismatch
    ? [{ EvidenceId: 'OBS-SYN-CONTRACT-001', Kind: 'OBSERVATION', TestCaseId: 'TC-SYN-CONTRACT-001', Sanitized: true }]
    : [{ EvidenceId: 'EV-SYN-CONTRACT-001', Kind: 'ACTUAL', TestCaseId: 'TC-SYN-CONTRACT-001', Sanitized: true }];
  const handoff = {
    artifactType: 'TEST_HANDOFF',
    readOnlyExpected: true,
    ExpectedBasis: 'HANDOFF_BASELINE',
    expected: { ...source.expected },
    stableIds: JSON.parse(JSON.stringify(source.stableIds)),
    sourceHash: sourceHash(source),
  };
  const coverage = {
    TestCaseId: 'TC-SYN-CONTRACT-001',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'HANDOFF_BASELINE',
  };
  const testCase = {
    TestCaseId: 'TC-SYN-CONTRACT-001',
    ModuleId: 'MOD-SYNTHETIC-CONTRACTS',
    FeatureId: 'FEAT-DEV-TEST-CONTRACT',
    Title: 'Synthetic DEV to TEST contract acceptance',
    Priority: 'P0',
    TestType: 'Contract Acceptance',
    TestLayer: 'CONTRACT_ACCEPTANCE',
    ApplicabilityStatus: 'APPLICABLE',
    ExpectedBasis: 'HANDOFF_BASELINE',
    ExpectedResult: 'The read-only Handoff Expected baseline remains traceable.',
    AutomationType: 'AUTO',
    AutomationFramework: 'Playwright Test',
  };
  const execution = {
    TestCaseId: testCase.TestCaseId,
    ExecutionStatus: 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'HANDOFF_BASELINE',
    EvidenceIds: evidence.filter((item) => item.Kind === 'ACTUAL').map((item) => item.EvidenceId),
    ObservationEvidenceIds: evidence.filter((item) => item.Kind === 'OBSERVATION').map((item) => item.EvidenceId),
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
    SourceRuntimeAlignment: hasMismatch ? 'MISMATCH' : 'ALIGNED',
  };
  const feedback = {
    TestCaseId: execution.TestCaseId,
    mismatchPreserved: hasMismatch,
    ExpectedBasis: handoff.ExpectedBasis,
    Observation: options.runtimeObservation ?? null,
  };
  return { handoff, coverage, testCase, execution, evidence, feedback, validationIssues: graphValidation({ handoff, coverage, testCase, execution, feedback }) };
}

export function buildSourceWhiteboxArtifacts(source, baselineStatus, alignment) {
  const isIncomplete = baselineStatus === 'BASELINE_INCOMPLETE';
  const gateStatus = baselineStatus === 'BASELINE_VALIDATED' ? 'PASS' : baselineStatus === 'BASELINE_LIMITED' ? 'LIMITED' : 'FAIL';
  const execution = {
    TestCaseId: 'TC-SYN-CONTRACT-002',
    ExecutionStatus: isIncomplete ? 'BLOCKED' : baselineStatus === 'BASELINE_LIMITED' ? 'SKIPPED' : 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: isIncomplete ? 'UNTESTED' : baselineStatus === 'BASELINE_LIMITED' ? 'PARTIAL' : 'COVERED',
    ExpectedBasis: 'APPROVED_BASELINE',
    EvidenceIds: ['EV-SYN-WHITEBOX-001'],
    ObservationEvidenceIds: [],
    EnvironmentId: 'synthetic-ci',
    GateStatus: gateStatus,
    BaselineStatus: baselineStatus,
    SourceRuntimeAlignment: alignment,
  };
  return {
    baseline: {
      artifactType: 'WHITEBOX_BASELINE',
      BaselineStatus: baselineStatus,
      SourceRuntimeAlignment: alignment,
      GateStatus: gateStatus,
      sourceHash: sourceHash(source),
    },
    coverage: { TestCaseId: execution.TestCaseId, CoverageStatus: execution.CoverageStatus },
    testCase: {
      TestCaseId: execution.TestCaseId,
      ModuleId: 'MOD-SYNTHETIC-CONTRACTS',
      FeatureId: 'FEAT-SOURCE-WHITEBOX-CONTRACT',
      Title: 'Synthetic source to White-box contract acceptance',
      Priority: 'P0',
      TestType: 'Contract Acceptance',
      TestLayer: 'CONTRACT_ACCEPTANCE',
      ApplicabilityStatus: 'APPLICABLE',
      ExpectedBasis: execution.ExpectedBasis,
      ExpectedResult: 'The White-box baseline and execution artifacts remain traceable.',
      AutomationType: 'AUTO',
      AutomationFramework: 'Playwright Test',
    },
    execution,
    evidence: [{ EvidenceId: 'EV-SYN-WHITEBOX-001', Kind: 'ACTUAL', Sanitized: true }],
    rootCause: { regressionType: 'IMPLEMENTATION_REGRESSION', confidence: 'CONFIRMED_FROM_CODE' },
    validationIssues: [],
  };
}

export function buildKnownBugExecution(source) {
  return {
    TestCaseId: 'TC-SYN-BUG-001',
    ExecutionStatus: 'FAIL',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'APPROVED_BASELINE',
    AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
    EvidenceIds: ['EV-SYN-BUG-001'],
    ObservationEvidenceIds: ['OBS-SYN-BUG-001'],
    EnvironmentId: 'synthetic-ci',
    GateStatus: 'PASS',
    SourceRuntimeAlignment: 'ALIGNED',
    bugId: source.stableIds.FEAT.find((id) => id.includes('KNOWN-BUG')),
  };
}

export function evaluateAcceptanceExpectation(result) {
  const matches = result.AcceptanceExpectation === 'EXPECT_PASS' && result.ExecutionStatus === 'PASS' ||
    result.AcceptanceExpectation === 'EXPECT_PRODUCT_FAIL' && result.ExecutionStatus === 'FAIL' ||
    result.AcceptanceExpectation === 'EXPECT_BLOCKED' && result.ExecutionStatus === 'BLOCKED' ||
    result.AcceptanceExpectation === 'EXPECT_MANUAL' && result.ExecutionStatus === 'MANUAL' ||
    result.AcceptanceExpectation === 'EXPECT_BASELINE_LIMITED' && result.BaselineStatus === 'BASELINE_LIMITED';
  return { GateStatus: matches ? 'PASS' : 'FAIL', ProductExecutionStatus: result.ExecutionStatus, AcceptanceExpectation: result.AcceptanceExpectation };
}

export function evaluateApplicability(result) {
  if (result.ApplicabilityStatus === 'NOT_APPLICABLE') {
    return { valid: result.CoverageStatus === 'NOT_APPLICABLE' && Boolean(result.ApplicabilityReason) };
  }
  if (result.ApplicabilityStatus === 'CONDITIONAL') {
    return { valid: Boolean(result.ApplicabilityCondition) && result.ExecutionStatus !== 'PASS' };
  }
  return { valid: ['APPLICABLE', 'UNKNOWN'].includes(result.ApplicabilityStatus) };
}

export function evaluateBaselineAndAlignment(baselineStatus, alignment) {
  return {
    represented: ['BASELINE_VALIDATED', 'BASELINE_LIMITED', 'BASELINE_INCOMPLETE'].includes(baselineStatus) &&
      ['ALIGNED', 'MISMATCH', 'UNKNOWN', 'NOT_APPLICABLE'].includes(alignment),
  };
}

export function stableIdsForSource(source) {
  return stableIdList(source);
}
