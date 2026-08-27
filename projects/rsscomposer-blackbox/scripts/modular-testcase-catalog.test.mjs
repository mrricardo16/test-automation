import test from 'node:test';
import assert from 'node:assert/strict';
import { buildModularCatalog } from './modular-testcase-catalog.mjs';

test('TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-002 builds the complete 22-case module-first catalog', () => {
  const catalog = buildModularCatalog();
  assert.equal(catalog.PrimaryGrouping, 'MODULE');
  assert.equal(catalog.SecondaryGrouping, 'FEATURE');
  assert.equal(catalog.StatusUsedForGrouping, false);
  assert.equal(catalog.Cases.length, 22);
  assert.equal(catalog.ModuleInventory.length, 8);
  assert.deepEqual(catalog.Cases.slice(-3).map((testCase) => testCase.TestCaseId), [
    'TC-BB-REAL-011-A',
    'TC-BB-REAL-011-B',
    'TC-BB-REAL-011-C',
  ]);
});

test('TC-PLATFORM-10-MODULAR-TESTCASE-ARCHITECTURE-002 keeps related cases contiguous independent of state', () => {
  const catalog = buildModularCatalog();
  const ids = catalog.Cases.map((testCase) => testCase.TestCaseId);
  assert.deepEqual(ids.slice(0, 3), ['TC-BB-REAL-001-A', 'TC-BB-REAL-001-B', 'TC-BB-REAL-012-C']);
  assert.deepEqual(ids.slice(3, 7), ['TC-BB-REAL-002-A', 'TC-BB-REAL-002-B', 'TC-BB-REAL-002-C', 'TC-BB-REAL-003-C']);
  assert.deepEqual(ids.slice(7, 14), [
    'TC-BB-REAL-004-A', 'TC-BB-REAL-004-B', 'TC-BB-REAL-004-C',
    'TC-BB-REAL-005-A', 'TC-BB-REAL-005-B', 'TC-BB-REAL-006-A', 'TC-BB-REAL-006-B',
  ]);
});
