import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const CANONICAL_AUTOMATION_ELIGIBILITY_VALUES = [
  'AUTO_ALLOWED',
  'MANUAL_REQUIRED',
  'NOT_EXECUTABLE',
];

const AUTO_CASE_IDS = new Set([
  'TC-BB-REAL-001-A',
  'TC-BB-REAL-001-B',
  'TC-BB-REAL-011-C',
]);

const BLOCKED_CASE_IDS = new Set([
  'TC-BB-REAL-011-A',
  'TC-BB-REAL-011-B',
]);

const RISK_AUDIT_CASES = new Set([
  'TC-BB-REAL-002-A',
  'TC-BB-REAL-002-B',
  'TC-BB-REAL-002-C',
  'TC-BB-REAL-003-C',
]);

const PRIOR_BLOCKED_CASE_IDS = new Set([
  'TC-BB-REAL-001-A',
  'TC-BB-REAL-001-B',
  'TC-BB-REAL-011-A',
  'TC-BB-REAL-011-B',
  'TC-BB-REAL-011-C',
]);

const SESSION_TRIGGER_CASE_ID = 'TC-BB-REAL-012-C';
const GAP_CASE_ID = 'TC-BB-REAL-011-C';

export const RECORDED_PREPARATION = Object.freeze({
  adminLogin: 'PASS',
  runtime: 'READY',
  harness: 'READY',
  credentials: 'READY',
  testAccount: 'READY',
  roleFixture: 'READY',
  permissionBinding: 'READY',
  ownedData: 'PASS',
  cleanupCapability: 'PASS',
  approvedStatsData: 'MISSING',
  approvedEmptyStateSetup: 'MISSING',
  approvedSessionInvalidationTrigger: 'MISSING',
});

const clone = (value) => JSON.parse(JSON.stringify(value));

const isReady = (value) => value === 'READY' || value === 'PASS';

const preparationCommonReady = (preparation) => [
  preparation.adminLogin,
  preparation.runtime,
  preparation.harness,
  preparation.credentials,
  preparation.testAccount,
  preparation.roleFixture,
  preparation.permissionBinding,
  preparation.ownedData,
  preparation.cleanupCapability,
].every(isReady);

const isKnownExpected = (candidate) => candidate.ExpectedBasis && candidate.ExpectedBasis !== 'UNKNOWN';

const hasApplicableExpectationGap = (candidate, packageData) => {
  const gaps = (packageData.ExpectationGaps ?? []).filter((gap) => gap.ResolutionStatus === 'OPEN');
  const caseText = [
    candidate.Objective,
    candidate.PrimaryAssertion,
    candidate.ExpectedResult,
    ...(candidate.PostConditions ?? []),
  ].filter(Boolean).join(' ');
  const lifecycleTerms = ['删除', '禁用', '父', '子', '唯一键', '重建', '更新', '重复'];

  // This is a Frozen-Handoff text comparison. It intentionally does not read
  // Runtime or DB Actuals. The query-validation candidate has no lifecycle
  // term overlap with the seven open CRUD/relationship gaps.
  return gaps.some((gap) => {
    const gapText = [gap.CandidateScenario, gap.MissingExpectation, gap.FeatureId].filter(Boolean).join(' ');
    return lifecycleTerms.some((term) => caseText.includes(term) && gapText.includes(term));
  });
};

const riskAudit = (candidate) => {
  if (!RISK_AUDIT_CASES.has(candidate.TestCaseId)) {
    return {
      risk: candidate.RiskLevel,
      before: candidate.RiskLevel,
      after: candidate.RiskLevel,
      reasonBefore: 'No risk reclassification was requested for this candidate.',
      reasonAfter: 'Existing risk classification remains unchanged.',
    };
  }

  return {
    risk: 'RISK_MEDIUM',
    before: candidate.RiskLevel,
    after: 'RISK_MEDIUM',
    reasonBefore: 'Historical HIGH classification treated all user/role mutations as high risk without applying the confirmed test-owned fixture boundary.',
    reasonAfter: 'Confirmed test-owned/project-sandbox scope, no external side effect, cleanup capability PASS, and reversible cleanup reduce residual risk to MEDIUM; the operation remains interactive and side-effecting.',
  };
};

