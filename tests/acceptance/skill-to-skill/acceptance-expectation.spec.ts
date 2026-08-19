import { test, expect } from '@playwright/test';

let helpers;

test.beforeAll(async () => {
  helpers = await import('./helpers/contract-acceptance.mjs');
});

test('TC-SYN-ACCEPTANCE-001 evaluates all canonical AcceptanceExpectation values', async () => {
  const cases = [
    ['EXPECT_PASS', { ExecutionStatus: 'PASS' }],
    ['EXPECT_PRODUCT_FAIL', { ExecutionStatus: 'FAIL' }],
    ['EXPECT_BLOCKED', { ExecutionStatus: 'BLOCKED' }],
    ['EXPECT_MANUAL', { ExecutionStatus: 'MANUAL' }],
    ['EXPECT_BASELINE_LIMITED', { ExecutionStatus: 'SKIPPED', BaselineStatus: 'BASELINE_LIMITED' }],
  ];

  for (const [expectation, execution] of cases) {
    expect(helpers.evaluateAcceptanceExpectation({ AcceptanceExpectation: expectation, ...execution }).GateStatus).toBe('PASS');
  }
});

test('TC-SYN-ACCEPTANCE-001 keeps known product failure separate from acceptance gate', async () => {
  const source = await helpers.loadSyntheticSourceContract();
  const knownBug = helpers.buildKnownBugExecution(source);

  expect(knownBug.ExecutionStatus).toBe('FAIL');
  expect(knownBug.AcceptanceExpectation).toBe('EXPECT_PRODUCT_FAIL');
  expect(helpers.evaluateAcceptanceExpectation(knownBug).GateStatus).toBe('PASS');
  expect(knownBug.ExecutionStatus).not.toBe('PASS');
});

test('TC-SYN-ACCEPTANCE-001 fails the gate when an expected product failure becomes PASS', () => {
  const result = helpers.evaluateAcceptanceExpectation({
    AcceptanceExpectation: 'EXPECT_PRODUCT_FAIL',
    ExecutionStatus: 'PASS',
  });

  expect(result.GateStatus).toBe('FAIL');
});
