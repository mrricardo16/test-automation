import test from 'node:test';
import assert from 'node:assert/strict';
import { runEnvironmentProbe } from '../helpers/appium-session.mjs';

test('TC-AVA-E2E-ENV-001 connects to the real HZ.LogClient window', async (t) => {
  const result = await runEnvironmentProbe();

  if (result.status === 'BLOCKED') {
    t.skip(result.reason);
    return;
  }

  assert.equal(result.status, 'PASS', result.reason);
  assert.match(result.pageSource, /Window|HZ\.LogClient/i);
  assert.ok(result.sessionId);
});
