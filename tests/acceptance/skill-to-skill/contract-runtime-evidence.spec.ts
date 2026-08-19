import { test, expect, request } from '@playwright/test';

import { validateExecutionResult } from '../../../scripts/platform/validate-contracts';
let evaluateAcceptanceExpectation;

test.beforeAll(async () => {
  ({ evaluateAcceptanceExpectation } = await import('./helpers/contract-acceptance.mjs'));
});

test('TC-SYN-ACCEPTANCE-003 records runtime observation and expected product failure separately', async () => {
  const { startSyntheticRuntime } = await import('../../../scripts/platform/synthetic-runtime.mjs');
  const runtime = await startSyntheticRuntime();
  const context = await request.newContext();
  try {
    const response = await context.get(`${runtime.apiBaseUrl}/bugs/known`);
    const actual = await response.json();
    expect(response.status()).toBe(200);
    expect(actual.actual).toBe('disabled');

    const execution = {
      TestCaseId: 'TC-SYN-ACCEPTANCE-003',
      ExecutionStatus: 'FAIL',
      ApplicabilityStatus: 'APPLICABLE',
      CoverageStatus: 'COVERED',
      ExpectedBasis: 'APPROVED_BASELINE',
      AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
      EvidenceIds: ['EV-SYN-ACCEPTANCE-003'],
      ObservationEvidenceIds: ['OBS-SYN-ACCEPTANCE-003'],
      EnvironmentId: 'synthetic-ci',
      GateStatus: 'PASS',
      SourceRuntimeAlignment: 'ALIGNED',
    };

    expect(validateExecutionResult(execution)).toEqual([]);
    expect(evaluateAcceptanceExpectation(execution)).toMatchObject({
      ProductExecutionStatus: 'FAIL',
      AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
      GateStatus: 'PASS',
    });
    expect({
      RuntimeHandle: { pid: runtime.pid, ownedProcess: runtime.ownedProcess },
      baseUrl: runtime.baseUrl,
      EvidenceIds: execution.EvidenceIds,
      ObservationEvidenceIds: execution.ObservationEvidenceIds,
      ExecutionStatus: execution.ExecutionStatus,
      ExpectedBasis: execution.ExpectedBasis,
      AcceptanceExpectation: execution.AcceptanceExpectation,
      GateStatus: execution.GateStatus,
    }).toMatchObject({
      RuntimeHandle: { ownedProcess: true },
      ExecutionStatus: 'FAIL',
      GateStatus: 'PASS',
    });
    expect(new URL(runtime.baseUrl).hostname).toBe('127.0.0.1');
  } finally {
    await context.dispose();
    await runtime.close();
  }

  expect(runtime.shutdownVerified).toBe(true);
});
