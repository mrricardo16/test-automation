import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const playwrightCli = resolve(repoRoot, 'node_modules/@playwright/test/cli.js');
const reporter = ['--reporter=line'];

const suites = {
  web: [['test', 'tests/web/synthetic-product-runtime.spec.ts', ...reporter]],
  api: [['test', '--config=tests/api/synthetic/playwright.config.ts', ...reporter]],
  contracts: [['test', 'tests/web/platform-contract-validator.spec.ts', ...reporter]],
  synthetic: [
    ['test', 'tests/web/synthetic-product-runtime.spec.ts', ...reporter],
    ['test', '--config=tests/api/synthetic/playwright.config.ts', ...reporter],
    ['test', '--config=tests/acceptance/skill-to-skill/playwright.config.ts', ...reporter],
  ],
};

const suiteName = process.argv[2];
if (!suiteName || !suites[suiteName]) throw new Error(`Unknown platform test suite: ${suiteName ?? '<missing>'}`);
for (const args of suites[suiteName]) {
  const result = spawnSync(process.execPath, [playwrightCli, ...args], { cwd: repoRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`PLATFORM_TEST_SUITE=${suiteName}:PASS`);
