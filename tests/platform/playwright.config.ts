import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['line']],
  outputDir: 'projects/test-workflow/artifacts/platform/test-results',
  use: { browserName: 'chromium' },
});
