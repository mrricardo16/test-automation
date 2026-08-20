import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const requiredFiles = [
  'tsconfig.platform.json',
  'eslint.config.mjs',
  'contracts/schemas/execution-result.schema.json',
  'contracts/schemas/evidence-index.schema.json',
  'contracts/schemas/environment-profile.schema.json',
  'config/environments.example.json',
  'scripts/platform/contract-types.ts',
  'scripts/platform/validate-contracts.ts',
  'tests/api/synthetic/api-fixtures.ts',
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(repoRoot, relativePath))) throw new Error(`Required platform file is missing: ${relativePath}`);
}

const utf8Paths = [
  ...requiredFiles,
  'scripts/platform/agent-acceptance-procedure.mjs',
  'scripts/platform/validate-agent-acceptance-procedure.mjs',
  'scripts/platform/verify-negative-types.mjs',
  'scripts/platform/run-skill-tests.mjs',
  'scripts/platform/run-platform-validation.mjs',
  'scripts/platform/run-platform-tests.mjs',
  'scripts/platform/run-platform-quality.mjs',
  'scripts/platform/report-governance.mjs',
  'scripts/platform/load-environment.ts',
  'scripts/platform/flaky-policy.ts',
  'scripts/platform/aggregate-results.ts',
];
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
for (const relativePath of utf8Paths) strictUtf8.decode(readFileSync(resolve(repoRoot, relativePath)));
console.log('UTF8_SCAN=PASS');

for (const relativePath of [
  'contracts/schemas/execution-result.schema.json',
  'contracts/schemas/evidence-index.schema.json',
  'contracts/schemas/environment-profile.schema.json',
  'config/environments.example.json',
]) {
  JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8'));
}
console.log('SCHEMA_PARSE=PASS');

const executablePaths = [
  'scripts/platform/run-skill-tests.mjs',
  'scripts/platform/run-platform-validation.mjs',
  'scripts/platform/run-platform-tests.mjs',
  'scripts/platform/run-platform-quality.mjs',
  'scripts/platform/report-governance.mjs',
  'scripts/platform/verify-negative-types.mjs',
  'tests/api/synthetic/api-fixtures.ts',
  'tests/api/synthetic/helpers/api-evidence.ts',
];
const forbidden = [
  'config/' + 'local-projects.json',
  'localhost:' + '8223',
  'D:\\' + 'HZ_RSS40',
  'E:\\' + 'logclient',
  'HZ.' + 'LogClient.dll',
  'task' + 'kill',
  '/' + 'IM',
  'kill' + 'all',
];
for (const relativePath of executablePaths) {
  const content = readFileSync(resolve(repoRoot, relativePath), 'utf8');
  for (const literal of forbidden) if (content.includes(literal)) throw new Error(`Forbidden executable reference ${literal} in ${relativePath}`);
  if (/process\.kill\s*\(\s*-1/.test(content)) throw new Error(`Broad process kill in ${relativePath}`);
}
console.log('EXECUTABLE_SAFETY_SCAN=PASS');

const procedure = spawnSync(process.execPath, ['scripts/platform/validate-agent-acceptance-procedure.mjs'], { cwd: repoRoot, encoding: 'utf8' });
if (procedure.status !== 0) process.exit(procedure.status ?? 1);
console.log('STATIC_PLATFORM_VALIDATION=PASS');
