import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  outputDir: 'projects/test-workflow/artifacts/api/playwright',
  use: {
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
});
