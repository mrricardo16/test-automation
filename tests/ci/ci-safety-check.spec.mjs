import test from 'node:test';
import assert from 'node:assert/strict';
import { findSafetyIssues } from '../../scripts/platform/ci-safety-check.mjs';

test('TC-PLATFORM-06-CI-SAFETY-001 rejects unsafe workflow and command surfaces', () => {
  const issues = findSafetyIssues({
    workflowText: 'run: npm run test:platform\nenv: WEB_TEST_BASE_URL=http://localhost:8223',
    packageScripts: { 'test:platform': 'playwright test tests/web/real-project' },
    executableTexts: { runner: 'D:\\HZ_RSS40\\app\\HZ.LogClient.dll' },
  });

  assert.ok(issues.some((issue) => issue.includes('WEB_TEST_BASE_URL')));
  assert.ok(issues.some((issue) => issue.includes('real-project')));
  assert.ok(issues.some((issue) => issue.includes('HZ.LogClient.dll')));
});

test('TC-PLATFORM-06-CI-SAFETY-001 accepts the Synthetic-only command surface', () => {
  const issues = findSafetyIssues({
    workflowText: 'npm ci\nnpx playwright install --with-deps chromium\nnpm run test:ci\nubuntu-latest\nnode-version: 24\ncontents: read',
    packageScripts: {
      'test:web': 'node scripts/platform/run-platform-tests.mjs web',
      'test:api': 'node scripts/platform/run-platform-tests.mjs api',
      'test:synthetic': 'node scripts/platform/run-platform-tests.mjs synthetic',
      'test:platform': 'node scripts/platform/run-platform-quality.mjs',
      'test:ci': 'npm run ci:safety && npm run validate && npm run test:platform',
    },
    executableTexts: {
      runner: 'startSyntheticRuntime({ host: \'127.0.0.1\', port: 0 })',
    },
  });

  assert.deepEqual(issues, []);
});
