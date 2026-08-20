import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ACCEPTANCE_EXPECTATIONS,
  APPLICABILITY_STATUSES,
  BASELINE_STATUSES,
  COVERAGE_STATUSES,
  EXECUTION_STATUSES,
  FLAKY_CLASSIFICATIONS,
  GATE_STATUSES,
  SOURCE_RUNTIME_ALIGNMENTS,
  type ContractExecutionResult,
} from './contract-types';
import { validateExecutionResult } from './validate-contracts';
import { classifyFlakyResult } from './flaky-policy';
import { validateEnvironmentProfile, type EnvironmentProfile } from './load-environment';

export type OverallResult = 'PASS' | 'PASS_WITH_LIMITATIONS' | 'FAIL' | 'BLOCKED';

export interface CoverageItem {
  TestCaseId: string;
  Priority?: 'P0' | 'P1' | 'P2' | 'P3';
  ApplicabilityStatus: string;
  CoverageStatus: string;
}

export interface EvidenceItem {
  EvidenceId: string;
  Redacted?: boolean;
}

export interface AggregationInput {
  RunId: string;
  Environment: EnvironmentProfile;
  StartedAt: string;
  FinishedAt: string;
  ExecutionResults: ContractExecutionResult[];
  CoverageItems?: CoverageItem[];
  EvidenceItems?: EvidenceItem[];
}

type CountMap = Record<string, number>;

export interface AggregatedReport {
  RunId: string;
  EnvironmentId: string;
  EnvironmentType: string;
  StartedAt: string;
  FinishedAt: string;
  TestCaseCounts: { Total: number };
  Execution: CountMap;
  Applicability: CountMap;
  Coverage: CountMap & { TotalCoverageItems: number; P0NotCovered: number };
  Baseline: CountMap;
  SourceRuntimeAlignment: CountMap;
  Gate: CountMap & { AcceptanceGateFailures: number };
  AcceptanceExpectation: CountMap;
  DefectSummary: {
    ProductFailures: number;
    ExpectedProductFailures: number;
    UnexpectedFailures: number;
  };
  EvidenceSummary: {
    RequiredEvidence: number;
    AvailableEvidence: number;
    MissingEvidence: number;
    RedactedEvidence: number;
    EvidenceGate: 'PASS' | 'FAIL';
  };
  FlakySummary: CountMap & { Retried: number };
  CriticalFindings: string[];
  OverallResult: OverallResult;
}

function counts(values: readonly string[], actual: string[]): CountMap {
  const result: CountMap = Object.fromEntries(values.map((value) => [value, 0]));
  for (const value of actual) {
    if (value in result) result[value] += 1;
  }
  return result;
}

function normalizeResults(input: AggregationInput): ContractExecutionResult[] {
  return input.ExecutionResults.map((result) => {
    const issues = validateExecutionResult(result);
    if (issues.length > 0) throw new Error(`Invalid execution result ${result.TestCaseId}: ${issues.map((item) => item.code).join(', ')}`);
    return {
      ...result,
      EvidenceIds: [...result.EvidenceIds],
      ObservationEvidenceIds: [...result.ObservationEvidenceIds],
      attempts: result.attempts?.map((attempt) => ({ ...attempt, EvidenceIds: [...attempt.EvidenceIds] })),
      firstFailureEvidence: result.firstFailureEvidence ? [...result.firstFailureEvidence] : undefined,
    };
  });
}