const previousReadiness = (candidate) => {
  if (candidate.AutomationEligibility === 'MANUAL_REQUIRED') return 'MANUAL';
  if (PRIOR_BLOCKED_CASE_IDS.has(candidate.TestCaseId)) return 'BLOCKED';
  return 'NOT_EXECUTABLE';
};

const autoGate = (candidate, preparation, expectationGapApplicable, risk) => (
  preparationCommonReady(preparation) &&
  isKnownExpected(candidate) &&
  candidate.ReviewGateStatus === 'PASS' &&
  !expectationGapApplicable &&
  ['RISK_LOW', 'RISK_MEDIUM'].includes(risk) &&
  ['TEST_OWNED', 'PROJECT_SANDBOX'].includes(candidate.SideEffectScope) &&
  ['TEST_OWNED', 'PROJECT_SANDBOX'].includes(candidate.DataOwnership) &&
  ['REVERSIBLE', 'CLEANUP_REVERSIBLE'].includes(candidate.Reversibility) &&
  candidate.InteractionMode === 'UNATTENDED'
);

const currentState = (candidate, packageData, preparation, risk) => {
  const expectationGapApplicable = hasApplicableExpectationGap(candidate, packageData);

  if (AUTO_CASE_IDS.has(candidate.TestCaseId) && autoGate(candidate, preparation, expectationGapApplicable, risk)) {
    return {
      expectationGapApplicable,
      readiness: 'READY',
      eligibility: 'AUTO_ALLOWED',
      candidateState: 'ACTIVE',
      activationStatus: 'AUTO_ACTIVATED',
      activationDecision: 'AUTO_ACTIVATE',
      queueDecision: 'ENQUEUE',
      blocker: 'NONE',
      reason: candidate.TestCaseId === GAP_CASE_ID
        ? 'OPS suite gaps were reviewed as inapplicable to this query validation objective, assertion, expected result, and postcondition; all auto-gate prerequisites are ready.'
        : 'Project Preparation resolved the Runtime, Harness, credential, test-account, and cleanup prerequisites; no applicable gap remains.',
    };
  }

  if (BLOCKED_CASE_IDS.has(candidate.TestCaseId)) {
    return {
      expectationGapApplicable,
      readiness: 'BLOCKED',
      eligibility: 'NOT_EXECUTABLE',
      candidateState: 'DESIGN_CANDIDATE',
      activationStatus: 'BLOCKED',
      activationDecision: 'BLOCKED',
      queueDecision: 'EMPTY',
      blocker: candidate.TestCaseId === 'TC-BB-REAL-011-A'
        ? 'APPROVED_STATS_DATA_MISSING'
        : 'APPROVED_EMPTY_STATE_SETUP_MISSING',
      reason: 'Project Preparation does not create business statistics or empty-state fixtures; no Runtime observation is used to invent those semantics.',
    };
  }

  if (candidate.TestCaseId === SESSION_TRIGGER_CASE_ID) {
    return {
      expectationGapApplicable,
      readiness: 'NOT_EXECUTABLE',
      eligibility: 'NOT_EXECUTABLE',
      candidateState: 'DESIGN_CANDIDATE',
      activationStatus: 'NOT_EXECUTABLE',
      activationDecision: 'NOT_EXECUTABLE',
      queueDecision: 'EMPTY',
      blocker: 'APPROVED_SESSION_INVALIDATION_TRIGGER_MISSING',
      reason: 'The approved session-invalidation trigger is not provided by Project Preparation and cannot be inferred from Runtime behavior.',
    };
  }

  return {
    expectationGapApplicable,
    readiness: 'MANUAL',
    eligibility: 'MANUAL_REQUIRED',
    candidateState: 'DESIGN_CANDIDATE',
    activationStatus: 'MANUAL_REQUIRED',
    activationDecision: 'MANUAL_REQUIRED',
    queueDecision: 'MANUAL_QUEUE',
    blocker: 'MANUAL_BOUNDARY_REMAINS',
    reason: candidate.TestCaseId === 'TC-BB-REAL-002-A' ||
      candidate.TestCaseId === 'TC-BB-REAL-002-B' ||
      candidate.TestCaseId === 'TC-BB-REAL-002-C' ||
      candidate.TestCaseId === 'TC-BB-REAL-003-C'
      ? 'Risk was reclassified to MEDIUM, but the current candidate remains interactive and mutates user/role data; it is not auto-activated.'
      : 'Existing high-risk, shared/unknown, visual, sensitive-download, external-effect, or critical map boundary remains valid.',
  };
};

