import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixturePath = resolve(repoRoot, 'tests/types/negative-contracts.ts');
const contractTypesPath = resolve(repoRoot, 'scripts/platform/contract-types.ts');
const compilerPath = resolve(repoRoot, 'node_modules/typescript/bin/tsc');
const tempRoot = mkdtempSync(join(tmpdir(), 'automated-testing-negative-types-'));
const tempFixture = join(tempRoot, 'tests', 'types', 'negative-contracts.ts');
const tempContractTypes = join(tempRoot, 'scripts', 'platform', 'contract-types.ts');
const tempConfig = join(tempRoot, 'tsconfig.json');

try {
  if (!existsSync(compilerPath)) {
    process.stderr.write('TypeScript compiler is not installed.\n');
    process.exitCode = 2;
  } else {
  const source = readFileSync(fixturePath, 'utf8').replace(/^\s*\/\/\s*@ts-expect-error[^\r\n]*\r?\n/gm, '');
  mkdirSync(dirname(tempFixture), { recursive: true });
  mkdirSync(dirname(tempContractTypes), { recursive: true });
  writeFileSync(tempFixture, source, 'utf8');
  copyFileSync(contractTypesPath, tempContractTypes);
  writeFileSync(tempConfig, JSON.stringify({
    compilerOptions: {
      noEmit: true,
      strict: true,
      target: 'ES2022',
      module: 'CommonJS',
      moduleResolution: 'Node',
      skipLibCheck: true,
      types: ['node'],
    },
    files: [tempFixture],
  }, null, 2), 'utf8');

  const result = spawnSync(process.execPath, [compilerPath, '--noEmit', '-p', tempConfig], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.error?.code === 'MODULE_NOT_FOUND' || result.error?.code === 'ENOENT') {
    process.stderr.write('TypeScript compiler is not installed.\n');
    process.exitCode = 2;
  } else if (result.status === 0) {
    process.stderr.write('NEGATIVE_TYPECHECK=FAIL expected compiler errors were accepted.\n');
    process.exitCode = 1;
  } else {
    process.stdout.write('NEGATIVE_TYPECHECK=PASS\n');
  }
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