function renderMarkdown(report: AggregatedReport): string {
  const row = (label: string, value: number | string) => `| ${label} | ${value} |`;
  return [
    '# Platform Run Summary',
    '',
    `- RunId: ${report.RunId}`,
    `- Environment: ${report.EnvironmentId} (${report.EnvironmentType})`,
    `- StartedAt: ${report.StartedAt}`,
    `- FinishedAt: ${report.FinishedAt}`,
    '',
    '## Execution Summary',
    '',
    '| Status | Count |',
    '|---|---:|',
    ...EXECUTION_STATUSES.map((status) => row(status, report.Execution[status])),
    '',
    '## Acceptance and Defects',
    '',
    `- ProductFailures: ${report.DefectSummary.ProductFailures}`,
    `- ExpectedProductFailures: ${report.DefectSummary.ExpectedProductFailures}`,
    `- UnexpectedFailures: ${report.DefectSummary.UnexpectedFailures}`,
    `- AcceptanceGateFailures: ${report.Gate.AcceptanceGateFailures}`,
    '',
    '## Coverage',
    '',
    `- Total: ${report.Coverage.TotalCoverageItems}`,
    `- Covered: ${report.Coverage.COVERED}`,
    `- Partial: ${report.Coverage.PARTIAL}`,
    `- Not covered: ${report.Coverage.UNTESTED}`,
    `- Manual pending: ${report.Coverage.MANUAL}`,
    `- Not applicable: ${report.Coverage.NOT_APPLICABLE}`,
    `- P0 not covered: ${report.Coverage.P0NotCovered}`,
    '',
    '## Baseline, Alignment, Evidence, and Flaky',
    '',
    `- Baseline: ${JSON.stringify(report.Baseline)}`,
    `- SourceRuntimeAlignment: ${JSON.stringify(report.SourceRuntimeAlignment)}`,
    `- Evidence: ${JSON.stringify(report.EvidenceSummary)}`,
    `- Flaky: ${JSON.stringify(report.FlakySummary)}`,
    '',
    '## Critical Findings',
    '',
    ...(report.CriticalFindings.length ? report.CriticalFindings.map((finding) => `- ${finding}`) : ['- None']),
    '',
    `## Overall: ${report.OverallResult}`,
    '',
  ].join('\n');
}

