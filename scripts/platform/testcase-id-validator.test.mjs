import test from 'node:test';
import assert from 'node:assert/strict';

import { CURRENT_TESTCASE_ID_PATTERN, LEGACY_HISTORICAL_ID_PATTERN, isAllowedCurrentTestCaseId, validateStableTestCaseIds } from './testcase-id-validator.mjs';

test('stable ID format accepts a feature-operation-sequence ID', () => {
  assert.equal(CURRENT_TESTCASE_ID_PATTERN.test('TC-USER-CREATE-001'), true);
});

test('stable ID format rejects generation and state tokens', () => {
  assert.equal(isAllowedCurrentTestCaseId('TC-BB-PENDING-USER-CREATE-001'), false);
  assert.equal(isAllowedCurrentTestCaseId('TC-USER-STATE-001'), false);
});

test('legacy historical ID remains a separate accepted format', () => {
  assert.equal(LEGACY_HISTORICAL_ID_PATTERN.test('TC-BB-REAL-001-A'), true);
});

test('current catalog and report pass stable ID reconciliation', () => {
  assert.deepEqual(validateStableTestCaseIds(), []);
});