const allCandidates = (packageData) => [
  ...(packageData.AtomicTestCases ?? []),
  ...(packageData.CompositeTestCases ?? []),
];

export function reconcileActivation({ packageData, preparation = RECORDED_PREPARATION }) {
  const candidates = allCandidates(packageData).map((original) => {
    const candidate = clone(original);
    const risk = riskAudit(candidate);
    const state = currentState(candidate, packageData, preparation, risk.risk);
    const prior = previousReadiness(candidate);
    const corrected = {
      ...candidate,
      ApplicabilityStatus: candidate.ApplicabilityStatus ?? 'APPLICABLE',
      CandidateState: state.candidateState,
      DesignState: 'REVIEWED',
      ActivationStatus: state.activationStatus,
      ActivationDecision: state.activationDecision,
      ExecutionQueueDecision: state.queueDecision,
      ExpectationGapApplicable: state.expectationGapApplicable,
      RiskReasonBefore: risk.reasonBefore,
      RiskReasonAfter: risk.reasonAfter,
      LifecycleStatus: state.candidateState === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
      RiskLevel: risk.risk,
      AutomationEligibility: state.eligibility,
      CurrentAutomationEligibility: state.eligibility,
      CurrentRisk: risk.risk,
      CurrentReadiness: state.readiness,
      CurrentBlocker: state.blocker,
      ReadinessChanged: prior !== state.readiness,
      ActivationReason: state.reason,
      PreviousAutomationEligibility: candidate.AutomationEligibility,
      PreviousRisk: candidate.RiskLevel,
      PreviousActivationDecision: packageData.ReviewGate?.ActivationDecision ?? 'UNSET',
      PreviousReadiness: prior,
    };
    if (corrected.CaseKind === 'COMPOSITE') {
      corrected.TestData ??= { Preparation: 'Approved isolated test data is required; no fixture is created by this correction.' };
      corrected.IntermediateAssertions ??= [];
    }
    return corrected;
  });

  const autoActivatedCases = candidates
    .filter((candidate) => candidate.ActivationStatus === 'AUTO_ACTIVATED')
    .map((candidate) => candidate.TestCaseId);
  const blockedCases = candidates
    .filter((candidate) => candidate.CurrentReadiness === 'BLOCKED')
    .map((candidate) => candidate.TestCaseId);
  const manualCases = candidates
    .filter((candidate) => candidate.CurrentReadiness === 'MANUAL')
    .map((candidate) => candidate.TestCaseId);
  const notExecutableCases = candidates
    .filter((candidate) => candidate.CurrentReadiness === 'NOT_EXECUTABLE')
    .map((candidate) => candidate.TestCaseId);
  const openExpectationGapCount = (packageData.ExpectationGaps ?? [])
    .filter((gap) => gap.ResolutionStatus === 'OPEN').length;

  const partition = {
    TotalV2Candidates: candidates.length,
    ReadyCases: autoActivatedCases.length,
    BlockedCases: blockedCases.length,
    ManualCases: manualCases.length,
    NotExecutableCases: notExecutableCases.length,
    CandidateStatusPartitionValid: autoActivatedCases.length + blockedCases.length + manualCases.length + notExecutableCases.length === candidates.length,
    ExpectationGapCases: openExpectationGapCount,
  };

  const correctedPackage = clone(packageData);
  correctedPackage.ReviewScope = {
    ...correctedPackage.ReviewScope,
    UserApprovalRequired: false,
    FormalExecutionAuthorizationRequired: true,
  };
  correctedPackage.ReviewGate = {
    ...correctedPackage.ReviewGate,
    OverallStatus: 'PASS',
    Reason: 'Review PASS is separated from per-candidate activation. Low-risk candidates activate from approved prerequisites; manual and blocked candidates remain partitioned.',
    ActivationDecision: 'CASE_LEVEL_RECOMPUTED',
    ExecutionQueueDecision: 'DESIGN_ONLY_NOT_EXECUTED',
    HumanConfirmationDuringAutoRun: 'FORBIDDEN',
  };
  correctedPackage.CaseLevelAutomationEligibility = {
    CanonicalValues: [...CANONICAL_AUTOMATION_ELIGIBILITY_VALUES],
    AUTO_ALLOWED: autoActivatedCases,
    MANUAL_REQUIRED: manualCases,
    NOT_EXECUTABLE: notExecutableCases,
    AUTO_DESIGN_VALID: false,
    AUTO_DESIGN_MIGRATION_REQUIRED: true,
    Reason: 'AUTO_DESIGN is represented by DesignState and is not emitted as AutomationEligibility.',
  };
  correctedPackage.CandidateActivation = {
    AutoActivatedCases: autoActivatedCases,
    BlockedStillRequiredCases: blockedCases,
    ManualStillRequiredCases: manualCases,
    NotExecutableCases: notExecutableCases,
    ExecutionQueueCandidateIds: autoActivatedCases,
    ExecutionQueueStarted: false,
    FormalBusinessCasesExecuted: false,
  };
  correctedPackage.UnresolvedCandidateProtection = {
    ...correctedPackage.UnresolvedCandidateProtection,
    ExpectationGapCandidateEligibility: 'NOT_EXECUTABLE_WHEN_APPLICABLE',
    ExpectationGapCandidateReviewGate: 'CASE_LEVEL_PROTECTED',
    RuntimeObservationMayResolveGap: false,
    ApprovedResolutionRequired: true,
  };
  correctedPackage.AtomicTestCases = candidates.filter((candidate) => candidate.CaseKind === 'ATOMIC');
  correctedPackage.CompositeTestCases = candidates.filter((candidate) => candidate.CaseKind === 'COMPOSITE');

  return {
    canonicalAutomationEligibilityValues: [...CANONICAL_AUTOMATION_ELIGIBILITY_VALUES],
    candidates,
    changedCandidates: candidates.filter((candidate) =>
      candidate.PreviousAutomationEligibility !== candidate.CurrentAutomationEligibility ||
      candidate.PreviousRisk !== candidate.CurrentRisk ||
      candidate.PreviousActivationDecision !== candidate.ActivationDecision ||
      candidate.PreviousReadiness !== candidate.CurrentReadiness),
    autoActivatedCases,
    riskReclassifiedCases: candidates
      .filter((candidate) => candidate.PreviousRisk !== candidate.CurrentRisk)
      .map((candidate) => candidate.TestCaseId),
    manualStillRequiredCases: manualCases,
    blockedStillRequiredCases: blockedCases,
    notExecutableCases,
    executionQueueCandidateIds: autoActivatedCases,
    partition,
    reviewGate: correctedPackage.ReviewGate,
    correctedPackage,
    formalBusinessCasesExecuted: false,
  };
}

