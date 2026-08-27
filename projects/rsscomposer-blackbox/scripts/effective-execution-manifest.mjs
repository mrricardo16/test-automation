import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const originalPackagePath = resolve(projectRoot, 'runs/BB-REAL-20260824-174308/04-v2-testcase-review-package.json');
const correctionPath = resolve(projectRoot, 'runs/BB-REAL-20260824-174308/13-testcase-activation-correction.json');
const designCorrectionPath = resolve(projectRoot, 'runs/BB-REAL-20260824-174308/15-tc011c-design-correction.json');
const userRoleCorrectionPath = resolve(projectRoot, 'runs/BB-REAL-20260824-174308/18-user-role-automation-eligibility-correction.json');
const readinessPath = resolve(projectRoot, 'reports/project-preparation-readiness-20260825.md');

const allCandidates = (packageData) => [...(packageData.AtomicTestCases ?? []), ...(packageData.CompositeTestCases ?? [])];

export function buildEffectiveExecutionManifest({ runId, generatedAt = new Date().toISOString() }) {
  if (!runId) throw new Error('FormalRunId is required.');
  if (![originalPackagePath, correctionPath, designCorrectionPath, userRoleCorrectionPath, readinessPath].every(existsSync)) throw new Error('Execution manifest source artifact is missing.');

  const originalPackage = JSON.parse(readFileSync(originalPackagePath, 'utf8'));
  const correctedPackage = JSON.parse(readFileSync(correctionPath, 'utf8'));
  const designCorrection = JSON.parse(readFileSync(designCorrectionPath, 'utf8'));
  const userRoleCorrection = JSON.parse(readFileSync(userRoleCorrectionPath, 'utf8'));
  const designCorrections = new Map([
    [designCorrection.CorrectedCandidate.TestCaseId, designCorrection.CorrectedCandidate],
    ...userRoleCorrection.CandidateOverrides.map((candidate) => [candidate.TestCaseId, candidate]),
  ]);
  const effectiveCandidates = allCandidates(correctedPackage).map((candidate) => ({
    ...candidate,
    ...(designCorrections.get(candidate.TestCaseId) ?? {}),
  }));
  const candidates = effectiveCandidates.filter((candidate) =>
    candidate.CurrentReadiness === 'READY' &&
    candidate.AutomationEligibility === 'AUTO_ALLOWED' &&
    candidate.ActivationStatus === 'AUTO_ACTIVATED' &&
    candidate.ExecutionQueueDecision === 'ENQUEUE',
  );
  const expectedIds = [
    'TC-BB-REAL-001-A',
    'TC-BB-REAL-001-B',
    'TC-BB-REAL-002-A',
    'TC-BB-REAL-002-B',
    'TC-BB-REAL-002-C',
    'TC-BB-REAL-003-C',
  ];
  const actualIds = candidates.map((candidate) => candidate.TestCaseId);
  if (actualIds.length !== expectedIds.length || expectedIds.some((id) => !actualIds.includes(id))) {
    throw new Error(`Effective execution set mismatch: ${actualIds.join(', ')}`);
  }

  return {
    ExecutionManifestId: `EFFECTIVE-${runId}`,
    RunId: runId,
    GeneratedAt: generatedAt,
    FormalHarness: 'PROJECT_PLAYWRIGHT',
    BrowserVisibility: 'HEADED',
    InteractionMode: 'UNATTENDED',
    HumanConfirmationDuringAutoRun: 'FORBIDDEN',
    SourceReviewPackage: 'runs/BB-REAL-20260824-174308/04-v2-testcase-review-package.json',
    ActivationCorrectionArtifact: 'runs/BB-REAL-20260824-174308/13-testcase-activation-correction.json',
    DesignCorrectionArtifact: 'runs/BB-REAL-20260824-174308/15-tc011c-design-correction.json',
    UserRoleEligibilityCorrectionArtifact: 'runs/BB-REAL-20260824-174308/18-user-role-automation-eligibility-correction.json',
    ReadinessArtifact: 'reports/project-preparation-readiness-20260825.md',
    OriginalPackageImmutable: true,
    ExecutionManifestCases: candidates.map((candidate) => ({
      TestCaseId: candidate.TestCaseId,
      TestCaseType: candidate.CaseKind,
      ReviewStatus: candidate.ReviewGateStatus,
      AutomationEligibility: candidate.AutomationEligibility,
      ActivationStatus: candidate.ActivationStatus,
      ExpectedBasis: candidate.ExpectedBasis,
      ExpectationGapApplicable: candidate.ExpectationGapApplicable,
      RiskLevel: candidate.RiskLevel,
      SideEffectScope: candidate.SideEffectScope,
      PrerequisiteStatus: 'READY',
      ExecutionEligibility: 'READY',
    })),
    ExcludedCaseIds: allCandidates(originalPackage)
      .map((candidate) => candidate.TestCaseId)
      .filter((id) => !expectedIds.includes(id)),
    ExecutionQueueStarted: false,
    FormalBusinessCasesExecuted: false,
  };
}

export function writeEffectiveExecutionManifest({ runId, generatedAt } = {}) {
  const effectiveRunId = runId ?? `FAST-BB-REAL-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-')}`;
  const runDirectory = resolve(projectRoot, 'runs', effectiveRunId);
  mkdirSync(runDirectory, { recursive: false });
  const manifest = buildEffectiveExecutionManifest({ runId: effectiveRunId, generatedAt });
  const manifestPath = resolve(runDirectory, 'effective-execution-manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { runId: effectiveRunId, runDirectory, manifestPath, manifest };
}

if (process.argv.includes('--write')) {
  const result = writeEffectiveExecutionManifest();
  console.log(JSON.stringify({
    FormalRunId: result.runId,
    ExecutionManifestId: result.manifest.ExecutionManifestId,
    ExecutionManifestCases: result.manifest.ExecutionManifestCases.map((candidate) => candidate.TestCaseId),
    ManifestPath: result.manifestPath,
  }, null, 2));
}
