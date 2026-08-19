import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const commands = [
  ['typecheck', process.execPath, [resolve(repoRoot, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', 'tsconfig.platform.json']],
  ['lint', process.execPath, [resolve(repoRoot, 'node_modules/eslint/bin/eslint.js'), 'scripts/platform/**/*.ts', 'tests/acceptance/**/*.ts', 'tests/api/synthetic/**/*.ts', 'tests/types/**/*.ts', 'tests/web/platform-contract-validator.spec.ts', 'tests/web/synthetic-product-runtime.spec.ts', '--config', 'eslint.config.mjs']],
  ['test:contracts', process.execPath, [resolve(repoRoot, 'scripts/platform/run-platform-tests.mjs'), 'contracts']],
  ['test:skills', process.execPath, [resolve(repoRoot, 'scripts/platform/run-skill-tests.mjs')]],
  ['test:synthetic', process.execPath, [resolve(repoRoot, 'scripts/platform/run-platform-tests.mjs'), 'synthetic']],
];
for (const [label, command, args] of commands) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`${label} failed`);
    process.exit(result.status ?? 1);
  }
}
console.log('TEST_PLATFORM=PASS');
