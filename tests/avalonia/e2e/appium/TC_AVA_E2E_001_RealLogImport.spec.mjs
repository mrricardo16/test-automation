import fs from 'node:fs';
import test from 'node:test';
import { loadProjectConfig } from '../helpers/project-config.mjs';
import { runEnvironmentProbe } from '../helpers/appium-session.mjs';

test('TC-AVA-E2E-001 imports the approved real log package through the desktop picker', async (t) => {
  const packagePath = process.env.LOGCLIENT_TEST_PACKAGE;
  if (!packagePath || !fs.existsSync(packagePath)) {
    t.skip('BLOCKED: no approved non-sensitive parser-valid LOGCLIENT_TEST_PACKAGE is configured.');
    return;
  }

  const config = loadProjectConfig();
  const environment = await runEnvironmentProbe();
  if (environment.status !== 'PASS') {
    t.skip(`${environment.status}: ${environment.reason}`);
    return;
  }

  t.skip(
    `BLOCKED: the real file-picker flow requires a live session continuation; ` +
      `the current environment result was captured for ${config.executablePath}.`,
  );
});
