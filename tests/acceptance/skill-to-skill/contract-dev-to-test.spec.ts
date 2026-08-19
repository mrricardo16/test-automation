import { test, expect } from '@playwright/test';
import { validateExecutionResult, validateTestCase } from '../../../scripts/platform/validate-contracts';

let helpers: typeof import('./helpers/contract-acceptance.mjs');

test.beforeAll(async () => {
  helpers = await import('./helpers/contract-acceptance.mjs');
});

test('TC-SYN-CONTRACT-001 keeps DEV handoff Expected read-only and traceable', async () => {
  const source = await helpers.loadSyntheticSourceContract();
  const artifacts = helpers.buildDevToTestArtifacts(source);

  expect(artifacts.handoff.readOnlyExpected).toBe(true);
  expect(artifacts.handoff.ExpectedBasis).toBe('HANDOFF_BASELINE');
  expect(artifacts.handoff.ExpectedBasis).not.toBe('CODE_BEHAVIOR');
  expect(artifacts.handoff.stableIds).toEqual(source.stableIds);
  expect(artifacts.coverage.TestCaseId).toBe(artifacts.testCase.TestCaseId);
  expect(artifacts.execution.TestCaseId).toBe(artifacts.testCase.TestCaseId);
  expect(artifacts.execution.EvidenceIds).toEqual(artifacts.evidence.map((item) => item.EvidenceId));
  expect(artifacts.feedback.TestCaseId).toBe(artifacts.execution.TestCaseId);
  expect(validateExecutionResult(artifacts.execution)).toEqual([]);
  expect(validateTestCase(artifacts.testCase)).toEqual([]);
  expect(artifacts.validationIssues).toEqual([]);
});

test('TC-SYN-CONTRACT-001 preserves Handoff Expected when Runtime Observation mismatches', async () => {
  const source = await helpers.loadSyntheticSourceContract();
  const artifacts = helpers.buildDevToTestArtifacts(source, {
    runtimeObservation: { expected: 'enabled', actual: 'disabled' },
  });

  expect(artifacts.handoff.ExpectedBasis).toBe('HANDOFF_BASELINE');
  expect(artifacts.handoff.expected.featureFlag).toBe('enabled');
  expect(artifacts.execution.SourceRuntimeAlignment).toBe('MISMATCH');
  expect(artifacts.execution.ObservationEvidenceIds).toHaveLength(1);
  expect(artifacts.evidence[0].Kind).toBe('OBSERVATION');
  expect(artifacts.feedback.mismatchPreserved).toBe(true);
  expect(validateExecutionResult(artifacts.execution)).toEqual([]);
});