export function aggregateResults(input: AggregationInput): AggregatedReport {
  const environmentIssues = validateEnvironmentProfile(input.Environment);
  const results = normalizeResults(input);
  const coverageItems: CoverageItem[] = input.CoverageItems ?? results.map((result) => ({
    TestCaseId: result.TestCaseId,
    Priority: undefined,
    ApplicabilityStatus: result.ApplicabilityStatus,
    CoverageStatus: result.CoverageStatus,
  }));
  const evidenceItems = input.EvidenceItems ?? [];
  const flakyAssessments = results.map((result) => classifyFlakyResult(result));
  const requiredEvidenceResults = results.filter((result) => result.ExecutionStatus === 'FAIL' || result.ExecutionStatus === 'ERROR');
  const evidenceIds = new Set(evidenceItems.map((item) => item.EvidenceId));
  const availableEvidence = requiredEvidenceResults.filter((result) => [...result.EvidenceIds, ...result.ObservationEvidenceIds].some((id) => evidenceIds.has(id))).length;
  const missingEvidence = requiredEvidenceResults.length - availableEvidence;
  const expectedProductFailures = results.filter((result) => result.ExecutionStatus === 'FAIL' && result.AcceptanceExpectation === 'EXPECT_PRODUCT_FAIL').length;
  const unexpectedFailures = results.filter((result) => result.ExecutionStatus === 'FAIL' && result.AcceptanceExpectation !== 'EXPECT_PRODUCT_FAIL').length;
  const coverageStatuses = coverageItems.map((item) => item.CoverageStatus);
  const p0NotCovered = coverageItems.filter((item) => item.Priority === 'P0' && item.CoverageStatus === 'UNTESTED').length;
  const baseline = counts(BASELINE_STATUSES, results.map((result) => result.BaselineStatus ?? 'BASELINE_VALIDATED'));
  const alignment = counts(SOURCE_RUNTIME_ALIGNMENTS, results.map((result) => result.SourceRuntimeAlignment ?? 'UNKNOWN'));
  const flaky = counts(FLAKY_CLASSIFICATIONS, flakyAssessments.map((assessment) => assessment.FlakyClassification));
  const criticalFindings: string[] = [];
  if (environmentIssues.length > 0) criticalFindings.push(`Environment profile invalid: ${environmentIssues.join('; ')}`);
  if (unexpectedFailures > 0) criticalFindings.push(`Unexpected product failures: ${unexpectedFailures}`);
  if (p0NotCovered > 0) criticalFindings.push(`P0 coverage not covered: ${p0NotCovered}`);
  if (missingEvidence > 0) criticalFindings.push(`Missing required evidence: ${missingEvidence}`);
  if (baseline.BASELINE_INCOMPLETE > 0) criticalFindings.push('Baseline is incomplete.');
  if (alignment.MISMATCH > 0) criticalFindings.push('Source/runtime alignment mismatch is present.');
  if (flaky.FLAKY_PASS > 0 || flaky.FLAKY_FAIL > 0) criticalFindings.push('Retry history contains Flaky behavior.');

  const execution = counts(EXECUTION_STATUSES, results.map((result) => result.ExecutionStatus));
  const gate = counts(GATE_STATUSES, results.map((result) => result.GateStatus)) as CountMap & { AcceptanceGateFailures: number };
  gate.AcceptanceGateFailures = gate.FAIL;
  const acceptance = counts(ACCEPTANCE_EXPECTATIONS, results.map((result) => result.AcceptanceExpectation ?? ''));
  const applicability = counts(APPLICABILITY_STATUSES, results.map((result) => result.ApplicabilityStatus));
  const coverage = counts(COVERAGE_STATUSES, coverageStatuses) as CountMap & { TotalCoverageItems: number; P0NotCovered: number };
  coverage.TotalCoverageItems = coverageItems.length;
  coverage.P0NotCovered = p0NotCovered;

  let overallResult: OverallResult = 'PASS';
  if (environmentIssues.length > 0 || execution.BLOCKED > 0 || baseline.BASELINE_INCOMPLETE > 0) overallResult = 'BLOCKED';
  else if (unexpectedFailures > 0 || execution.ERROR > 0 || gate.FAIL > 0 || missingEvidence > 0 || p0NotCovered > 0) overallResult = 'FAIL';
  else if (baseline.BASELINE_LIMITED > 0 || alignment.MISMATCH > 0 || gate.LIMITED > 0 || flaky.FLAKY_PASS > 0 || flaky.FLAKY_FAIL > 0) overallResult = 'PASS_WITH_LIMITATIONS';

  return {
    RunId: input.RunId,
    EnvironmentId: input.Environment.EnvironmentId,
    EnvironmentType: input.Environment.EnvironmentType,
    StartedAt: input.StartedAt,
    FinishedAt: input.FinishedAt,
    TestCaseCounts: { Total: results.length },
    Execution: execution,
    Applicability: applicability,
    Coverage: coverage,
    Baseline: baseline,
    SourceRuntimeAlignment: alignment,
    Gate: gate,
    AcceptanceExpectation: acceptance,
    DefectSummary: { ProductFailures: execution.FAIL, ExpectedProductFailures: expectedProductFailures, UnexpectedFailures: unexpectedFailures },
    EvidenceSummary: {
      RequiredEvidence: requiredEvidenceResults.length,
      AvailableEvidence: availableEvidence,
      MissingEvidence: missingEvidence,
      RedactedEvidence: evidenceItems.filter((item) => item.Redacted === true).length,
      EvidenceGate: missingEvidence === 0 ? 'PASS' : 'FAIL',
    },
    FlakySummary: { ...flaky, Retried: results.filter((result) => (result.attempts?.length ?? 0) > 1).length },
    CriticalFindings: criticalFindings,
    OverallResult: overallResult,
  };
}

export function writeAggregatedReport(input: AggregationInput, outputRoot = process.cwd()) {
  const report = aggregateResults(input);
  const safeRunId = input.RunId.replace(/[^A-Za-z0-9._-]/g, '_');
  const jsonPath = join(outputRoot, 'artifacts', 'platform', safeRunId, 'platform-summary.json');
  const markdownPath = join(outputRoot, 'reports', 'generated', 'platform-summary.md');
  mkdirSync(join(outputRoot, 'artifacts', 'platform', safeRunId), { recursive: true });
  mkdirSync(join(outputRoot, 'reports', 'generated'), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  return { report, jsonPath, markdownPath };
}
