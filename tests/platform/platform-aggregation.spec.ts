import { test, expect } from '@playwright/test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadEnvironment } from '../../scripts/platform/load-environment';
import { aggregateResults, writeAggregatedReport } from '../../scripts/platform/aggregate-results';
import { classifyFlakyResult } from '../../scripts/platform/flaky-policy';
import type { ContractExecutionResult } from '../../scripts/platform/contract-types';

const environment = loadEnvironment('synthetic-ci');

function execution(overrides: Partial<ContractExecutionResult> = {}): ContractExecutionResult {
  return {
    TestCaseId: 'TC-SYN-AGG-001',
    ExecutionStatus: 'PASS',
    ApplicabilityStatus: 'APPLICABLE',
    CoverageStatus: 'COVERED',
    ExpectedBasis: 'APPROVED_BASELINE',
    EvidenceIds: ['EV-SYN-AGG-001'],
    ObservationEvidenceIds: [],
    EnvironmentId: environment.EnvironmentId,
    GateStatus: 'PASS',
    BaselineStatus: 'BASELINE_VALIDATED',
    SourceRuntimeAlignment: 'ALIGNED',
    ...overrides,
  };
}

function aggregate(executionResults: ContractExecutionResult[], extra: Record<string, unknown> = {}) {
  return aggregateResults({
    RunId: 'run-platform-07-fixture',
    Environment: environment,
    StartedAt: '2026-08-20T00:00:00.000Z',
    FinishedAt: '2026-08-20T00:00:01.000Z',
    ExecutionResults: executionResults,
    CoverageItems: executionResults.map((item, index) => ({
      TestCaseId: item.TestCaseId,
      Priority: index === 0 ? 'P0' : 'P1',
      ApplicabilityStatus: item.ApplicabilityStatus,
      CoverageStatus: item.CoverageStatus,
    })),
    EvidenceItems: [{ EvidenceId: 'EV-SYN-AGG-001', Redacted: true }],
    ...extra,
  });
}

test('TC-PLATFORM-07-AGG-001 preserves known product FAIL and passes its acceptance gate', () => {
  const report = aggregate([
    execution({
      TestCaseId: 'TC-SYN-BUG-001',
      ExecutionStatus: 'FAIL',
      AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
      EvidenceIds: ['EV-SYN-BUG-001'],
    }),
  ], { EvidenceItems: [{ EvidenceId: 'EV-SYN-BUG-001', Redacted: true }] });

  expect(report.DefectSummary.ProductFailures).toBe(1);
  expect(report.DefectSummary.ExpectedProductFailures).toBe(1);
  expect(report.DefectSummary.UnexpectedFailures).toBe(0);
  expect(report.Gate.AcceptanceGateFailures).toBe(0);
  expect(report.OverallResult).toBe('PASS');
});

test('TC-PLATFORM-07-AGG-001 fails overall for an unexpected product FAIL', () => {
  const report = aggregate([execution({
    ExecutionStatus: 'FAIL',
    AcceptanceExpectation: 'EXPECT_PASS',
    GateStatus: 'FAIL',
  })]);

  expect(report.DefectSummary.UnexpectedFailures).toBe(1);
  expect(report.OverallResult).toBe('FAIL');
});

test('TC-PLATFORM-07-AGG-001 reports baseline, alignment, evidence, and P0 coverage limitations', () => {
  const report = aggregate([execution({
    ExecutionStatus: 'ERROR',
    BaselineStatus: 'BASELINE_LIMITED',
    SourceRuntimeAlignment: 'MISMATCH',
    EvidenceIds: [],
    CoverageStatus: 'UNTESTED',
  })], { EvidenceItems: [] });

  expect(report.Baseline.BASELINE_LIMITED).toBe(1);
  expect(report.SourceRuntimeAlignment.MISMATCH).toBe(1);
  expect(report.EvidenceSummary.MissingEvidence).toBe(1);
  expect(report.Coverage.P0NotCovered).toBe(1);
  expect(report.OverallResult).toBe('FAIL');
});

test('TC-PLATFORM-07-AGG-001 blocks an incomplete baseline', () => {
  const report = aggregate([execution({
    BaselineStatus: 'BASELINE_INCOMPLETE',
    GateStatus: 'FAIL',
    ExecutionStatus: 'BLOCKED',
    CoverageStatus: 'UNTESTED',
  })]);

  expect(report.OverallResult).toBe('BLOCKED');
});

test('TC-PLATFORM-07-AGG-001 marks an aligned execution with mismatch as limited', () => {
  const report = aggregate([execution({ SourceRuntimeAlignment: 'MISMATCH' })]);

  expect(report.SourceRuntimeAlignment.MISMATCH).toBe(1);
  expect(report.OverallResult).toBe('PASS_WITH_LIMITATIONS');
  expect(report.CriticalFindings).toContain('Source/runtime alignment mismatch is present.');
});

test('TC-PLATFORM-07-AGG-001 writes JSON source of truth and Markdown render', () => {
  const outputRoot = mkdtempSync(join(tmpdir(), 'platform-07-'));
  const output = writeAggregatedReport({
    RunId: 'run-platform-07-output',
    Environment: environment,
    StartedAt: '2026-08-20T00:00:00.000Z',
    FinishedAt: '2026-08-20T00:00:01.000Z',
    ExecutionResults: [execution()],
    CoverageItems: [{ TestCaseId: 'TC-SYN-AGG-001', Priority: 'P0', ApplicabilityStatus: 'APPLICABLE', CoverageStatus: 'COVERED' }],
    EvidenceItems: [{ EvidenceId: 'EV-SYN-AGG-001', Redacted: true }],
  }, outputRoot);

  expect(JSON.parse(readFileSync(output.jsonPath, 'utf8')).RunId).toBe('run-platform-07-output');
  expect(readFileSync(output.markdownPath, 'utf8')).toContain('# Platform Run Summary');
});

test('TC-PLATFORM-07-FLAKY-001 retains first failure evidence for FAIL to PASS', () => {
  const result = classifyFlakyResult({
    ...execution({ ExecutionStatus: 'PASS', EvidenceIds: ['EV-SECOND'] }),
    attemptCount: 2,
    attempts: [
      { attempt: 1, ExecutionStatus: 'FAIL', EvidenceIds: ['EV-FIRST'] },
      { attempt: 2, ExecutionStatus: 'PASS', EvidenceIds: ['EV-SECOND'] },
    ],
  });

  expect(result.FlakyClassification).toBe('FLAKY_PASS');
  expect(result.firstFailureEvidence).toEqual(['EV-FIRST']);
  expect(result.retryResult).toBe('PASS');
});

test('TC-PLATFORM-07-FLAKY-001 does not classify a single expected product FAIL as flaky', () => {
  const result = classifyFlakyResult(execution({
    ExecutionStatus: 'FAIL',
    AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
    EvidenceIds: ['EV-BUG'],
  }));

  expect(result.FlakyClassification).toBe('NOT_FLAKY');
  expect(result.firstFailureEvidence).toEqual([]);
});
