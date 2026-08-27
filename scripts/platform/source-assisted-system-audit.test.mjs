import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSourceAssistedAudit } from './source-assisted-system-audit.mjs';

test('TC-SYN-SOURCE-AUDIT-001 keeps source observations out of Expected and blocks unsafe formal execution', () => {
  const result = buildSourceAssistedAudit({
    inventory: { backend: { endpoints: [] }, frontend: { apiFunctions: [], routes: [] }, backendUnmatched: [] },
    catalog: { TestCases: [{ TestCaseId: 'TC-TLIFE-CANCEL-001', ExpectedStatus: 'EXPECTED_PENDING', ExpectationGapId: 'GAP-1', ExpectedResult: 'pending' }] },
    handoff: { HandoffRunId: 'TEST-HANDOFF', IntegrityStatus: 'PASS' },
    flowText: 'FL-TASK-01\nFL-TASK-02\nFL-TASK-03\nFL-TASK-04\nFL-TASK-05\nFL-TASK-06\nFL-TASK-07\nFL-TASK-08\nFL-TASK-09\nFL-TASK-10',
    readiness: {},
    runId: 'TEST-RUN',
  });

  assert.equal(result.flowCoverage.length, 10);
  assert.equal(result.finalCatalog.TestCaseCount, 11);
  assert.equal(result.formalManifest.ExecutionManifestCases.length, 0);
  assert.equal(result.readiness.FormalFlowExecutionGate, 'BLOCKED');
  assert.ok(result.sourceDesignAudit.FindingClassifications.includes('SOURCE_DISCOVERED_NEEDS_AUTHORITY'));
  assert.equal(result.sourceDesignAudit.authorityExpectedIsNeverSourceObservation, true);
});
