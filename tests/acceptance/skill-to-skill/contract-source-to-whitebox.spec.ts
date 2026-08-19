import { test, expect } from '@playwright/test';
import { validateExecutionResult, validateTestCase } from '../../../scripts/platform/validate-contracts';

let helpers;

test.beforeAll(async () => {
  helpers = await import('./helpers/contract-acceptance.mjs');
});

test('TC-SYN-CONTRACT-002 builds a validated aligned White-box baseline', async () => {
  const source = await helpers.loadSyntheticSourceContract();
  const artifacts = helpers.buildSourceWhiteboxArtifacts(source, 'BASELINE_VALIDATED', 'ALIGNED');

  expect(artifacts.baseline.BaselineStatus).toBe('BASELINE_VALIDATED');
  expect(artifacts.baseline.SourceRuntimeAlignment).toBe('ALIGNED');
  expect(artifacts.execution.ExpectedBasis).toBe('APPROVED_BASELINE');
  expect(artifacts.coverage.TestCaseId).toBe(artifacts.testCase.TestCaseId);
  expect(artifacts.execution.TestCaseId).toBe(artifacts.testCase.TestCaseId);
  expect(artifacts.rootCause.regressionType).toBe('IMPLEMENTATION_REGRESSION');
  expect(validateExecutionResult(artifacts.execution)).toEqual([]);
  expect(validateTestCase(artifacts.testCase)).toEqual([]);
  expect(artifacts.validationIssues).toEqual([]);
});

test('TC-SYN-ACCEPTANCE-002 represents limited and incomplete baselines without false PASS', async () => {
  const source = await helpers.loadSyntheticSourceContract();
  const limited = helpers.buildSourceWhiteboxArtifacts(source, 'BASELINE_LIMITED', 'UNKNOWN');
  const incomplete = helpers.buildSourceWhiteboxArtifacts(source, 'BASELINE_INCOMPLETE', 'MISMATCH');

  expect(limited.baseline.GateStatus).toBe('LIMITED');
  expect(limited.execution.GateStatus).toBe('LIMITED');
  expect(incomplete.baseline.GateStatus).toBe('FAIL');
  expect(incomplete.execution.ExecutionStatus).toBe('BLOCKED');
  expect(incomplete.execution.GateStatus).toBe('FAIL');
  expect(incomplete.execution.SourceRuntimeAlignment).toBe('MISMATCH');
  expect(validateExecutionResult(limited.execution)).toEqual([]);
  expect(validateExecutionResult(incomplete.execution)).toEqual([]);
});
