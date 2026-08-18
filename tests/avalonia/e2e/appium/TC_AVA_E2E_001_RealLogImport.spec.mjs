import test from 'node:test';
import assert from 'node:assert/strict';
import { runRealImport } from '../helpers/real-import-session.mjs';

test('TC-AVA-E2E-001 imports the approved real log package through the desktop picker', async (t) => {
  const result = await runRealImport();
  if (result.status === 'BLOCKED' || result.status === 'BLOCKED_TEST_DATA') {
    assert.match(result.reason, /^BLOCKED/);
    t.skip(`${result.status}: ${result.reason}`);
    return;
  }
  await t.test('execution evidence is written', async () => {
    assert.ok(result.steps.length > 0);
  });
  assert.equal(result.status, 'PASS', result.reason);
  assert.equal(result.selectedFiles.length, 3);
});