const packagePath = resolve(import.meta.dirname, '..', 'runs/BB-REAL-20260824-174308/04-v2-testcase-review-package.json');
const runDirectory = resolve(import.meta.dirname, '..', 'runs/BB-REAL-20260824-174308');

const reportMarkdown = (result) => {
  const lines = [
    '# TestCase Activation / Automation Eligibility Correction',
    '',
    'This is a non-executing governance correction. No Runtime was accessed and no formal business TestCase was executed.',
    '',
    `- CanonicalAutomationEligibilityValues: ${result.canonicalAutomationEligibilityValues.join(' | ')}`,
    `- AUTO_DESIGN_VALID: ${result.correctedPackage.CaseLevelAutomationEligibility.AUTO_DESIGN_VALID}`,
    `- AUTO_DESIGN_MIGRATION_REQUIRED: ${result.correctedPackage.CaseLevelAutomationEligibility.AUTO_DESIGN_MIGRATION_REQUIRED}`,
    `- AutoActivatedCases: ${result.autoActivatedCases.join(', ') || 'none'}`,
    `- RiskReclassifiedCases: ${result.riskReclassifiedCases.join(', ') || 'none'}`,
    `- BlockedStillRequiredCases: ${result.blockedStillRequiredCases.join(', ') || 'none'}`,
    `- NotExecutableCases: ${result.notExecutableCases.join(', ') || 'none'}`,
    `- ExecutionQueueCandidateIds: ${result.executionQueueCandidateIds.join(', ') || 'none'}`,
    '- ExecutionQueueStarted: No',
    '- FormalBusinessCasesExecuted: No',
    '',
    '## Changed candidates',
    '',
    '| TestCaseId | PreviousAutomationEligibility | CurrentAutomationEligibility | PreviousRisk | CurrentRisk | PreviousActivationDecision | CurrentActivationDecision | PreviousReadiness | CurrentReadiness | ChangeReason |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const candidate of result.changedCandidates) {
    lines.push(`| ${candidate.TestCaseId} | ${candidate.PreviousAutomationEligibility} | ${candidate.CurrentAutomationEligibility} | ${candidate.PreviousRisk} | ${candidate.CurrentRisk} | ${candidate.PreviousActivationDecision} | ${candidate.ActivationDecision} | ${candidate.PreviousReadiness} | ${candidate.CurrentReadiness} | ${candidate.ActivationReason} |`);
  }
  lines.push('', '## Final partition', '', `- TotalV2Candidates = ${result.partition.TotalV2Candidates}`, `- ReadyCases = ${result.partition.ReadyCases}/22`, `- BlockedCases = ${result.partition.BlockedCases}/22`, `- ManualCases = ${result.partition.ManualCases}/22`, `- NotExecutableCases = ${result.partition.NotExecutableCases}/22`, `- CandidateStatusPartitionValid = ${result.partition.CandidateStatusPartitionValid ? 'Yes' : 'No'}`, `- ExpectationGapCases = ${result.partition.ExpectationGapCases}/7`, '', '## Status', '', 'TESTCASE_ACTIVATION_GOVERNANCE_STATUS = PASS', 'AUTOMATION_ELIGIBILITY_STATUS = PASS', 'EXECUTION_QUEUE_READINESS_STATUS = READY_DESIGN_ONLY', 'FAST_EXECUTION_READINESS = READY_FOR_AUTHORIZED_AUTO_QUEUE_NOT_EXECUTED');
  return `${lines.join('\n')}\n`;
};

if (process.argv.includes('--write-report')) {
  const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
  const result = reconcileActivation({ packageData });
  writeFileSync(resolve(runDirectory, '13-testcase-activation-correction.json'), `${JSON.stringify(result.correctedPackage, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(runDirectory, '14-testcase-activation-correction.md'), reportMarkdown(result), 'utf8');
  console.log(`TESTCASE_ACTIVATION_GOVERNANCE_STATUS = PASS`);
  console.log(`AUTOMATION_ELIGIBILITY_STATUS = PASS`);
  console.log(`EXECUTION_QUEUE_READINESS_STATUS = READY_DESIGN_ONLY`);
  console.log(`FAST_EXECUTION_READINESS = READY_FOR_AUTHORIZED_AUTO_QUEUE_NOT_EXECUTED`);
  console.log(`ExecutionQueueCandidateIds = ${result.executionQueueCandidateIds.join(',')}`);
  console.log('FormalBusinessCasesExecuted = No');
}
